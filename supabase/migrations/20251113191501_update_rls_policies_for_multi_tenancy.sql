-- Update RLS Policies for Multi-Tenancy
-- Migration: 20251113191501_update_rls_policies_for_multi_tenancy
-- Purpose: Update all RLS policies to enforce organization-scoped data access

-- ============================================================================
-- IMPORTANT: This migration updates RLS policies for organization isolation
-- After this migration, users can ONLY access data from their organizations
-- ============================================================================

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
      AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role in organization
CREATE OR REPLACE FUNCTION has_org_role(org_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND (
        (required_role = 'MEMBER' AND role IN ('MEMBER', 'MANAGER', 'ADMIN', 'OWNER')) OR
        (required_role = 'MANAGER' AND role IN ('MANAGER', 'ADMIN', 'OWNER')) OR
        (required_role = 'ADMIN' AND role IN ('ADMIN', 'OWNER')) OR
        (required_role = 'OWNER' AND role = 'OWNER')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'organizations' AND tablename != 'user_organizations') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable read access for all users', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable insert for authenticated users only', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable update for users based on email', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable delete for users based on email', r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- PROJET (Projects) - Core entity
-- ============================================================================

CREATE POLICY "org_projet_select" ON projet
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_projet_insert" ON projet
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_projet_update" ON projet
  FOR UPDATE USING (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_projet_delete" ON projet
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- CLIENT (Clients)
-- ============================================================================

CREATE POLICY "org_client_select" ON client
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_client_insert" ON client
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_client_update" ON client
  FOR UPDATE USING (has_org_role(organization_id, 'MEMBER'));

CREATE POLICY "org_client_delete" ON client
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- CONSULTANT (Consultants)
-- ============================================================================

CREATE POLICY "org_consultant_select" ON consultant
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_consultant_insert" ON consultant
  FOR INSERT WITH CHECK (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_consultant_update" ON consultant
  FOR UPDATE USING (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_consultant_delete" ON consultant
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- COMPETENCE (Skills)
-- ============================================================================

CREATE POLICY "org_competence_select" ON competence
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_competence_insert" ON competence
  FOR INSERT WITH CHECK (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_competence_update" ON competence
  FOR UPDATE USING (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_competence_delete" ON competence
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- TACHE (Tasks)
-- ============================================================================

CREATE POLICY "org_tache_select" ON tache
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_tache_insert" ON tache
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_tache_update" ON tache
  FOR UPDATE USING (is_org_member(organization_id));

CREATE POLICY "org_tache_delete" ON tache
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- LIVRABLE (Deliverables)
-- ============================================================================

CREATE POLICY "org_livrable_select" ON livrable
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_livrable_insert" ON livrable
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_livrable_update" ON livrable
  FOR UPDATE USING (is_org_member(organization_id));

CREATE POLICY "org_livrable_delete" ON livrable
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- AFFECTATION (Assignments)
-- ============================================================================

CREATE POLICY "org_affectation_select" ON affectation
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_affectation_insert" ON affectation
  FOR INSERT WITH CHECK (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_affectation_update" ON affectation
  FOR UPDATE USING (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_affectation_delete" ON affectation
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- TEMPS_PASSE (Time Tracking)
-- ============================================================================

CREATE POLICY "org_temps_passe_select" ON temps_passe
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_temps_passe_insert" ON temps_passe
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_temps_passe_update" ON temps_passe
  FOR UPDATE USING (is_org_member(organization_id));

CREATE POLICY "org_temps_passe_delete" ON temps_passe
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- INCIDENT (Incidents)
-- ============================================================================

CREATE POLICY "org_incident_select" ON incident
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_incident_insert" ON incident
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_incident_update" ON incident
  FOR UPDATE USING (is_org_member(organization_id));

CREATE POLICY "org_incident_delete" ON incident
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- BUDGET_PROJET (Project Budgets)
-- ============================================================================

CREATE POLICY "org_budget_projet_select" ON budget_projet
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_budget_projet_insert" ON budget_projet
  FOR INSERT WITH CHECK (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_budget_projet_update" ON budget_projet
  FOR UPDATE USING (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_budget_projet_delete" ON budget_projet
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- FACTURE (Invoices)
-- ============================================================================

CREATE POLICY "org_facture_select" ON facture
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_facture_insert" ON facture
  FOR INSERT WITH CHECK (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_facture_update" ON facture
  FOR UPDATE USING (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_facture_delete" ON facture
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- SCORE_SANTE_PROJET (Project Health Scores)
-- ============================================================================

CREATE POLICY "org_score_sante_projet_select" ON score_sante_projet
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_score_sante_projet_insert" ON score_sante_projet
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_score_sante_projet_update" ON score_sante_projet
  FOR UPDATE USING (has_org_role(organization_id, 'ADMIN'));

CREATE POLICY "org_score_sante_projet_delete" ON score_sante_projet
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- DETECTION_DERIVE (Drift Detection)
-- ============================================================================

CREATE POLICY "org_detection_derive_select" ON detection_derive
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_detection_derive_insert" ON detection_derive
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_detection_derive_update" ON detection_derive
  FOR UPDATE USING (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_detection_derive_delete" ON detection_derive
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- PREDICTION_RISQUE (Risk Predictions)
-- ============================================================================

CREATE POLICY "org_prediction_risque_select" ON prediction_risque
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_prediction_risque_insert" ON prediction_risque
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_prediction_risque_update" ON prediction_risque
  FOR UPDATE USING (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_prediction_risque_delete" ON prediction_risque
  FOR DELETE USING (has_org_role(organization_id, 'ADMIN'));

-- ============================================================================
-- RECOMMANDATION_ACTION (Action Recommendations)
-- ============================================================================

CREATE POLICY "org_recommandation_action_select" ON recommandation_action
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_recommandation_action_insert" ON recommandation_action
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org_recommandation_action_update" ON recommandation_action
  FOR UPDATE USING (is_org_member(organization_id));

CREATE POLICY "org_recommandation_action_delete" ON recommandation_action
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- CONSULTANT_COMPETENCE (Junction table)
-- ============================================================================

CREATE POLICY "org_consultant_competence_select" ON consultant_competence
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "org_consultant_competence_insert" ON consultant_competence
  FOR INSERT WITH CHECK (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_consultant_competence_update" ON consultant_competence
  FOR UPDATE USING (has_org_role(organization_id, 'MANAGER'));

CREATE POLICY "org_consultant_competence_delete" ON consultant_competence
  FOR DELETE USING (has_org_role(organization_id, 'MANAGER'));

-- ============================================================================
-- PROFILES (User Profiles) - Special case
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- New policies: Users can see profiles from their organizations
CREATE POLICY "org_profiles_select" ON profiles
  FOR SELECT USING (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
        AND organization_id = profiles.organization_id
    )
  );

CREATE POLICY "org_profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "org_profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- ROLE PERMISSIONS SUMMARY
-- ============================================================================

-- OWNER: Full access to everything
-- ADMIN: Can manage consultants, budgets, invoices, competences
-- MANAGER: Can manage projects, assignments, tasks, incidents
-- MEMBER: Can view and update tasks, time tracking

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Create indexes on user_organizations for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_user_orgs_uid_oid
  ON user_organizations(user_id, organization_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- All RLS policies now enforce organization-scoped access
-- Users can only access data from organizations they belong to
-- Role-based permissions are enforced for sensitive operations
