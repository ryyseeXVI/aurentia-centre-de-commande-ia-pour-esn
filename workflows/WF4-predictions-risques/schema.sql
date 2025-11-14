-- ===================================================================
-- WF4 - PRÉDICTIONS RISQUES - SCHÉMA SQL COMPLET
-- ===================================================================
-- Description : Table principale pour stocker les prédictions de risques
--               générées par l'agent IA du workflow WF4
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE PRINCIPALE : prediction_risque
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prediction_risque (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES consultant(id) ON DELETE SET NULL,

  -- Type de prédiction
  type_risque VARCHAR(50) NOT NULL CHECK (
    type_risque IN (
      'RETARD',
      'DEPASSEMENT_BUDGET',
      'BURN_OUT',
      'NON_RENOUVELLEMENT',
      'STAFFING'
    )
  ),

  -- Métriques de prédiction
  probabilite_pct INTEGER NOT NULL CHECK (
    probabilite_pct >= 0 AND probabilite_pct <= 100
  ),
  horizon_jours INTEGER NOT NULL CHECK (
    horizon_jours IN (30, 60, 90)
  ),

  -- Explications IA
  justification TEXT NOT NULL,
  confidence DECIMAL(3, 2) CHECK (
    confidence >= 0.0 AND confidence <= 1.0
  ),

  -- Métadonnées prédiction
  date_prediction TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metriques_source JSONB,
  workflow_execution_id VARCHAR(100),
  modele_ia_utilise VARCHAR(50),

  -- Validation rétroactive (amélioration continue)
  realise BOOLEAN DEFAULT NULL,
  date_evaluation TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------
-- INDEX POUR PERFORMANCES
-- -------------------------------------------------------------------

-- Index principal : Recherche par projet
CREATE INDEX idx_prediction_projet
ON prediction_risque(projet_id, date_prediction DESC);

-- Index : Recherche par consultant (burn-out)
CREATE INDEX idx_prediction_consultant
ON prediction_risque(consultant_id, type_risque)
WHERE consultant_id IS NOT NULL;

-- Index : Prédictions récentes par type
CREATE INDEX idx_prediction_type_recent
ON prediction_risque(type_risque, date_prediction DESC);

-- Index : Prédictions à haute probabilité
CREATE INDEX idx_prediction_haute_proba
ON prediction_risque(probabilite_pct DESC, date_prediction DESC)
WHERE probabilite_pct >= 70;

-- Index : Recherche par horizon
CREATE INDEX idx_prediction_horizon
ON prediction_risque(horizon_jours, date_prediction DESC);

-- Index JSONB pour métriques source
CREATE INDEX idx_prediction_metriques
ON prediction_risque USING GIN (metriques_source);

-- -------------------------------------------------------------------
-- TRIGGER : Updated_at automatique
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_prediction_risque_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prediction_risque_updated_at
BEFORE UPDATE ON prediction_risque
FOR EACH ROW
EXECUTE FUNCTION update_prediction_risque_updated_at();

-- -------------------------------------------------------------------
-- RLS (Row Level Security) - POLICIES
-- -------------------------------------------------------------------

ALTER TABLE prediction_risque ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture complète pour utilisateurs authentifiés
CREATE POLICY "Lecture prédictions pour utilisateurs authentifiés"
ON prediction_risque
FOR SELECT
TO authenticated
USING (true);

-- Policy : Insertion par service_role uniquement (workflow automatisé)
CREATE POLICY "Insertion prédictions par service_role"
ON prediction_risque
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy : Update limité aux champs de validation rétroactive
CREATE POLICY "Update validation rétroactive"
ON prediction_risque
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Seuls les champs de validation peuvent être modifiés
  NEW.id = OLD.id AND
  NEW.projet_id = OLD.projet_id AND
  NEW.type_risque = OLD.type_risque AND
  NEW.probabilite_pct = OLD.probabilite_pct
);

-- Policy : Suppression interdite (audit trail)
-- Pas de policy DELETE = suppression interdite sauf service_role

-- -------------------------------------------------------------------
-- VUE : Prédictions critiques actives
-- -------------------------------------------------------------------

CREATE OR REPLACE VIEW v_predictions_critiques AS
SELECT
  p.id,
  p.type_risque,
  p.probabilite_pct,
  p.horizon_jours,
  p.justification,
  p.date_prediction,
  pr.nom AS projet_nom,
  pr.statut AS projet_statut,
  c.nom AS consultant_nom,
  c.prenom AS consultant_prenom
FROM prediction_risque p
JOIN projet pr ON p.projet_id = pr.id
LEFT JOIN consultant c ON p.consultant_id = c.id
WHERE
  p.probabilite_pct >= 70
  AND p.date_prediction >= NOW() - INTERVAL '7 days'
  AND p.realise IS NULL -- Prédictions non encore vérifiées
ORDER BY
  p.probabilite_pct DESC,
  p.date_prediction DESC;

-- -------------------------------------------------------------------
-- FONCTION : Récupérer prédictions récentes par projet
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_predictions_projet(
  p_projet_id UUID,
  p_jours_historique INTEGER DEFAULT 30
)
RETURNS TABLE (
  type_risque VARCHAR,
  probabilite_pct INTEGER,
  horizon_jours INTEGER,
  justification TEXT,
  date_prediction TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.type_risque,
    pr.probabilite_pct,
    pr.horizon_jours,
    pr.justification,
    pr.date_prediction
  FROM prediction_risque pr
  WHERE
    pr.projet_id = p_projet_id
    AND pr.date_prediction >= NOW() - (p_jours_historique || ' days')::INTERVAL
  ORDER BY pr.date_prediction DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------
-- FONCTION : Statistiques qualité prédictive (amélioration continue)
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION stats_qualite_predictive(
  p_jours_analyse INTEGER DEFAULT 90
)
RETURNS TABLE (
  type_risque VARCHAR,
  total_predictions BIGINT,
  predictions_realisees BIGINT,
  predictions_non_realisees BIGINT,
  taux_precision NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.type_risque,
    COUNT(*) AS total_predictions,
    COUNT(*) FILTER (WHERE pr.realise = true) AS predictions_realisees,
    COUNT(*) FILTER (WHERE pr.realise = false) AS predictions_non_realisees,
    ROUND(
      COUNT(*) FILTER (WHERE pr.realise = true)::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE pr.realise IS NOT NULL), 0) * 100,
      2
    ) AS taux_precision
  FROM prediction_risque pr
  WHERE
    pr.date_prediction >= NOW() - (p_jours_analyse || ' days')::INTERVAL
    AND pr.realise IS NOT NULL
  GROUP BY pr.type_risque
  ORDER BY taux_precision DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------
-- COMMENTAIRES (Documentation)
-- -------------------------------------------------------------------

COMMENT ON TABLE prediction_risque IS
'Table stockant les prédictions de risques générées par le workflow WF4. Analyse prédictive à 30/60/90 jours pour 5 types de risques projets/consultants.';

COMMENT ON COLUMN prediction_risque.type_risque IS
'Type de risque prédit : RETARD, DEPASSEMENT_BUDGET, BURN_OUT, NON_RENOUVELLEMENT, STAFFING';

COMMENT ON COLUMN prediction_risque.probabilite_pct IS
'Probabilité estimée du risque (0-100%). Seuil recommandé pour alertes : >= 70%';

COMMENT ON COLUMN prediction_risque.horizon_jours IS
'Horizon temporel de la prédiction : 30, 60 ou 90 jours';

COMMENT ON COLUMN prediction_risque.justification IS
'Explication textuelle générée par l''IA justifiant la prédiction';

COMMENT ON COLUMN prediction_risque.confidence IS
'Score de confiance de l''IA (0.0-1.0). Utilise pour filtrer prédictions fiables';

COMMENT ON COLUMN prediction_risque.metriques_source IS
'JSONB contenant toutes les métriques utilisées pour la prédiction (vélocité, burn rate, charge, etc.)';

COMMENT ON COLUMN prediction_risque.realise IS
'Validation rétroactive : true si le risque s''est effectivement produit, false sinon, null si non encore évalué';

-- ===================================================================
-- FIN DU SCHÉMA
-- ===================================================================
