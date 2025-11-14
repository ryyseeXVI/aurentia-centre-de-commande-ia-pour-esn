-- =====================================================
-- MIGRATION V2: Client Companies → Organizations Table
-- =====================================================
-- Purpose: Add client companies to organizations table while preserving ESN organization
-- Strategy:
--   - Keep Aurentia ESN organization (where matthieu.bousquet@epitech.eu is linked)
--   - Add all client companies as new organizations
--   - Projects link to client organizations
--   - Consultants stay linked to ESN organization
--   - All data remains accessible to admin user via RLS
-- =====================================================

-- Step 1: Insert all clients as new organizations (without deleting ESN orgs)
INSERT INTO organizations (id, name, slug, description, created_at, updated_at)
SELECT
  c.id, -- Use existing client ID to preserve foreign key relationships
  c.nom,
  lower(regexp_replace(c.nom, '[^a-zA-Z0-9]+', '-', 'g')), -- Generate slug from name
  COALESCE('Client: ' || c.secteur, 'Client company'),
  c.created_at,
  c.updated_at
FROM client c
WHERE c.id NOT IN (SELECT id FROM organizations) -- Don't duplicate if already exists
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update projet.organization_id to point to client organizations
-- Projects should be linked to the client company, not the ESN
UPDATE projet p
SET organization_id = p.client_id
WHERE p.client_id IS NOT NULL
  AND p.organization_id != p.client_id;

-- Step 3: Update all project-related tables to use client organization_id (via project cascade)
-- This ensures all data is linked properly through the project hierarchy

UPDATE affectation a
SET organization_id = p.organization_id
FROM projet p
WHERE a.projet_id = p.id
  AND a.organization_id != p.organization_id;

UPDATE tache t
SET organization_id = p.organization_id
FROM projet p
WHERE t.projet_id = p.id
  AND t.organization_id != p.organization_id;

UPDATE temps_passe tp
SET organization_id = p.organization_id
FROM projet p
WHERE tp.projet_id = p.id
  AND tp.organization_id != p.organization_id;

UPDATE livrable l
SET organization_id = p.organization_id
FROM projet p
WHERE l.projet_id = p.id
  AND l.organization_id != p.organization_id;

UPDATE incident i
SET organization_id = p.organization_id
FROM projet p
WHERE i.projet_id = p.id
  AND i.organization_id != p.organization_id;

UPDATE budget_projet bp
SET organization_id = p.organization_id
FROM projet p
WHERE bp.projet_id = p.id
  AND bp.organization_id != p.organization_id;

UPDATE facture f
SET organization_id = p.organization_id
FROM projet p
WHERE f.projet_id = p.id
  AND f.organization_id != p.organization_id;

UPDATE score_sante_projet ssp
SET organization_id = p.organization_id
FROM projet p
WHERE ssp.projet_id = p.id
  AND ssp.organization_id != p.organization_id;

UPDATE detection_derive dd
SET organization_id = p.organization_id
FROM projet p
WHERE dd.projet_id = p.id
  AND dd.organization_id != p.organization_id;

UPDATE prediction_risque pr
SET organization_id = p.organization_id
FROM projet p
WHERE pr.projet_id = p.id
  AND pr.organization_id != p.organization_id;

UPDATE recommandation_action ra
SET organization_id = p.organization_id
FROM projet p
WHERE ra.projet_id = p.id
  AND ra.organization_id != p.organization_id;

UPDATE milestones mi
SET organization_id = p.organization_id
FROM projet p
WHERE mi.projet_id = p.id
  AND p.id IS NOT NULL
  AND mi.organization_id != p.organization_id;

UPDATE project_channels pc
SET organization_id = p.organization_id
FROM projet p
WHERE pc.projet_id = p.id
  AND pc.organization_id != p.organization_id;

-- Step 4: Mark old ESN organizations with updated descriptions
UPDATE organizations
SET description = 'ESN Organization - Engineering Services Company managing multiple client projects'
WHERE name IN ('Aurentia ESN', 'TechConsult Partners', 'Digital Solutions Group');

-- Step 5: Ensure consultants remain linked to ESN organization (Aurentia ESN)
-- Consultants work for the ESN, not for individual clients
-- (No changes needed - they're already correctly linked)

-- Step 6: Add comment to client table
COMMENT ON TABLE client IS 'DEPRECATED: Client companies are now in organizations table. Kept for foreign key integrity. Use organizations for new client records.';

-- Step 7: Show migration summary
SELECT
  'Migration completed!' AS status,
  (SELECT COUNT(*) FROM organizations WHERE description LIKE 'Client:%') AS client_orgs_created,
  (SELECT COUNT(*) FROM organizations WHERE description LIKE 'ESN%') AS esn_orgs_kept;

SELECT
  'Organizations summary' AS info,
  name,
  slug,
  SUBSTRING(description, 1, 50) AS description_preview
FROM organizations
ORDER BY
  CASE
    WHEN description LIKE 'ESN%' THEN 1
    ELSE 2
  END,
  name;

-- Step 8: Verify data linkage to matthieu.bousquet@epitech.eu
SELECT
  'Data accessible to Matthieu' AS verification,
  'Consultant record' AS entity_type,
  c.id AS entity_id,
  c.organization_id,
  o.name AS organization_name
FROM consultant c
JOIN organizations o ON c.organization_id = o.id
WHERE c.email = 'matthieu.bousquet@epitech.eu'
UNION ALL
SELECT
  'Data accessible to Matthieu',
  'Projects (as chef de projet)',
  p.id,
  p.organization_id,
  o.name
FROM projet p
JOIN organizations o ON p.organization_id = o.id
WHERE p.chef_projet_id = (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu')
UNION ALL
SELECT
  'Data accessible to Matthieu',
  'Project assignments (affectations)',
  a.id,
  a.organization_id,
  o.name
FROM affectation a
JOIN organizations o ON a.organization_id = o.id
WHERE a.consultant_id = (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu')
ORDER BY entity_type;

SELECT
  'All organizations' AS final_check,
  COUNT(*) AS total_organizations
FROM organizations;

SELECT
  'Projects by organization' AS final_check,
  o.name AS organization_name,
  COUNT(p.id) AS project_count
FROM organizations o
LEFT JOIN projet p ON p.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY project_count DESC;
