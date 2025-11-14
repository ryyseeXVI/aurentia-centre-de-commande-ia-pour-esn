-- =====================================================
-- MIGRATION: Consultant Table → Profiles-Centric Architecture
-- =====================================================
-- Purpose: Eliminate consultant table duplication, consolidate around profiles
-- Strategy:
--   1. Create consultant_details for consultant-specific fields
--   2. Create profile_competences (rename from consultant_competence)
--   3. Migrate all data
--   4. Update foreign keys in all dependent tables
--   5. Drop old consultant and consultant_competence tables
-- =====================================================

-- SAFETY: Start transaction
BEGIN;

-- =====================================================
-- STEP 1: Create new tables
-- =====================================================

-- consultant_details: Consultant-specific data
CREATE TABLE IF NOT EXISTS consultant_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_embauche date NOT NULL,
  taux_journalier_cout numeric(10,2) NOT NULL,
  taux_journalier_vente numeric(10,2),
  statut text DEFAULT 'AVAILABLE',
  job_title text, -- Job title/position (e.g., "Senior Developer", "Tech Lead")
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT unique_profile_per_org UNIQUE(profile_id, organization_id),
  CONSTRAINT valid_rates CHECK (taux_journalier_cout > 0 AND (taux_journalier_vente IS NULL OR taux_journalier_vente > 0))
);

-- Enable RLS
ALTER TABLE consultant_details ENABLE ROW LEVEL SECURITY;

-- RLS Policy for consultant_details
CREATE POLICY "Users can view consultant details in their organization"
  ON consultant_details FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage consultant details"
  ON consultant_details FOR ALL
  USING (
    organization_id IN (
      SELECT uo.organization_id
      FROM user_organizations uo
      WHERE uo.user_id = auth.uid() AND uo.role IN ('ADMIN', 'MANAGER')
    )
  );

-- profile_competences: Competences for any profile (not just consultants)
CREATE TABLE IF NOT EXISTS profile_competences (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  competence_id uuid NOT NULL REFERENCES competence(id) ON DELETE CASCADE,
  niveau integer CHECK (niveau >= 1 AND niveau <= 5),
  date_evaluation date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, competence_id, organization_id)
);

-- Enable RLS
ALTER TABLE profile_competences ENABLE ROW LEVEL SECURITY;

-- RLS Policy for profile_competences
CREATE POLICY "Users can view competences in their organization"
  ON profile_competences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own competences"
  ON profile_competences FOR ALL
  USING (profile_id = auth.uid());

-- Add manager_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultant_details_profile_id ON consultant_details(profile_id);
CREATE INDEX IF NOT EXISTS idx_consultant_details_organization_id ON consultant_details(organization_id);
CREATE INDEX IF NOT EXISTS idx_profile_competences_profile_id ON profile_competences(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_competences_organization_id ON profile_competences(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);

-- =====================================================
-- STEP 2: Migrate data from consultant → profiles + consultant_details
-- =====================================================

-- 2a. For consultants WITH user_id (already have profiles):
--     Create consultant_details records
INSERT INTO consultant_details (
  profile_id,
  date_embauche,
  taux_journalier_cout,
  taux_journalier_vente,
  statut,
  job_title,
  organization_id,
  created_at,
  updated_at
)
SELECT
  user_id,
  date_embauche,
  taux_journalier_cout,
  taux_journalier_vente,
  statut,
  role, -- consultant.role is actually a job title
  organization_id,
  created_at,
  updated_at
FROM consultant
WHERE user_id IS NOT NULL
ON CONFLICT (profile_id, organization_id) DO NOTHING;

-- 2b. For consultants WITHOUT user_id:
--     Create profiles first (using consultant.id as profile.id to preserve FKs)
INSERT INTO profiles (
  id,
  email,
  nom,
  prenom,
  role,
  organization_id,
  created_at,
  updated_at
)
SELECT
  id, -- Use consultant.id as profile.id to preserve foreign keys
  email,
  nom,
  prenom,
  'CONSULTANT'::user_role, -- All consultants get CONSULTANT role (consultant.role is job title, not user role)
  organization_id,
  created_at,
  updated_at
FROM consultant
WHERE user_id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2c. Create consultant_details for newly created profiles
INSERT INTO consultant_details (
  profile_id,
  date_embauche,
  taux_journalier_cout,
  taux_journalier_vente,
  statut,
  job_title,
  organization_id,
  created_at,
  updated_at
)
SELECT
  id, -- consultant.id = profile.id now
  date_embauche,
  taux_journalier_cout,
  taux_journalier_vente,
  statut,
  role, -- consultant.role is actually a job title
  organization_id,
  created_at,
  updated_at
FROM consultant
WHERE user_id IS NULL
ON CONFLICT (profile_id, organization_id) DO NOTHING;

-- =====================================================
-- STEP 3: Migrate manager_id relationships
-- =====================================================

-- For consultants with user_id
UPDATE profiles p
SET manager_id = c.manager_id
FROM consultant c
WHERE p.id = c.user_id
  AND c.manager_id IS NOT NULL
  AND p.manager_id IS NULL;

-- For consultants without user_id (consultant.id = profile.id)
UPDATE profiles p
SET manager_id = c.manager_id
FROM consultant c
WHERE p.id = c.id
  AND c.user_id IS NULL
  AND c.manager_id IS NOT NULL
  AND p.manager_id IS NULL;

-- =====================================================
-- STEP 4: Migrate consultant_competence → profile_competences
-- =====================================================

-- For consultants with user_id
INSERT INTO profile_competences (
  profile_id,
  competence_id,
  niveau,
  date_evaluation,
  organization_id,
  created_at,
  updated_at
)
SELECT
  c.user_id,
  cc.competence_id,
  cc.niveau,
  cc.date_evaluation,
  cc.organization_id,
  cc.created_at,
  cc.updated_at
FROM consultant_competence cc
JOIN consultant c ON c.id = cc.consultant_id
WHERE c.user_id IS NOT NULL
ON CONFLICT (profile_id, competence_id, organization_id) DO NOTHING;

-- For consultants without user_id (consultant.id = profile.id)
INSERT INTO profile_competences (
  profile_id,
  competence_id,
  niveau,
  date_evaluation,
  organization_id,
  created_at,
  updated_at
)
SELECT
  cc.consultant_id, -- consultant.id = profile.id
  cc.competence_id,
  cc.niveau,
  cc.date_evaluation,
  cc.organization_id,
  cc.created_at,
  cc.updated_at
FROM consultant_competence cc
JOIN consultant c ON c.id = cc.consultant_id
WHERE c.user_id IS NULL
ON CONFLICT (profile_id, competence_id, organization_id) DO NOTHING;

-- =====================================================
-- STEP 5: Update foreign keys in all dependent tables
-- =====================================================

-- 5a. affectation: consultant_id → profile_id
-- First, update the actual ID values
UPDATE affectation a
SET consultant_id = c.user_id
FROM consultant c
WHERE a.consultant_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

-- Drop old constraint
ALTER TABLE affectation DROP CONSTRAINT IF EXISTS affectation_consultant_id_fkey;

-- Rename column
ALTER TABLE affectation RENAME COLUMN consultant_id TO profile_id;

-- Add new constraint
ALTER TABLE affectation ADD CONSTRAINT affectation_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5b. tache: consultant_responsable_id → profile_responsable_id
UPDATE tache t
SET consultant_responsable_id = c.user_id
FROM consultant c
WHERE t.consultant_responsable_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

ALTER TABLE tache DROP CONSTRAINT IF EXISTS tache_consultant_responsable_id_fkey;
ALTER TABLE tache RENAME COLUMN consultant_responsable_id TO profile_responsable_id;
ALTER TABLE tache ADD CONSTRAINT tache_profile_responsable_id_fkey
  FOREIGN KEY (profile_responsable_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5c. temps_passe: consultant_id → profile_id
UPDATE temps_passe tp
SET consultant_id = c.user_id
FROM consultant c
WHERE tp.consultant_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

ALTER TABLE temps_passe DROP CONSTRAINT IF EXISTS temps_passe_consultant_id_fkey;
ALTER TABLE temps_passe RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE temps_passe ADD CONSTRAINT temps_passe_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5d. incident: consultant_assigne_id → profile_assigne_id
UPDATE incident i
SET consultant_assigne_id = c.user_id
FROM consultant c
WHERE i.consultant_assigne_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

ALTER TABLE incident DROP CONSTRAINT IF EXISTS incident_consultant_assigne_id_fkey;
ALTER TABLE incident RENAME COLUMN consultant_assigne_id TO profile_assigne_id;
ALTER TABLE incident ADD CONSTRAINT incident_profile_assigne_id_fkey
  FOREIGN KEY (profile_assigne_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5e. detection_derive: consultant_id → profile_id
UPDATE detection_derive dd
SET consultant_id = c.user_id
FROM consultant c
WHERE dd.consultant_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

ALTER TABLE detection_derive DROP CONSTRAINT IF EXISTS detection_derive_consultant_id_fkey;
ALTER TABLE detection_derive RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE detection_derive ADD CONSTRAINT detection_derive_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5f. prediction_risque: consultant_id → profile_id
UPDATE prediction_risque pr
SET consultant_id = c.user_id
FROM consultant c
WHERE pr.consultant_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

ALTER TABLE prediction_risque DROP CONSTRAINT IF EXISTS prediction_risque_consultant_id_fkey;
ALTER TABLE prediction_risque RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE prediction_risque ADD CONSTRAINT prediction_risque_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5g. projet: chef_projet_id → chef_projet_profile_id (or keep as chef_projet_id but reference profiles)
UPDATE projet p
SET chef_projet_id = c.user_id
FROM consultant c
WHERE p.chef_projet_id = c.id
  AND c.user_id IS NOT NULL
  AND c.user_id != c.id;

ALTER TABLE projet DROP CONSTRAINT IF EXISTS projet_chef_projet_id_fkey;
-- Keep column name as chef_projet_id for backwards compatibility
ALTER TABLE projet ADD CONSTRAINT projet_chef_projet_id_fkey
  FOREIGN KEY (chef_projet_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 6: Drop old tables
-- =====================================================

-- Mark as deprecated first (can uncomment to actually drop)
COMMENT ON TABLE consultant_competence IS 'DEPRECATED: Migrated to profile_competences table. Safe to drop after verification.';
COMMENT ON TABLE consultant IS 'DEPRECATED: Migrated to profiles + consultant_details tables. Safe to drop after verification.';

-- Uncomment to actually drop (ONLY after thorough testing):
-- DROP TABLE IF EXISTS consultant_competence CASCADE;
-- DROP TABLE IF EXISTS consultant CASCADE;

-- =====================================================
-- STEP 7: Verification queries
-- =====================================================

SELECT
  'Migration completed!' AS status,
  (SELECT COUNT(*) FROM consultant_details) AS consultant_details_count,
  (SELECT COUNT(*) FROM profile_competences) AS profile_competences_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'CONSULTANT') AS consultant_profiles_count;

-- Verify no orphaned records
SELECT
  'Orphaned records check' AS check_type,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: No orphaned records'
    ELSE 'FAIL: Found orphaned records'
  END AS result
FROM consultant_details cd
LEFT JOIN profiles p ON cd.profile_id = p.id
WHERE p.id IS NULL;

-- Verify all competences migrated
SELECT
  'Competence migration check' AS check_type,
  (SELECT COUNT(*) FROM consultant_competence) AS old_count,
  (SELECT COUNT(*) FROM profile_competences) AS new_count,
  CASE
    WHEN (SELECT COUNT(*) FROM consultant_competence) <= (SELECT COUNT(*) FROM profile_competences)
    THEN 'PASS: All competences migrated'
    ELSE 'WARNING: Some competences may not have migrated'
  END AS result;

-- Verify all consultants have details
SELECT
  'Consultant details check' AS check_type,
  (SELECT COUNT(*) FROM profiles WHERE role = 'CONSULTANT') AS total_consultants,
  (SELECT COUNT(*) FROM consultant_details) AS total_details,
  CASE
    WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'CONSULTANT') = (SELECT COUNT(*) FROM consultant_details)
    THEN 'PASS: All consultants have details'
    ELSE 'WARNING: Some consultants missing details'
  END AS result;

COMMIT;

-- =====================================================
-- ROLLBACK (if needed - run this in a separate transaction)
-- =====================================================
-- If something goes wrong, you can rollback by running:
-- ROLLBACK;
--
-- Or if you've already committed and need to restore:
-- This assumes you have backups of consultant and consultant_competence tables
