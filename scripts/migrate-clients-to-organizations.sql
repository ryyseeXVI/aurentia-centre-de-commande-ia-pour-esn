-- =====================================================
-- MIGRATION: Client Companies → Organizations Table
-- =====================================================
-- Purpose: Convert multi-tenant ESN structure to single ESN managing multiple client companies
-- This migrates all client companies into the organizations table
-- =====================================================

-- Step 1: Create temporary table to store the mapping
CREATE TEMP TABLE client_to_org_mapping (
  old_client_id UUID,
  new_organization_id UUID,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert all clients as new organizations and capture the mapping
INSERT INTO client_to_org_mapping (old_client_id, new_organization_id, client_name)
SELECT
  c.id AS old_client_id,
  gen_random_uuid() AS new_organization_id,
  c.nom AS client_name
FROM client c;

-- Step 3: Insert clients into organizations table with new IDs
INSERT INTO organizations (id, name, slug, description, created_at, updated_at)
SELECT
  m.new_organization_id,
  c.nom,
  lower(regexp_replace(c.nom, '[^a-zA-Z0-9]+', '-', 'g')), -- Generate slug from name
  COALESCE('Client: ' || c.secteur, 'Client company'),
  c.created_at,
  c.updated_at
FROM client c
JOIN client_to_org_mapping m ON c.id = m.old_client_id;

-- Step 4: Update all tables that reference organization_id to point to client companies
-- We'll keep the single ESN organization for now and update projet to use client-based org IDs

-- Update projet.organization_id to point to the client's new organization_id
UPDATE projet p
SET organization_id = m.new_organization_id
FROM client_to_org_mapping m
WHERE p.client_id = m.old_client_id;

-- Update consultant.organization_id to point to first client organization (temporary)
-- NOTE: In a single ESN model, consultants work for the ESN, not individual clients
-- For now, we'll assign them to the first client org, but this should be reviewed
DO $$
DECLARE
  first_org_id UUID;
BEGIN
  SELECT new_organization_id INTO first_org_id
  FROM client_to_org_mapping
  ORDER BY created_at
  LIMIT 1;

  UPDATE consultant
  SET organization_id = first_org_id
  WHERE organization_id IN (
    SELECT id FROM organizations
    WHERE name IN ('Aurentia ESN', 'TechConsult Partners', 'Digital Solutions Group')
  );
END $$;

-- Update all other tables that have organization_id foreign keys
UPDATE competence SET organization_id = (SELECT new_organization_id FROM client_to_org_mapping LIMIT 1)
WHERE organization_id IN (SELECT id FROM organizations WHERE name IN ('Aurentia ESN', 'TechConsult Partners', 'Digital Solutions Group'));

UPDATE consultant_competence SET organization_id = (SELECT new_organization_id FROM client_to_org_mapping LIMIT 1)
WHERE organization_id IN (SELECT id FROM organizations WHERE name IN ('Aurentia ESN', 'TechConsult Partners', 'Digital Solutions Group'));

UPDATE affectation a
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE a.projet_id = p.id;

UPDATE tache t
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE t.projet_id = p.id;

UPDATE temps_passe tp
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE tp.projet_id = p.id;

UPDATE livrable l
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE l.projet_id = p.id;

UPDATE incident i
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE i.projet_id = p.id;

UPDATE budget_projet bp
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE bp.projet_id = p.id;

UPDATE facture f
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE f.projet_id = p.id;

UPDATE score_sante_projet ssp
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE ssp.projet_id = p.id;

UPDATE detection_derive dd
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE dd.projet_id = p.id;

UPDATE prediction_risque pr
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE pr.projet_id = p.id;

UPDATE recommandation_action ra
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE ra.projet_id = p.id;

UPDATE milestones mi
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE mi.projet_id = p.id;

UPDATE project_channels pc
SET organization_id = m.new_organization_id
FROM projet p
JOIN client_to_org_mapping m ON p.client_id = m.old_client_id
WHERE pc.projet_id = p.id;

-- Step 5: Delete old ESN organizations (Aurentia ESN, TechConsult Partners, Digital Solutions Group)
DELETE FROM organizations
WHERE name IN ('Aurentia ESN', 'TechConsult Partners', 'Digital Solutions Group');

-- Step 6: Show migration summary
SELECT
  'Migration completed!' AS status,
  COUNT(*) AS total_client_orgs_created
FROM client_to_org_mapping;

SELECT
  'Client to Organization Mapping' AS info,
  client_name,
  old_client_id,
  new_organization_id
FROM client_to_org_mapping
ORDER BY client_name;

-- Step 7: Verify the migration
SELECT
  'Organizations after migration' AS verification,
  COUNT(*) AS total_organizations
FROM organizations;

SELECT
  'Projects with updated organization_id' AS verification,
  COUNT(*) AS total_projects
FROM projet
WHERE organization_id IN (SELECT new_organization_id FROM client_to_org_mapping);

-- Note: The client table is kept for now but should be deprecated
-- Add a comment to the table
COMMENT ON TABLE client IS 'DEPRECATED: Client companies are now stored in organizations table. This table is kept for data integrity but should not be used for new records.';
