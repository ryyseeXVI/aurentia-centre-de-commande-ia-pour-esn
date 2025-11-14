# Consultant → Profile Migration Plan

## Overview

This document outlines the complete migration from the `consultant` table architecture to a profiles-centric architecture, where consultants are simply profiles with role="CONSULTANT".

## Current Architecture Problems

### 1. Data Duplication
- `consultant` table duplicates: `nom`, `prenom`, `email` from `profiles`
- Creates data consistency issues
- Violates DRY principle

### 2. Confusing Relationships
- `consultant.user_id` → `profiles.id` (nullable)
- Consultants can exist without user accounts
- Same person's data in two places

### 3. Foreign Key Complexity
Tables referencing `consultant_id`:
- `affectation` (assignments)
- `consultant_competence` (skills)
- `detection_derive` (drift detection)
- `incident` (incidents)
- `prediction_risque` (risk predictions)
- `tache` (tasks)
- `temps_passe` (time tracking)
- `projet.chef_projet_id` (project manager)

### 4. Limited Scope
- `consultant_competence` implies only consultants have competences
- Managers and admins also have skills

## Target Architecture

### 1. profiles (Central User Table)
**Existing fields remain unchanged:**
- `id` (uuid, PK)
- `email` (text, UNIQUE, NOT NULL)
- `nom` (text, NOT NULL)
- `prenom` (text, NOT NULL)
- `role` (enum: ADMIN, MANAGER, CONSULTANT, CLIENT)
- `avatar_url` (text, nullable)
- `phone` (text, nullable)
- `organization_id` (uuid, FK)
- `status` (enum: online, offline, away)
- `last_seen` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**NEW field to add:**
- `manager_id` (uuid, FK to profiles.id, nullable) - Reporting structure

### 2. consultant_details (NEW - Consultant-Specific Data)
```sql
CREATE TABLE consultant_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_embauche date NOT NULL,
  taux_journalier_cout numeric(10,2) NOT NULL,
  taux_journalier_vente numeric(10,2),
  statut text, -- 'AVAILABLE', 'ON_MISSION', 'ON_LEAVE', etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT unique_profile_per_org UNIQUE(profile_id, organization_id)
);

-- Enable RLS
ALTER TABLE consultant_details ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view consultant details in their organization"
  ON consultant_details FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

### 3. profile_competences (Renamed from consultant_competence)
```sql
CREATE TABLE profile_competences (
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

-- RLS Policy
CREATE POLICY "Users can view competences in their organization"
  ON profile_competences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

### 4. Updated Foreign Keys

All tables must change `consultant_id` → `profile_id`:

```sql
-- affectation
ALTER TABLE affectation RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE affectation DROP CONSTRAINT IF EXISTS affectation_consultant_id_fkey;
ALTER TABLE affectation ADD CONSTRAINT affectation_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- tache
ALTER TABLE tache RENAME COLUMN consultant_responsable_id TO profile_responsable_id;
ALTER TABLE tache DROP CONSTRAINT IF EXISTS tache_consultant_responsable_id_fkey;
ALTER TABLE tache ADD CONSTRAINT tache_profile_responsable_id_fkey
  FOREIGN KEY (profile_responsable_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- temps_passe
ALTER TABLE temps_passe RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE temps_passe DROP CONSTRAINT IF EXISTS temps_passe_consultant_id_fkey;
ALTER TABLE temps_passe ADD CONSTRAINT temps_passe_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- incident
ALTER TABLE incident RENAME COLUMN consultant_assigne_id TO profile_assigne_id;
ALTER TABLE incident DROP CONSTRAINT IF EXISTS incident_consultant_assigne_id_fkey;
ALTER TABLE incident ADD CONSTRAINT incident_profile_assigne_id_fkey
  FOREIGN KEY (profile_assigne_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- detection_derive
ALTER TABLE detection_derive RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE detection_derive DROP CONSTRAINT IF EXISTS detection_derive_consultant_id_fkey;
ALTER TABLE detection_derive ADD CONSTRAINT detection_derive_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- prediction_risque
ALTER TABLE prediction_risque RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE prediction_risque DROP CONSTRAINT IF EXISTS prediction_risque_consultant_id_fkey;
ALTER TABLE prediction_risque ADD CONSTRAINT prediction_risque_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- projet (chef_projet_id)
ALTER TABLE projet RENAME COLUMN chef_projet_id TO chef_projet_profile_id;
ALTER TABLE projet DROP CONSTRAINT IF EXISTS projet_chef_projet_id_fkey;
ALTER TABLE projet ADD CONSTRAINT projet_chef_projet_profile_id_fkey
  FOREIGN KEY (chef_projet_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
```

## Migration Strategy

### Phase 1: Database Migration (CRITICAL - Must be first)

**Step 1: Create new tables**
```sql
-- Run consultant_details and profile_competences CREATE TABLE statements
```

**Step 2: Migrate data from consultant → profiles + consultant_details**
```sql
-- For consultants that have user_id (already have profiles):
-- Just create consultant_details records
INSERT INTO consultant_details (
  profile_id,
  date_embauche,
  taux_journalier_cout,
  taux_journalier_vente,
  statut,
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
  organization_id,
  created_at,
  updated_at
FROM consultant
WHERE user_id IS NOT NULL;

-- For consultants WITHOUT user_id:
-- Create profiles first, then consultant_details
-- NOTE: These profiles won't have auth.users entries (can't log in yet)
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
  id, -- Use consultant.id as profile.id to preserve FKs
  email,
  nom,
  prenom,
  COALESCE(role, 'CONSULTANT')::user_role,
  organization_id,
  created_at,
  updated_at
FROM consultant
WHERE user_id IS NULL;

-- Then create consultant_details for these new profiles
INSERT INTO consultant_details (
  profile_id,
  date_embauche,
  taux_journalier_cout,
  taux_journalier_vente,
  statut,
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
  organization_id,
  created_at,
  updated_at
FROM consultant
WHERE user_id IS NULL;
```

**Step 3: Update manager_id references**
```sql
-- Add manager_id to profiles
ALTER TABLE profiles ADD COLUMN manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Migrate manager relationships
UPDATE profiles p
SET manager_id = c.manager_id
FROM consultant c
WHERE p.id = c.user_id AND c.manager_id IS NOT NULL;

-- For consultants without user_id, their id IS the profile id
UPDATE profiles p
SET manager_id = c.manager_id
FROM consultant c
WHERE p.id = c.id AND c.user_id IS NULL AND c.manager_id IS NOT NULL;
```

**Step 4: Migrate consultant_competence → profile_competences**
```sql
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
WHERE c.user_id IS NOT NULL;

-- For consultants without user_id (their consultant.id = profile.id)
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
WHERE c.user_id IS NULL;
```

**Step 5: Update FK columns in all dependent tables**
```sql
-- Update affectation
UPDATE affectation a
SET consultant_id = c.user_id
FROM consultant c
WHERE a.consultant_id = c.id AND c.user_id IS NOT NULL;
-- For consultants without user_id, consultant_id already equals profile.id

-- Rename column
ALTER TABLE affectation RENAME COLUMN consultant_id TO profile_id;
ALTER TABLE affectation DROP CONSTRAINT IF EXISTS affectation_consultant_id_fkey;
ALTER TABLE affectation ADD CONSTRAINT affectation_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Repeat similar pattern for all other tables:
-- tache, temps_passe, incident, detection_derive, prediction_risque, projet
```

**Step 6: Drop old tables**
```sql
DROP TABLE IF EXISTS consultant_competence CASCADE;
DROP TABLE IF EXISTS consultant CASCADE;
```

### Phase 2: Type System Updates

**Step 1: Regenerate Supabase types**
```bash
npx supabase gen types typescript --project-id=<project-id> > lib/supabase/types.ts
```

**Step 2: Update types/consultants.ts → types/profiles.ts**
- Rename file
- Update interfaces to reflect new schema
- Add ConsultantDetails interface
- Add ProfileCompetence interface

**Step 3: Update utils/consultant-transformers.ts → utils/profile-transformers.ts**
- Rename file
- Update transformer functions
- Add transformers for consultant_details

### Phase 3: Backend Updates

**Step 1: Update API routes (13+ files)**
- Change `.from('consultant')` → `.from('profiles')`
- Join with `consultant_details` when needed
- Update all references to `consultant_id` → `profile_id`

Files to update:
- `app/api/organizations/[orgId]/[organizationId]/consultants/route.ts`
- `app/api/organizations/[orgId]/[organizationId]/consultants/[consultantId]/route.ts`
- `app/api/consultants/route.ts`
- `app/api/consultants/[consultantId]/route.ts`
- `app/api/analytics/overview/route.ts`
- `app/api/analytics/team/route.ts`
- `app/api/stats/consultants/route.ts`
- `app/api/dashboard/stats/route.ts`
- `app/api/admin/consultants/route.ts`
- `app/api/organizations/[orgId]/[organizationId]/my-tasks/route.ts`
- `app/api/projects/route.ts`
- `utils/permissions/check-access.ts`

**Step 2: Update Server Components**
- Update any Server Components querying consultant data

### Phase 4: Frontend Updates

**Step 1: Update hooks/use-consultants.ts**
- Potentially rename to `hooks/use-team-members.ts` or keep as is
- Update API endpoints
- Update types

**Step 2: Update components**
- Find all components displaying consultant data
- Update to use new types and data structure

**Step 3: Update pages**
- `app/app/consultants/[consultantId]/page.tsx`
- Any other consultant-related pages

**Step 4: Update validation schemas**
- Create/update schemas in `lib/validations/`
- Ensure consultant_details fields are validated

### Phase 5: Testing

**Step 1: Database integrity**
- Verify all data migrated correctly
- Check foreign key relationships
- Verify RLS policies work

**Step 2: API testing**
- Test all consultant CRUD operations
- Test filtering and searching
- Test competence management

**Step 3: UI testing**
- Test consultant list view
- Test consultant detail view
- Test consultant creation/editing
- Test role management

## File Rename Strategy

Instead of "consultants", consider renaming to reflect the new architecture:

**Option 1: Keep "consultants" naming** (easier migration)
- `hooks/use-consultants.ts` → Keep, but query profiles
- `types/consultants.ts` → Keep, but use Profile types
- API routes stay as `/consultants` (backwards compatible)

**Option 2: Rename to "team" or "members"** (clearer architecture)
- `hooks/use-consultants.ts` → `hooks/use-team-members.ts`
- `types/consultants.ts` → `types/team-members.ts`
- API routes `/consultants` → `/team` or `/members`

**Recommendation**: Option 1 for now, Option 2 later if needed

## Rollback Strategy

1. Keep backup of consultant and consultant_competence tables
2. Document all FK changes
3. If rollback needed:
   - Restore tables
   - Revert FK changes
   - Restore old code from git

## Estimated Effort

- Database migration script: 2-3 hours
- Database execution + verification: 1 hour
- Type updates: 1 hour
- Backend refactoring (13+ files): 4-6 hours
- Frontend refactoring: 3-4 hours
- Testing: 2-3 hours

**Total: ~15-20 hours**

## Next Steps

1. Review and approve this migration plan
2. Create database migration SQL script
3. Test migration on development/staging database
4. Execute migration on production
5. Update codebase layer by layer
6. Comprehensive testing
7. Deploy

## Questions to Answer

1. Should we keep `/consultants` API endpoints or rename to `/team` or `/members`?
2. Do we want to migrate in phases (database first, then gradual code updates) or all at once?
3. Should we maintain backwards compatibility with old API contracts?
4. How do we handle consultants without user accounts? (Create profiles without auth.users entries?)
