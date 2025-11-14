-- ==================================================================
-- CRITICAL DATABASE FIXES
-- Fix all blocking database issues identified in quality check
-- ==================================================================

-- ==================================================================
-- ISSUE #1: Missing joined_at column in user_organizations
-- Error: column user_organizations.joined_at does not exist
-- ==================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_organizations'
        AND column_name = 'joined_at'
    ) THEN
        ALTER TABLE user_organizations
        ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

        -- Update existing rows with created_at value or current timestamp
        UPDATE user_organizations
        SET joined_at = COALESCE(created_at, NOW())
        WHERE joined_at IS NULL;

        RAISE NOTICE 'Added joined_at column to user_organizations';
    ELSE
        RAISE NOTICE 'joined_at column already exists in user_organizations';
    END IF;
END $$;

-- ==================================================================
-- ISSUE #2: Missing foreign key constraint for consultant.manager_id
-- Error: Could not find a relationship between 'consultant' and 'consultant'
-- ==================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'consultant_manager_id_fkey'
        AND table_name = 'consultant'
    ) THEN
        -- Add foreign key constraint for self-referential manager relationship
        ALTER TABLE consultant
        ADD CONSTRAINT consultant_manager_id_fkey
        FOREIGN KEY (manager_id)
        REFERENCES consultant(id)
        ON DELETE SET NULL;

        RAISE NOTICE 'Added consultant_manager_id_fkey constraint';
    ELSE
        RAISE NOTICE 'consultant_manager_id_fkey constraint already exists';
    END IF;
END $$;

-- ==================================================================
-- ISSUE #3: Fix RLS Infinite Recursion in profiles table
-- Error: infinite recursion detected in policy for relation "profiles"
-- ==================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read for organization members" ON profiles;

-- Create new policies without circular dependencies

-- Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow organization members to read profiles of other members
-- WITHOUT recursive policy checks
CREATE POLICY "Organization members can read member profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo1
    WHERE uo1.user_id = auth.uid()
    AND uo1.organization_id IN (
      SELECT uo2.organization_id
      FROM user_organizations uo2
      WHERE uo2.user_id = profiles.id
    )
  )
);

-- ==================================================================
-- VERIFICATION QUERIES
-- Run these to verify the fixes worked
-- ==================================================================

-- Verify joined_at column exists
DO $$
BEGIN
  PERFORM column_name
  FROM information_schema.columns
  WHERE table_name = 'user_organizations' AND column_name = 'joined_at';

  IF FOUND THEN
    RAISE NOTICE '✅ joined_at column exists in user_organizations';
  ELSE
    RAISE WARNING '❌ joined_at column still missing';
  END IF;
END $$;

-- Verify foreign key constraint exists
DO $$
BEGIN
  PERFORM constraint_name
  FROM information_schema.table_constraints
  WHERE constraint_name = 'consultant_manager_id_fkey';

  IF FOUND THEN
    RAISE NOTICE '✅ consultant_manager_id_fkey constraint exists';
  ELSE
    RAISE WARNING '❌ consultant_manager_id_fkey constraint still missing';
  END IF;
END $$;

-- Verify RLS policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles';

  RAISE NOTICE '✅ Found % RLS policies on profiles table', policy_count;
END $$;

-- ==================================================================
-- NOTES
-- ==================================================================
--
-- After running this migration:
-- 1. Restart your Next.js dev server to clear caches
-- 2. Regenerate Supabase TypeScript types:
--    npx supabase gen types typescript --project-id=<id> > lib/supabase/types.ts
-- 3. Test the following flows:
--    - Viewing organizations list
--    - Accessing organization details
--    - Viewing consultant hierarchy
--    - Checking hours/stats queries
--
-- ==================================================================
