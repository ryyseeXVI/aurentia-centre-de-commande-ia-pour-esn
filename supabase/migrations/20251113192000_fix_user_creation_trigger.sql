-- Fix User Creation Trigger - Resolve user_role Type Issue
-- Migration: 20251113192000_fix_user_creation_trigger
-- Purpose: Recreate handle_new_user() function to resolve type dependency issue

-- Drop and recreate the trigger function with explicit schema qualification
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'CONSULTANT'::public.user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates profile when new user signs up via Supabase Auth';
