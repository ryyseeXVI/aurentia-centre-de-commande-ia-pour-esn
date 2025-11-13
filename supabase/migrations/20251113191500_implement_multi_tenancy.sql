-- Implement Multi-Tenancy with Organizations
-- Migration: 20251113191500_implement_multi_tenancy
-- Purpose: Add organization support for workspace isolation and multi-tenant SaaS architecture

-- ============================================================================
-- PHASE 1: CREATE ORGANIZATIONS AND USER_ORGANIZATIONS TABLES
-- ============================================================================

-- Organizations table (one per company/workspace)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT slug_length CHECK (length(slug) >= 3 AND length(slug) <= 50)
);

-- Junction table: users ↔ organizations with role-based access
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_role CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')),
  UNIQUE(user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id
  ON user_organizations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id
  ON user_organizations(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_role
  ON user_organizations(organization_id, role);

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations table
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- RLS Policies for user_organizations table
CREATE POLICY "Users can view their organization memberships"
  ON user_organizations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can manage organization members"
  ON user_organizations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organizations_updated_at
  BEFORE UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE organizations IS 'Organizations/workspaces for multi-tenant isolation';
COMMENT ON TABLE user_organizations IS 'Junction table for user-organization membership with roles';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for organization';
COMMENT ON COLUMN user_organizations.role IS 'User role within organization: OWNER > ADMIN > MANAGER > MEMBER';

-- ============================================================================
-- PHASE 2: CREATE DEFAULT ORGANIZATION FOR EXISTING DATA
-- ============================================================================

-- Create a default organization for migrating existing data
INSERT INTO organizations (id, name, slug, description)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Default Organization',
  'default',
  'Default organization for existing data migration'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 3: ADD organization_id TO ALL TABLES
-- ============================================================================

-- Add organization_id columns (initially NULLABLE for data migration)
ALTER TABLE client ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE consultant ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE competence ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE projet ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE livrable ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE tache ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE affectation ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE temps_passe ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE incident ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE budget_projet ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE facture ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE score_sante_projet ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE detection_derive ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE prediction_risque ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE recommandation_action ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE consultant_competence ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- ============================================================================
-- PHASE 4: MIGRATE EXISTING DATA TO DEFAULT ORGANIZATION
-- ============================================================================

-- Assign all existing records to default organization
UPDATE client SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE consultant SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE competence SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE projet SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE livrable SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE tache SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE affectation SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE temps_passe SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE incident SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE budget_projet SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE facture SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE score_sante_projet SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE detection_derive SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE prediction_risque SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE recommandation_action SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE consultant_competence SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE profiles SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;

-- ============================================================================
-- PHASE 5: MAKE organization_id NOT NULL (except profiles)
-- ============================================================================

-- Enforce NOT NULL constraint after data migration
ALTER TABLE client ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consultant ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE competence ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE projet ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE livrable ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE tache ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE affectation ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE temps_passe ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE incident ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE budget_projet ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE facture ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE score_sante_projet ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE detection_derive ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE prediction_risque ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE recommandation_action ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consultant_competence ALTER COLUMN organization_id SET NOT NULL;
-- profiles.organization_id stays NULLABLE (users can exist without organization initially)

-- ============================================================================
-- PHASE 6: ADD INDEXES ON organization_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_client_organization_id ON client(organization_id);
CREATE INDEX IF NOT EXISTS idx_consultant_organization_id ON consultant(organization_id);
CREATE INDEX IF NOT EXISTS idx_competence_organization_id ON competence(organization_id);
CREATE INDEX IF NOT EXISTS idx_projet_organization_id ON projet(organization_id);
CREATE INDEX IF NOT EXISTS idx_livrable_organization_id ON livrable(organization_id);
CREATE INDEX IF NOT EXISTS idx_tache_organization_id ON tache(organization_id);
CREATE INDEX IF NOT EXISTS idx_affectation_organization_id ON affectation(organization_id);
CREATE INDEX IF NOT EXISTS idx_temps_passe_organization_id ON temps_passe(organization_id);
CREATE INDEX IF NOT EXISTS idx_incident_organization_id ON incident(organization_id);
CREATE INDEX IF NOT EXISTS idx_budget_projet_organization_id ON budget_projet(organization_id);
CREATE INDEX IF NOT EXISTS idx_facture_organization_id ON facture(organization_id);
CREATE INDEX IF NOT EXISTS idx_score_sante_projet_organization_id ON score_sante_projet(organization_id);
CREATE INDEX IF NOT EXISTS idx_detection_derive_organization_id ON detection_derive(organization_id);
CREATE INDEX IF NOT EXISTS idx_prediction_risque_organization_id ON prediction_risque(organization_id);
CREATE INDEX IF NOT EXISTS idx_recommandation_action_organization_id ON recommandation_action(organization_id);
CREATE INDEX IF NOT EXISTS idx_consultant_competence_organization_id ON consultant_competence(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id) WHERE organization_id IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projet_org_statut ON projet(organization_id, statut);
CREATE INDEX IF NOT EXISTS idx_tache_org_statut ON tache(organization_id, statut) WHERE statut IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incident_org_statut ON incident(organization_id, statut) WHERE statut IS NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- All tables now have organization_id for multi-tenant isolation
-- Next step: Update RLS policies (separate migration for clarity)
