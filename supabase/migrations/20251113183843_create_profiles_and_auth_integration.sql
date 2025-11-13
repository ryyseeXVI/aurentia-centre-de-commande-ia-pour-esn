-- =====================================================
-- Migration: Auth Integration with Profiles Table
-- Description: Add profiles table for Supabase Auth integration
--              with role-based access control
-- =====================================================

-- Create role enum type
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'CONSULTANT', 'CLIENT');

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key links to auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User information
  email VARCHAR(255) NOT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,

  -- Role for access control
  role user_role NOT NULL DEFAULT 'CONSULTANT',

  -- Optional fields
  avatar_url TEXT,
  phone VARCHAR(20),

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth with role-based access';
COMMENT ON COLUMN profiles.id IS 'References auth.users(id) - primary key';
COMMENT ON COLUMN profiles.role IS 'User role: ADMIN, MANAGER, CONSULTANT, CLIENT';

-- =====================================================
-- 2. UPDATE CONSULTANT TABLE
-- =====================================================
-- Add user_id to link consultants who are also users
ALTER TABLE consultant
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_consultant_user_id ON consultant(user_id);

COMMENT ON COLUMN consultant.user_id IS 'Optional link to profiles table for consultants who have user accounts';

-- =====================================================
-- 3. UPDATE CLIENT TABLE
-- =====================================================
-- Add user_id to link client contacts who are users
ALTER TABLE client
ADD COLUMN IF NOT EXISTS contact_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_contact_user_id ON client(contact_user_id);

COMMENT ON COLUMN client.contact_user_id IS 'Optional link to profiles table for client contacts with user accounts';

-- =====================================================
-- 4. CREATE TRIGGER FUNCTION FOR AUTO-PROFILE CREATION
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CONSULTANT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 'Auto-creates profile when new user signs up via Supabase Auth';

-- =====================================================
-- 5. CREATE UPDATED_AT TRIGGER FOR PROFILES
-- =====================================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- =====================================================
-- 6. ENABLE RLS ON PROFILES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (needed for displaying consultant names, etc.)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- =====================================================
-- 7. UPDATE RLS POLICIES FOR EXISTING TABLES
-- =====================================================

-- Consultant table: All authenticated users can view
DROP POLICY IF EXISTS "Users can view consultants" ON consultant;
CREATE POLICY "Users can view consultants"
  ON consultant
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Consultant table: Admins and Managers can manage
DROP POLICY IF EXISTS "Admins and Managers can manage consultants" ON consultant;
CREATE POLICY "Admins and Managers can manage consultants"
  ON consultant
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER')
    )
  );

-- Client table: All authenticated users can view
DROP POLICY IF EXISTS "Users can view clients" ON client;
CREATE POLICY "Users can view clients"
  ON client
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Client table: Admins and Managers can manage
DROP POLICY IF EXISTS "Admins and Managers can manage clients" ON client;
CREATE POLICY "Admins and Managers can manage clients"
  ON client
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER')
    )
  );

-- Projet table: All authenticated users can view
DROP POLICY IF EXISTS "Users can view projects" ON projet;
CREATE POLICY "Users can view projects"
  ON projet
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Projet table: Admins and Managers can manage
DROP POLICY IF EXISTS "Admins and Managers can manage projects" ON projet;
CREATE POLICY "Admins and Managers can manage projects"
  ON projet
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER')
    )
  );

-- Apply similar policies to other tables (generic pattern)
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT t FROM unnest(ARRAY[
      'competence', 'consultant_competence', 'affectation',
      'tache', 'temps_passe', 'livrable', 'incident',
      'budget_projet', 'facture', 'score_sante_projet',
      'detection_derive', 'prediction_risque', 'recommandation_action'
    ]) AS t
  LOOP
    -- All users can view
    EXECUTE format('DROP POLICY IF EXISTS "Users can view %I" ON %I', table_name, table_name);
    EXECUTE format('
      CREATE POLICY "Users can view %I"
        ON %I
        FOR SELECT
        USING (auth.uid() IS NOT NULL)
    ', table_name, table_name);

    -- Admins and Managers can manage
    EXECUTE format('DROP POLICY IF EXISTS "Admins and Managers can manage %I" ON %I', table_name, table_name);
    EXECUTE format('
      CREATE POLICY "Admins and Managers can manage %I"
        ON %I
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN (''ADMIN'', ''MANAGER'')
          )
        )
    ', table_name, table_name);
  END LOOP;
END $$;

-- Temps_passe: Consultants can create their own time entries
DROP POLICY IF EXISTS "Consultants can create own time entries" ON temps_passe;
CREATE POLICY "Consultants can create own time entries"
  ON temps_passe
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultant c
      JOIN profiles p ON c.user_id = p.id
      WHERE p.id = auth.uid()
        AND c.id = temps_passe.consultant_id
    )
  );

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
  );
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION is_admin() IS 'Returns true if current user is an admin';
COMMENT ON FUNCTION is_manager_or_admin() IS 'Returns true if current user is a manager or admin';
