-- ============================================
-- TABLE: reporting_destinataires
-- Description: Liste des destinataires du reporting quotidien WF6
-- ============================================

-- Créer la table
CREATE TABLE IF NOT EXISTS reporting_destinataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'DIRECTION', 'PMO', 'MANAGER'
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Créer index sur email pour performance
CREATE INDEX IF NOT EXISTS idx_reporting_destinataires_email ON reporting_destinataires(email);
CREATE INDEX IF NOT EXISTS idx_reporting_destinataires_actif ON reporting_destinataires(actif);

-- Insérer destinataires par défaut
INSERT INTO reporting_destinataires (email, role) VALUES
  ('direction@esn.com', 'DIRECTION'),
  ('pmo@esn.com', 'PMO')
ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE reporting_destinataires IS 'Liste des destinataires du reporting quotidien automatique (WF6)';
COMMENT ON COLUMN reporting_destinataires.role IS 'DIRECTION, PMO, ou MANAGER - détermine le niveau de détail du rapport';
COMMENT ON COLUMN reporting_destinataires.actif IS 'Si false, le destinataire ne recevra plus le rapport';

-- Vérification
SELECT * FROM reporting_destinataires ORDER BY created_at DESC;
