-- Fix Foreign Key Cascade Constraints
-- Migration: 20251113191447_fix_cascade_delete_constraints
-- Purpose: Set up CASCADE delete for proper data cleanup

-- ============================================================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE affectation DROP CONSTRAINT IF EXISTS affectation_projet_id_fkey;
ALTER TABLE affectation DROP CONSTRAINT IF EXISTS affectation_consultant_id_fkey;
ALTER TABLE budget_projet DROP CONSTRAINT IF EXISTS budget_projet_projet_id_fkey;
ALTER TABLE detection_derive DROP CONSTRAINT IF EXISTS detection_derive_projet_id_fkey;
ALTER TABLE facture DROP CONSTRAINT IF EXISTS facture_projet_id_fkey;
ALTER TABLE incident DROP CONSTRAINT IF EXISTS incident_projet_id_fkey;
ALTER TABLE livrable DROP CONSTRAINT IF EXISTS livrable_projet_id_fkey;
ALTER TABLE prediction_risque DROP CONSTRAINT IF EXISTS prediction_risque_projet_id_fkey;
ALTER TABLE recommandation_action DROP CONSTRAINT IF EXISTS recommandation_action_projet_id_fkey;
ALTER TABLE score_sante_projet DROP CONSTRAINT IF EXISTS score_sante_projet_projet_id_fkey;
ALTER TABLE tache DROP CONSTRAINT IF EXISTS tache_projet_id_fkey;

-- ============================================================================
-- RECREATE WITH CASCADE
-- ============================================================================

-- Project relationships - CASCADE delete
ALTER TABLE affectation
  ADD CONSTRAINT affectation_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE budget_projet
  ADD CONSTRAINT budget_projet_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE detection_derive
  ADD CONSTRAINT detection_derive_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE facture
  ADD CONSTRAINT facture_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE incident
  ADD CONSTRAINT incident_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE livrable
  ADD CONSTRAINT livrable_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE prediction_risque
  ADD CONSTRAINT prediction_risque_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE recommandation_action
  ADD CONSTRAINT recommandation_action_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE score_sante_projet
  ADD CONSTRAINT score_sante_projet_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

ALTER TABLE tache
  ADD CONSTRAINT tache_projet_id_fkey
  FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;

-- Consultant relationships - CASCADE delete for assignments
ALTER TABLE affectation
  ADD CONSTRAINT affectation_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultant(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON CONSTRAINT affectation_projet_id_fkey ON affectation IS 'CASCADE: Assignments deleted with project';
COMMENT ON CONSTRAINT affectation_consultant_id_fkey ON affectation IS 'CASCADE: Assignments deleted with consultant';
