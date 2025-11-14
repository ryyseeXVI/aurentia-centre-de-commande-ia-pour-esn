-- Migration: Create Views for Incident Detection
-- Purpose: Create views accessible by Supabase nodes in N8N
-- Date: 2025-11-13

-- ============================================================================
-- VIEW 1: Détection Dépassement Budget (>20%)
-- ============================================================================
CREATE OR REPLACE VIEW view_incidents_depassement_budget AS
WITH cout_reel_par_projet AS (
  SELECT
    tp.projet_id,
    tp.organization_id,
    SUM(tp.heures_travaillees * c.taux_journalier_cout / 7.0) as cout_reel_calcule
  FROM temps_passe tp
  JOIN consultant c ON tp.consultant_id = c.id
  GROUP BY tp.projet_id, tp.organization_id
)
SELECT
  p.id as projet_id,
  p.nom as projet_nom,
  p.organization_id,
  bp.cout_estime_total,
  bp.montant_total_vente,
  crp.cout_reel_calcule as cout_reel,
  ROUND(((crp.cout_reel_calcule / NULLIF(bp.cout_estime_total, 0)) * 100) - 100, 2) as depassement_pct,
  bp.montant_total_vente - crp.cout_reel_calcule as marge_reelle,
  'DEPASSEMENT_BUDGET'::TEXT as type_derive,
  'CRITIQUE'::TEXT as gravite
FROM projet p
JOIN budget_projet bp ON p.id = bp.projet_id
JOIN cout_reel_par_projet crp ON p.id = crp.projet_id
WHERE p.statut = 'ACTIF'
  AND crp.cout_reel_calcule > bp.cout_estime_total * 1.20
ORDER BY ((crp.cout_reel_calcule / NULLIF(bp.cout_estime_total, 0)) * 100) - 100 DESC;

COMMENT ON VIEW view_incidents_depassement_budget IS 'Vue des projets avec dépassement budget >20%';

-- ============================================================================
-- VIEW 2: Détection Retard Planning (>30 jours)
-- ============================================================================
CREATE OR REPLACE VIEW view_incidents_retard_planning AS
SELECT
  p.id as projet_id,
  p.nom as projet_nom,
  p.organization_id,
  p.date_fin_prevue,
  p.date_debut,
  (CURRENT_DATE - p.date_fin_prevue) as jours_retard,
  'RETARD_PLANNING'::TEXT as type_derive,
  'MAJEUR'::TEXT as gravite
FROM projet p
WHERE p.statut = 'ACTIF'
  AND p.date_fin_prevue < CURRENT_DATE
  AND (CURRENT_DATE - p.date_fin_prevue) > 30
ORDER BY (CURRENT_DATE - p.date_fin_prevue) DESC;

COMMENT ON VIEW view_incidents_retard_planning IS 'Vue des projets avec retard >30 jours';

-- ============================================================================
-- VIEW 3: Détection Explosion Heures (>150%)
-- ============================================================================
CREATE OR REPLACE VIEW view_incidents_explosion_heures AS
WITH heures_par_projet AS (
  SELECT
    t.projet_id,
    t.organization_id,
    SUM(t.charge_estimee_jh * 7.0) as heures_estimees_calc,
    SUM(tp.heures_travaillees) as heures_reelles_calc
  FROM tache t
  LEFT JOIN temps_passe tp ON t.id = tp.tache_id
  WHERE t.charge_estimee_jh IS NOT NULL
  GROUP BY t.projet_id, t.organization_id
  HAVING SUM(t.charge_estimee_jh * 7.0) > 0
)
SELECT
  p.id as projet_id,
  p.nom as projet_nom,
  p.organization_id,
  hpp.heures_estimees_calc as heures_estimees,
  hpp.heures_reelles_calc as heures_reelles,
  ROUND(((hpp.heures_reelles_calc / NULLIF(hpp.heures_estimees_calc, 0)) * 100) - 100, 2) as depassement_pct,
  'EXPLOSION_HEURES'::TEXT as type_derive,
  'CRITIQUE'::TEXT as gravite
FROM projet p
JOIN heures_par_projet hpp ON p.id = hpp.projet_id
WHERE p.statut = 'ACTIF'
  AND p.organization_id = hpp.organization_id
  AND hpp.heures_reelles_calc > hpp.heures_estimees_calc * 1.5
ORDER BY ((hpp.heures_reelles_calc / NULLIF(hpp.heures_estimees_calc, 0)) * 100) - 100 DESC;

COMMENT ON VIEW view_incidents_explosion_heures IS 'Vue des projets avec dépassement heures >150%';

-- ============================================================================
-- VIEW 4: Détection Tâches Bloquées (>7 jours)
-- ============================================================================
CREATE OR REPLACE VIEW view_incidents_taches_bloquees AS
SELECT
  t.projet_id,
  p.nom as projet_nom,
  p.organization_id,
  COUNT(*)::BIGINT as nb_taches_bloquees,
  'TACHES_BLOQUEES'::TEXT as type_derive,
  'MOYEN'::TEXT as gravite
FROM tache t
JOIN projet p ON t.projet_id = p.id
WHERE t.statut = 'BLOCKED'
  AND (NOW() - t.updated_at) > interval '7 days'
  AND p.statut = 'ACTIF'
GROUP BY t.projet_id, p.nom, p.organization_id
ORDER BY COUNT(*) DESC;

COMMENT ON VIEW view_incidents_taches_bloquees IS 'Vue des projets avec tâches bloquées >7 jours';

-- ============================================================================
-- VIEW 5: Détection Incidents Critiques Ouverts
-- ============================================================================
CREATE OR REPLACE VIEW view_incidents_critiques AS
SELECT
  i.projet_id,
  p.nom as projet_nom,
  p.organization_id,
  COUNT(*)::BIGINT as nb_incidents_critiques,
  'INCIDENTS_CRITIQUES'::TEXT as type_derive,
  'MOYEN'::TEXT as gravite
FROM incident i
JOIN projet p ON i.projet_id = p.id
WHERE i.severite = 'CRITIQUE'
  AND i.statut NOT IN ('RESOLU', 'FERME', 'CLOS')
  AND p.statut = 'ACTIF'
GROUP BY i.projet_id, p.nom, p.organization_id
ORDER BY COUNT(*) DESC;

COMMENT ON VIEW view_incidents_critiques IS 'Vue des projets avec incidents critiques ouverts';

-- ============================================================================
-- VIEW 6: Détection Marge Faible (<10%)
-- ============================================================================
CREATE OR REPLACE VIEW view_incidents_marge_faible AS
WITH cout_reel_par_projet AS (
  SELECT
    tp.projet_id,
    tp.organization_id,
    SUM(tp.heures_travaillees * c.taux_journalier_cout / 7.0) as cout_reel_calcule
  FROM temps_passe tp
  JOIN consultant c ON tp.consultant_id = c.id
  GROUP BY tp.projet_id, tp.organization_id
)
SELECT
  p.id as projet_id,
  p.nom as projet_nom,
  p.organization_id,
  bp.montant_total_vente,
  crp.cout_reel_calcule as cout_reel,
  bp.montant_total_vente - crp.cout_reel_calcule as marge_reelle,
  ROUND(((bp.montant_total_vente - crp.cout_reel_calcule) / NULLIF(bp.montant_total_vente, 0)) * 100, 2) as marge_pct,
  'MARGE_FAIBLE'::TEXT as type_derive,
  'MAJEUR'::TEXT as gravite
FROM projet p
JOIN budget_projet bp ON p.id = bp.projet_id
JOIN cout_reel_par_projet crp ON p.id = crp.projet_id
WHERE p.statut = 'ACTIF'
  AND p.organization_id = crp.organization_id
  AND ((bp.montant_total_vente - crp.cout_reel_calcule) / NULLIF(bp.montant_total_vente, 0)) < 0.10
ORDER BY ((bp.montant_total_vente - crp.cout_reel_calcule) / NULLIF(bp.montant_total_vente, 0)) ASC;

COMMENT ON VIEW view_incidents_marge_faible IS 'Vue des projets avec marge <10%';

-- ============================================================================
-- Grant SELECT permissions on views
-- ============================================================================
GRANT SELECT ON view_incidents_depassement_budget TO authenticated, anon;
GRANT SELECT ON view_incidents_retard_planning TO authenticated, anon;
GRANT SELECT ON view_incidents_explosion_heures TO authenticated, anon;
GRANT SELECT ON view_incidents_taches_bloquees TO authenticated, anon;
GRANT SELECT ON view_incidents_critiques TO authenticated, anon;
GRANT SELECT ON view_incidents_marge_faible TO authenticated, anon;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Les 6 vues sont maintenant accessibles comme des tables via l'API Supabase
-- Le nœud Supabase de N8N peut les lire avec "Get Many" + filter sur organization_id
