-- Migration: Create PostgreSQL Functions for Incident Detection
-- Purpose: Create RPC-callable functions for WF2 workflow
-- Date: 2025-11-13

-- ============================================================================
-- FUNCTION 1: Détection Dépassement Budget (>20%)
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_depassement_budget(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  cout_estime_total NUMERIC,
  montant_total_vente NUMERIC,
  cout_reel NUMERIC,
  depassement_pct NUMERIC,
  marge_reelle NUMERIC,
  type_derive TEXT,
  gravite TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cout_reel_par_projet AS (
    SELECT
      tp.projet_id,
      SUM(tp.heures_travaillees * c.taux_journalier_cout / 7.0) as cout_reel_calcule
    FROM temps_passe tp
    JOIN consultant c ON tp.consultant_id = c.id
    WHERE tp.organization_id = p_organization_id
    GROUP BY tp.projet_id
  )
  SELECT
    p.id,
    p.nom,
    p.organization_id,
    bp.cout_estime_total,
    bp.montant_total_vente,
    crp.cout_reel_calcule,
    ROUND(((crp.cout_reel_calcule / NULLIF(bp.cout_estime_total, 0)) * 100) - 100, 2),
    bp.montant_total_vente - crp.cout_reel_calcule,
    'DEPASSEMENT_BUDGET'::TEXT,
    'CRITIQUE'::TEXT
  FROM projet p
  JOIN budget_projet bp ON p.id = bp.projet_id
  JOIN cout_reel_par_projet crp ON p.id = crp.projet_id
  WHERE p.statut = 'ACTIF'
    AND p.organization_id = p_organization_id
    AND crp.cout_reel_calcule > bp.cout_estime_total * 1.20
  ORDER BY ((crp.cout_reel_calcule / NULLIF(bp.cout_estime_total, 0)) * 100) - 100 DESC;
END;
$$;

COMMENT ON FUNCTION detect_depassement_budget IS 'Détecte les projets avec dépassement budget >20%';

-- ============================================================================
-- FUNCTION 2: Détection Retard Planning (>30 jours)
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_retard_planning(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  date_fin_prevue DATE,
  date_debut DATE,
  jours_retard NUMERIC,
  type_derive TEXT,
  gravite TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nom,
    p.organization_id,
    p.date_fin_prevue,
    p.date_debut,
    EXTRACT(DAY FROM (CURRENT_DATE - p.date_fin_prevue)),
    'RETARD_PLANNING'::TEXT,
    'MAJEUR'::TEXT
  FROM projet p
  WHERE p.statut = 'ACTIF'
    AND p.organization_id = p_organization_id
    AND p.date_fin_prevue < CURRENT_DATE
    AND EXTRACT(DAY FROM (CURRENT_DATE - p.date_fin_prevue)) > 30
  ORDER BY EXTRACT(DAY FROM (CURRENT_DATE - p.date_fin_prevue)) DESC;
END;
$$;

COMMENT ON FUNCTION detect_retard_planning IS 'Détecte les projets avec retard >30 jours';

-- ============================================================================
-- FUNCTION 3: Détection Explosion Heures (>150%)
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_explosion_heures(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  heures_estimees NUMERIC,
  heures_reelles NUMERIC,
  depassement_pct NUMERIC,
  type_derive TEXT,
  gravite TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH heures_par_projet AS (
    SELECT
      t.projet_id,
      SUM(t.charge_estimee_jh * 7.0) as heures_estimees_calc,
      SUM(tp.heures_travaillees) as heures_reelles_calc
    FROM tache t
    LEFT JOIN temps_passe tp ON t.id = tp.tache_id
    WHERE t.organization_id = p_organization_id
      AND t.charge_estimee_jh IS NOT NULL
    GROUP BY t.projet_id
    HAVING SUM(t.charge_estimee_jh * 7.0) > 0
  )
  SELECT
    p.id,
    p.nom,
    p.organization_id,
    hpp.heures_estimees_calc,
    hpp.heures_reelles_calc,
    ROUND(((hpp.heures_reelles_calc / NULLIF(hpp.heures_estimees_calc, 0)) * 100) - 100, 2),
    'EXPLOSION_HEURES'::TEXT,
    'CRITIQUE'::TEXT
  FROM projet p
  JOIN heures_par_projet hpp ON p.id = hpp.projet_id
  WHERE p.statut = 'ACTIF'
    AND p.organization_id = p_organization_id
    AND hpp.heures_reelles_calc > hpp.heures_estimees_calc * 1.5
  ORDER BY ((hpp.heures_reelles_calc / NULLIF(hpp.heures_estimees_calc, 0)) * 100) - 100 DESC;
END;
$$;

COMMENT ON FUNCTION detect_explosion_heures IS 'Détecte les projets avec dépassement heures >150%';

-- ============================================================================
-- FUNCTION 4: Détection Tâches Bloquées (>7 jours)
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_taches_bloquees(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  nb_taches_bloquees BIGINT,
  type_derive TEXT,
  gravite TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.projet_id,
    p.nom,
    p.organization_id,
    COUNT(*),
    'TACHES_BLOQUEES'::TEXT,
    'MOYEN'::TEXT
  FROM tache t
  JOIN projet p ON t.projet_id = p.id
  WHERE t.statut = 'BLOCKED'
    AND t.organization_id = p_organization_id
    AND EXTRACT(DAY FROM (NOW() - t.updated_at)) > 7
    AND p.statut = 'ACTIF'
  GROUP BY t.projet_id, p.nom, p.organization_id
  ORDER BY COUNT(*) DESC;
END;
$$;

COMMENT ON FUNCTION detect_taches_bloquees IS 'Détecte les projets avec tâches bloquées >7 jours';

-- ============================================================================
-- FUNCTION 5: Détection Incidents Critiques Ouverts
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_incidents_critiques(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  nb_incidents_critiques BIGINT,
  type_derive TEXT,
  gravite TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.projet_id,
    p.nom,
    p.organization_id,
    COUNT(*),
    'INCIDENTS_CRITIQUES'::TEXT,
    'MOYEN'::TEXT
  FROM incident i
  JOIN projet p ON i.projet_id = p.id
  WHERE i.severite = 'CRITIQUE'
    AND i.organization_id = p_organization_id
    AND i.statut NOT IN ('RESOLU', 'FERME', 'CLOS')
    AND p.statut = 'ACTIF'
  GROUP BY i.projet_id, p.nom, p.organization_id
  ORDER BY COUNT(*) DESC;
END;
$$;

COMMENT ON FUNCTION detect_incidents_critiques IS 'Détecte les projets avec incidents critiques ouverts';

-- ============================================================================
-- FUNCTION 6: Détection Marge Faible (<10%)
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_marge_faible(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  montant_total_vente NUMERIC,
  cout_reel NUMERIC,
  marge_reelle NUMERIC,
  marge_pct NUMERIC,
  type_derive TEXT,
  gravite TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cout_reel_par_projet AS (
    SELECT
      tp.projet_id,
      SUM(tp.heures_travaillees * c.taux_journalier_cout / 7.0) as cout_reel_calcule
    FROM temps_passe tp
    JOIN consultant c ON tp.consultant_id = c.id
    WHERE tp.organization_id = p_organization_id
    GROUP BY tp.projet_id
  )
  SELECT
    p.id,
    p.nom,
    p.organization_id,
    bp.montant_total_vente,
    crp.cout_reel_calcule,
    bp.montant_total_vente - crp.cout_reel_calcule,
    ROUND(((bp.montant_total_vente - crp.cout_reel_calcule) / NULLIF(bp.montant_total_vente, 0)) * 100, 2),
    'MARGE_FAIBLE'::TEXT,
    'MAJEUR'::TEXT
  FROM projet p
  JOIN budget_projet bp ON p.id = bp.projet_id
  JOIN cout_reel_par_projet crp ON p.id = crp.projet_id
  WHERE p.statut = 'ACTIF'
    AND p.organization_id = p_organization_id
    AND ((bp.montant_total_vente - crp.cout_reel_calcule) / NULLIF(bp.montant_total_vente, 0)) < 0.10
  ORDER BY ((bp.montant_total_vente - crp.cout_reel_calcule) / NULLIF(bp.montant_total_vente, 0)) ASC;
END;
$$;

COMMENT ON FUNCTION detect_marge_faible IS 'Détecte les projets avec marge <10%';

-- ============================================================================
-- FUNCTION 7: Calcul des Scores de Santé Projet
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_project_health_scores(p_organization_id UUID)
RETURNS TABLE (
  projet_id UUID,
  projet_nom TEXT,
  organization_id UUID,
  total_penalites INTEGER,
  score_global INTEGER,
  couleur_risque TEXT,
  raisonnement_ia TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH penalites AS (
    SELECT
      dd.projet_id,
      SUM(
        CASE dd.gravite
          WHEN 'CRITIQUE' THEN 25
          WHEN 'MAJEUR' THEN 15
          WHEN 'MOYEN' THEN
            CASE
              WHEN dd.type_derive = 'TACHES_BLOQUEES' THEN 2
              WHEN dd.type_derive = 'INCIDENTS_CRITIQUES' THEN 5
              ELSE 8
            END
          WHEN 'MINEUR' THEN 3
          ELSE 0
        END
      )::INTEGER as total_penalites_calc
    FROM detection_derive dd
    WHERE dd.date_detection::DATE = CURRENT_DATE
      AND dd.organization_id = p_organization_id
    GROUP BY dd.projet_id
  )
  SELECT
    p.id,
    p.nom,
    p.organization_id,
    COALESCE(pen.total_penalites_calc, 0),
    GREATEST(0, 100 - COALESCE(pen.total_penalites_calc, 0)),
    CASE
      WHEN GREATEST(0, 100 - COALESCE(pen.total_penalites_calc, 0)) >= 80 THEN 'VERT'
      WHEN GREATEST(0, 100 - COALESCE(pen.total_penalites_calc, 0)) >= 50 THEN 'ORANGE'
      ELSE 'ROUGE'
    END::TEXT,
    ('Analyse automatique quotidienne - ' || COALESCE(pen.total_penalites_calc, 0)::TEXT || ' points de pénalités détectés')::TEXT
  FROM projet p
  LEFT JOIN penalites pen ON p.id = pen.projet_id
  WHERE p.statut = 'ACTIF'
    AND p.organization_id = p_organization_id;
END;
$$;

COMMENT ON FUNCTION calculate_project_health_scores IS 'Calcule les scores de santé pour tous les projets actifs';

-- ============================================================================
-- Grant permissions for authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION detect_depassement_budget(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_retard_planning(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_explosion_heures(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_taches_bloquees(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_incidents_critiques(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_marge_faible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_project_health_scores(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Les 7 fonctions sont maintenant disponibles via RPC:
-- - detect_depassement_budget(organization_id)
-- - detect_retard_planning(organization_id)
-- - detect_explosion_heures(organization_id)
-- - detect_taches_bloquees(organization_id)
-- - detect_incidents_critiques(organization_id)
-- - detect_marge_faible(organization_id)
-- - calculate_project_health_scores(organization_id)
