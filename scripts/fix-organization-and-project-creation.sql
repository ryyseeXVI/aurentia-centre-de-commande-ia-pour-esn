-- ==================================================================
-- FIX ORGANIZATION AND PROJECT CREATION ISSUES
-- Comprehensive fix for HTTP 500 errors when creating organizations
-- ==================================================================

-- ==================================================================
-- ISSUE #1: RLS (Row Level Security) is DISABLED on critical tables
-- Even though policies exist, they're not being enforced
-- ==================================================================

DO $$
BEGIN
    -- Enable RLS on organizations table
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on organizations table';

    -- Enable RLS on user_organizations table
    ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on user_organizations table';

    -- Enable RLS on projet (projects) table if not enabled
    ALTER TABLE projet ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on projet table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error enabling RLS: %', SQLERRM;
END $$;

-- ==================================================================
-- ISSUE #2: Verify and fix RLS policies for organizations table
-- ==================================================================

-- Drop and recreate policies to ensure they're correct

-- Policy 1: Authenticated users can create organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Users can view their organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
TO public
USING (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Only admins/owners can update organizations
DROP POLICY IF EXISTS "Only admins can update organizations" ON organizations;
CREATE POLICY "Only admins can update organizations"
ON organizations FOR UPDATE
TO public
USING (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
);

-- Policy 4: Only owners can delete organizations
DROP POLICY IF EXISTS "Only owners can delete organizations" ON organizations;
CREATE POLICY "Only owners can delete organizations"
ON organizations FOR DELETE
TO public
USING (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role = 'OWNER'
  )
);

-- ==================================================================
-- ISSUE #3: Fix user_organizations RLS policies
-- ==================================================================

-- Policy 1: Users can view their organization memberships
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
CREATE POLICY "Users can view their organization memberships"
ON user_organizations FOR SELECT
TO public
USING (user_id = auth.uid());

-- Policy 2: Users can insert their own memberships (for organization creation)
DROP POLICY IF EXISTS "Users can insert their own memberships" ON user_organizations;
CREATE POLICY "Users can insert their own memberships"
ON user_organizations FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- Policy 3: Admins can insert memberships for their organizations
DROP POLICY IF EXISTS "Admins can add members to their organizations" ON user_organizations;
CREATE POLICY "Admins can add members to their organizations"
ON user_organizations FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
);

-- Policy 4: Users can leave organizations (delete their own membership)
DROP POLICY IF EXISTS "Users can delete their own memberships" ON user_organizations;
CREATE POLICY "Users can delete their own memberships"
ON user_organizations FOR DELETE
TO public
USING (user_id = auth.uid());

-- Policy 5: Admins can remove members from their organizations
DROP POLICY IF EXISTS "Admins can remove members" ON user_organizations;
CREATE POLICY "Admins can remove members"
ON user_organizations FOR DELETE
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
);

-- ==================================================================
-- ISSUE #4: Fix projet (projects) RLS policies
-- ==================================================================

-- Policy 1: Organization members can view projects
DROP POLICY IF EXISTS "Organization members can view projects" ON projet;
CREATE POLICY "Organization members can view projects"
ON projet FOR SELECT
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Admins and managers can create projects
DROP POLICY IF EXISTS "Admins can create projects" ON projet;
CREATE POLICY "Admins can create projects"
ON projet FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER', 'MANAGER')
  )
);

-- Policy 3: Admins and project managers can update projects
DROP POLICY IF EXISTS "Admins can update projects" ON projet;
CREATE POLICY "Admins can update projects"
ON projet FOR UPDATE
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER', 'MANAGER')
  )
  OR chef_projet_id = auth.uid()
);

-- Policy 4: Only admins can delete projects
DROP POLICY IF EXISTS "Only admins can delete projects" ON projet;
CREATE POLICY "Only admins can delete projects"
ON projet FOR DELETE
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
);

-- ==================================================================
-- ISSUE #5: Verify required columns exist
-- ==================================================================

DO $$
BEGIN
    -- Check if slug column has correct constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'slug'
    ) THEN
        RAISE NOTICE '✅ organizations.slug column exists';
    ELSE
        RAISE WARNING '❌ organizations.slug column is missing!';
    END IF;

    -- Check if user_organizations has joined_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_organizations'
        AND column_name = 'joined_at'
    ) THEN
        RAISE NOTICE '✅ user_organizations.joined_at column exists';
    ELSE
        RAISE WARNING '❌ user_organizations.joined_at column is missing!';
    END IF;
END $$;

-- ==================================================================
-- ISSUE #6: Create indexes for better performance
-- ==================================================================

-- Index for organization lookups by user
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id
ON user_organizations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id
ON user_organizations(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_user_org
ON user_organizations(user_id, organization_id);

-- Index for project lookups by organization
CREATE INDEX IF NOT EXISTS idx_projet_organization_id
ON projet(organization_id);

-- Index for slug uniqueness and lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_unique
ON organizations(slug);

-- ==================================================================
-- VERIFICATION
-- ==================================================================

DO $$
DECLARE
    org_rls BOOLEAN;
    user_org_rls BOOLEAN;
    projet_rls BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if RLS is enabled
    SELECT rowsecurity INTO org_rls
    FROM pg_tables
    WHERE tablename = 'organizations' AND schemaname = 'public';

    SELECT rowsecurity INTO user_org_rls
    FROM pg_tables
    WHERE tablename = 'user_organizations' AND schemaname = 'public';

    SELECT rowsecurity INTO projet_rls
    FROM pg_tables
    WHERE tablename = 'projet' AND schemaname = 'public';

    IF org_rls THEN
        RAISE NOTICE '✅ RLS is ENABLED on organizations';
    ELSE
        RAISE WARNING '❌ RLS is DISABLED on organizations';
    END IF;

    IF user_org_rls THEN
        RAISE NOTICE '✅ RLS is ENABLED on user_organizations';
    ELSE
        RAISE WARNING '❌ RLS is DISABLED on user_organizations';
    END IF;

    IF projet_rls THEN
        RAISE NOTICE '✅ RLS is ENABLED on projet';
    ELSE
        RAISE WARNING '❌ RLS is DISABLED on projet';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'organizations';
    RAISE NOTICE '✅ organizations table has % RLS policies', policy_count;

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'user_organizations';
    RAISE NOTICE '✅ user_organizations table has % RLS policies', policy_count;

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'projet';
    RAISE NOTICE '✅ projet table has % RLS policies', policy_count;
END $$;

-- ==================================================================
-- NOTES
-- ==================================================================
--
-- After running this migration:
-- 1. RLS will be ENABLED on organizations, user_organizations, and projet tables
-- 2. Proper RLS policies will be in place for multi-tenant data isolation
-- 3. Users can create organizations and automatically become the first member
-- 4. Admins/Owners can manage their organizations and members
-- 5. Projects are properly scoped to organizations
--
-- Test the following:
-- 1. Create a new organization (should work)
-- 2. Create a project within an organization (should work for admins)
-- 3. View organizations list (should only show user's organizations)
-- 4. Try to access another organization's data (should be blocked by RLS)
--
-- ==================================================================
