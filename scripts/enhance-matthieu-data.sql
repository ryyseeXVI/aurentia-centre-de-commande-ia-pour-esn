-- ================================================================
-- COMPREHENSIVE DATA ENHANCEMENT FOR matthieu.bousquet@epitech.eu
-- ================================================================
-- This script adds extensive additional data to make the database
-- fully testable with rich historical and operational information
-- ================================================================

-- ====================
-- 1. EXTENDED HISTORICAL TIME TRACKING (June-August 2025)
-- ====================
-- Add 3 more months of historical data, simulating summer work with vacation

WITH matthieu AS (
  SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'
)
INSERT INTO temps_passe (projet_id, consultant_id, date, heures_travaillees, validation_statut, organization_id)
SELECT
  '6ea4adad-4d9c-4986-a3e0-4497ee51e870'::uuid, -- BNP Modernisation project
  m.id,
  date_series::date,
  CASE
    WHEN EXTRACT(DOW FROM date_series) = 1 THEN 5.0  -- Monday
    WHEN EXTRACT(DOW FROM date_series) = 2 THEN 6.0  -- Tuesday (intensive days)
    WHEN EXTRACT(DOW FROM date_series) = 3 THEN 5.5  -- Wednesday
    WHEN EXTRACT(DOW FROM date_series) = 4 THEN 5.0  -- Thursday
    WHEN EXTRACT(DOW FROM date_series) = 5 THEN 4.0  -- Friday (summer Fridays)
  END,
  'VALIDEE',
  'a1111111-1111-1111-1111-111111111111'::uuid
FROM matthieu m
CROSS JOIN generate_series('2025-06-01'::date, '2025-08-31'::date, '1 day'::interval) date_series
WHERE EXTRACT(DOW FROM date_series) NOT IN (0, 6)  -- Exclude weekends
  AND date_series NOT BETWEEN '2025-08-04' AND '2025-08-15';  -- Exclude 2 weeks vacation

-- ====================
-- 2. ADDITIONAL DELIVERABLES FOR BNP PROJECT
-- ====================

INSERT INTO livrable (projet_id, nom, description, date_fin_prevue, statut, organization_id)
VALUES
  -- Backend deliverables
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'Microservices Core Banking',
   'Microservices métier core banking: gestion comptes, virements, prélèvements, historique transactions',
   '2025-12-15'::date,
   'EN_COURS',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'Data Migration Pipeline',
   'Pipeline migration données depuis mainframe legacy vers PostgreSQL avec validation et rollback',
   '2026-01-31'::date,
   'EN_COURS',
   'a1111111-1111-1111-1111-111111111111'),

  -- Infrastructure deliverables
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'Kubernetes Production Cluster',
   'Cluster K8s production multi-AZ avec auto-scaling, monitoring Prometheus/Grafana, backup automatisé',
   '2025-11-30'::date,
   'EN_COURS',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'CI/CD GitOps Pipeline',
   'Pipeline CI/CD GitOps avec ArgoCD, tests automatisés, déploiement canary, feature flags LaunchDarkly',
   '2025-12-20'::date,
   'A_FAIRE',
   'a1111111-1111-1111-1111-111111111111'),

  -- Security & Compliance
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'Security Audit & Pentest',
   'Audit sécurité complet, pentest externe, conformité PCI-DSS et GDPR, documentation certification',
   '2026-02-28'::date,
   'A_FAIRE',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'Disaster Recovery Plan',
   'Plan reprise activité (PRA/PCA), backups multi-région, tests failover, RTO 4h / RPO 1h',
   '2026-01-15'::date,
   'A_FAIRE',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 3. ADDITIONAL TASKS WITH MATTHIEU INVOLVEMENT
-- ====================

INSERT INTO tache (projet_id, livrable_id, consultant_responsable_id, nom, description, charge_estimee_jh, date_fin_cible, statut, organization_id)
VALUES
  -- Microservices tasks - Matthieu as lead architect
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Microservices Core Banking'),
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Design Event-Driven Architecture',
   'Architecture événementielle avec Kafka: event sourcing, SAGA patterns, schéma registry Avro. Modélisation DDD bounded contexts.',
   15,
   '2025-11-20'::date,
   'IN_PROGRESS',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Microservices Core Banking'),
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Define Service Mesh Strategy',
   'Stratégie service mesh Istio: traffic management, mTLS, observability, circuit breakers, rate limiting',
   10,
   '2025-11-25'::date,
   'TODO',
   'a1111111-1111-1111-1111-111111111111'),

  -- Data migration tasks
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Data Migration Pipeline'),
   (SELECT id FROM consultant WHERE email = 'alexandre.simon@aurentia.fr'),
   'Build ETL Pipeline',
   'Pipeline ETL Apache Airflow: extraction mainframe COBOL, transformation business rules, load PostgreSQL partitionné',
   20,
   '2025-12-10'::date,
   'IN_PROGRESS',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Data Migration Pipeline'),
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Review Data Quality Checks',
   'Revue stratégie qualité données: validation règles métier, détection anomalies, rapports conformité',
   8,
   '2025-12-05'::date,
   'TODO',
   'a1111111-1111-1111-1111-111111111111'),

  -- Kubernetes tasks
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Kubernetes Production Cluster'),
   (SELECT id FROM consultant WHERE email = 'julie.michel@aurentia.fr'),
   'Configure Multi-AZ Cluster',
   'Configuration cluster K8s multi-AZ: node pools, pod disruption budgets, network policies, storage classes',
   12,
   '2025-11-28'::date,
   'IN_PROGRESS',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Kubernetes Production Cluster'),
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Security Hardening Review',
   'Audit sécurité K8s: RBAC policies, pod security standards, network segmentation, secrets management Vault',
   6,
   '2025-11-22'::date,
   'REVIEW',
   'a1111111-1111-1111-1111-111111111111'),

  -- CI/CD tasks
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'CI/CD GitOps Pipeline'),
   (SELECT id FROM consultant WHERE email = 'pierre.martin@aurentia.fr'),
   'Setup ArgoCD GitOps',
   'Configuration ArgoCD: app-of-apps pattern, sync policies, automated pruning, RBAC, notifications Slack',
   14,
   '2025-12-15'::date,
   'TODO',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'CI/CD GitOps Pipeline'),
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Design Canary Deployment Strategy',
   'Stratégie déploiement canary avec Flagger: traffic splitting, metrics analysis, automated rollback',
   5,
   '2025-12-18'::date,
   'TODO',
   'a1111111-1111-1111-1111-111111111111'),

  -- Security audit tasks
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Security Audit & Pentest'),
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Coordinate External Pentest',
   'Coordination pentest externe: périmètre, règles engagement, briefing équipe, suivi remédiation vulnérabilités',
   10,
   '2026-02-15'::date,
   'TODO',
   'a1111111-1111-1111-1111-111111111111'),

  -- Disaster recovery tasks
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM livrable WHERE nom = 'Disaster Recovery Plan'),
   (SELECT id FROM consultant WHERE email = 'sophie.lefevre@aurentia.fr'),
   'Document Recovery Procedures',
   'Documentation procédures PRA: runbooks, escalation matrix, contact emergency, checklists validation',
   8,
   '2026-01-10'::date,
   'TODO',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 4. ADDITIONAL TIME ENTRIES FOR RECENT TASKS
-- ====================

-- Add time entries for Matthieu's architectural work
INSERT INTO temps_passe (projet_id, consultant_id, tache_id, date, heures_travaillees, description, validation_statut, organization_id)
VALUES
  -- Event-driven architecture design work
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   (SELECT id FROM tache WHERE nom = 'Design Event-Driven Architecture'),
   '2025-11-11'::date,
   6.5,
   'Workshop architecture événementielle: modélisation événements métier, bounded contexts DDD, SAGA choreography vs orchestration',
   'VALIDEE',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   (SELECT id FROM tache WHERE nom = 'Design Event-Driven Architecture'),
   '2025-11-12'::date,
   5.0,
   'Spécification schema registry Avro: versioning, compatibility rules, documentation événements',
   'VALIDEE',
   'a1111111-1111-1111-1111-111111111111'),

  -- Security hardening review
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   (SELECT id FROM tache WHERE nom = 'Security Hardening Review'),
   '2025-11-13'::date,
   4.5,
   'Audit RBAC K8s: review service accounts, role bindings, network policies. Identified 3 over-privileged pods',
   'EN_ATTENTE',
   'a1111111-1111-1111-1111-111111111111');

-- Add team member time entries for context
INSERT INTO temps_passe (projet_id, consultant_id, tache_id, date, heures_travaillees, description, validation_statut, organization_id)
VALUES
  -- Julie's K8s work
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'julie.michel@aurentia.fr'),
   (SELECT id FROM tache WHERE nom = 'Configure Multi-AZ Cluster'),
   '2025-11-11'::date,
   7.0,
   'Configuration node pools multi-AZ: spot instances, taints/tolerations, cluster autoscaler',
   'VALIDEE',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'julie.michel@aurentia.fr'),
   (SELECT id FROM tache WHERE nom = 'Configure Multi-AZ Cluster'),
   '2025-11-12'::date,
   6.5,
   'Setup pod disruption budgets et test failover AZ. Successful failover < 30s',
   'VALIDEE',
   'a1111111-1111-1111-1111-111111111111'),

  -- Alexandre's ETL work
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'alexandre.simon@aurentia.fr'),
   (SELECT id FROM tache WHERE nom = 'Build ETL Pipeline'),
   '2025-11-11'::date,
   8.0,
   'Développement DAG Airflow extraction mainframe: COBOL parsing, data validation, staging PostgreSQL',
   'VALIDEE',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'alexandre.simon@aurentia.fr'),
   (SELECT id FROM tache WHERE nom = 'Build ETL Pipeline'),
   '2025-11-12'::date,
   7.5,
   'Implémentation business rules transformation: mapping COBOL → PostgreSQL, gestion encodings legacy',
   'VALIDEE',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 5. ADDITIONAL INCIDENTS - VARIED TYPES
-- ====================

INSERT INTO incident (projet_id, consultant_id, titre, description, severite, statut, date_detection, organization_id)
VALUES
  -- Infrastructure incident
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'julie.michel@aurentia.fr'),
   'Pod OOMKilled - Payment Service',
   'Payment microservice killed par OOM (Out Of Memory). Memory limit 512Mi insuffisant sous charge. Pics à 720Mi observés. Impact: 12 transactions échouées.',
   'MOYENNE',
   'RESOLU',
   '2025-11-10 14:23:00',
   'a1111111-1111-1111-1111-111111111111'),

  -- Data quality incident
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'alexandre.simon@aurentia.fr'),
   'Data Migration Validation Failure',
   'Pipeline migration: 2,847 comptes invalides détectés (3.2% dataset). IBAN checksums incorrects données legacy. Rollback automatique effectué.',
   'ELEVEE',
   'EN_COURS',
   '2025-11-09 09:15:00',
   'a1111111-1111-1111-1111-111111111111'),

  -- Security incident
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   'Exposed Secret in Git History',
   'API key production Vault leaked dans Git history (commit 3 semaines). Key rotation effectuée immédiatement. Pas d''accès non autorisé détecté.',
   'CRITIQUE',
   'RESOLU',
   '2025-11-08 16:45:00',
   'a1111111-1111-1111-1111-111111111111'),

  -- Performance incident
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'thomas.dubois@aurentia.fr'),
   'Database Connection Pool Exhausted',
   'PostgreSQL connection pool saturé (max 100 connexions). N+1 queries détectées dans service transactions. P95 latency 4.2s → 450ms après fix.',
   'MOYENNE',
   'RESOLU',
   '2025-11-07 11:30:00',
   'a1111111-1111-1111-1111-111111111111'),

  -- Integration incident
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'pierre.martin@aurentia.fr'),
   'Kafka Consumer Lag Spike',
   'Consumer lag Kafka topic transactions: 2.3M messages en retard (lag normal: <1000). Rebalancing problème suite déploiement. Recovery 45min.',
   'ELEVEE',
   'RESOLU',
   '2025-11-06 15:10:00',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 6. ADDITIONAL DRIFT DETECTIONS
-- ====================

INSERT INTO detection_derive (projet_id, type_derive, severite, valeur_mesuree, valeur_attendue, date_detection, organization_id)
VALUES
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'DELAI',
   'ELEVEE',
   'Retard 3 semaines livraison microservices core banking. Vélocité: 22 SP/sprint (cible: 35 SP/sprint)',
   'Livraison prévue 2025-11-15',
   '2025-11-10 08:00:00',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'QUALITE',
   'MODEREE',
   'Code coverage: 64% (cible: 80%). Debt ratio: 8.2% (limite: 5%). 47 code smells critiques.',
   'Qualité code selon standards BNP',
   '2025-11-12 10:30:00',
   'a1111111-1111-1111-1111-111111111111'),

  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   'CHARGE',
   'MODEREE',
   'Équipe surchargée: moyenne 52h/semaine (limite: 40h). 3 consultants en overtime depuis 4 semaines. Risque burnout.',
   'Charge équipe 40h/semaine',
   '2025-11-11 14:00:00',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 7. ADDITIONAL RISK PREDICTIONS
-- ====================

INSERT INTO prediction_risque (projet_id, consultant_id, horizon_jours, type_risque, probabilite_pct, organization_id)
VALUES
  -- Deadline risk
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   NULL,
   120,
   'DELAI',
   67,
   'a1111111-1111-1111-1111-111111111111'),

  -- Team burnout risk
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'julie.michel@aurentia.fr'),
   45,
   'CHARGE',
   38,
   'a1111111-1111-1111-1111-111111111111'),

  -- Security audit failure risk
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
   105,
   'QUALITE',
   28,
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 8. ADDITIONAL AI RECOMMENDATIONS
-- ====================

INSERT INTO recommandation_action (projet_id, prediction_id, type_action, description_action, statut, organization_id)
VALUES
  -- Deadline risk mitigation
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM prediction_risque WHERE type_risque = 'DELAI' AND probabilite_pct = 67 LIMIT 1),
   'REPLANIFICATION',
   'Risque dépassement délai élevé (67%). Actions recommandées:
1. MVP REDEFINITION: Déplacer features non-critiques en phase 2 (estimation: 120 jh gagnés)
2. RENFORT ÉQUIPE: +2 devs backend pendant 8 semaines (coût: €96K, gain vélocité: +40%)
3. WEEKEND SPRINT: 1 sprint exceptionnel avec compensation (récupération 1 semaine post-livraison)
4. CLIENT SYNC: Négocier extension 3 semaines avec pénalité réduite (€50K vs €200K)
Probabilité succès livraison: 67% → 85% avec combinaison actions 1+2',
   'EN_ATTENTE',
   'a1111111-1111-1111-1111-111111111111'),

  -- Team burnout prevention
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM prediction_risque WHERE type_risque = 'CHARGE' AND probabilite_pct = 38 LIMIT 1),
   'REALLOCATION',
   'Alerte surcharge équipe (38% risque burnout). Recommandations:
1. REDISTRIBUTION: Réaffecter 20% charge Julie vers Pierre (capacité disponible)
2. AUTOMATISATION: Prioriser tâches infra-as-code (gain: 6h/semaine/dev)
3. PAUSE FORCÉE: Imposer 1 jour off/mois pendant période intensive
4. MONITORING: Dashboard quotidien heures travaillées avec alertes >45h/semaine
Impact: Réduction risque burnout 38% → 12%, maintien qualité livraisons',
   'EN_ATTENTE',
   'a1111111-1111-1111-1111-111111111111'),

  -- Quality improvement
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870',
   (SELECT id FROM prediction_risque WHERE type_risque = 'QUALITE' AND probabilite_pct = 28 LIMIT 1),
   'REFACTORING',
   'Risque échec audit sécurité (28%). Plan amélioration qualité:
1. CODE COVERAGE: Sprint dédié tests unitaires/intégration (objectif: 64% → 82%)
2. DEBT CLEANUP: 2h/jour/dev dédiées refactoring (réduction debt ratio 8.2% → 4.5%)
3. STATIC ANALYSIS: CI gate obligatoire SonarQube (quality gate: A ou bloc merge)
4. PEER REVIEW: Obligation 2 reviewers pour PRs critiques (auth, payment, data access)
5. SECURITY SCAN: Snyk/Trivy automatisés avec seuils blocants (0 critical, <5 high)
Timeline: 3 sprints. Coût: 15% vélocité. Gain: certification PCI-DSS assurée',
   'APPROUVEE',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 9. ADDITIONAL INVOICES
-- ====================

INSERT INTO facture (projet_id, montant, date_facturation, date_echeance, statut_paiement, organization_id)
VALUES
  -- Historical invoices for BNP project
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', 200000, '2025-06-30', '2025-07-30', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', 200000, '2025-07-31', '2025-08-31', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', 200000, '2025-08-31', '2025-09-30', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', 200000, '2025-09-30', '2025-10-30', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', 200000, '2025-10-31', '2025-11-30', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', 200000, '2025-11-13', '2025-12-13', 'EN_ATTENTE', 'a1111111-1111-1111-1111-111111111111');

-- ====================
-- 10. HEALTH SCORE UPDATES
-- ====================

INSERT INTO score_sante_projet (projet_id, date_analyse, score_global, couleur_risque, raisonnement_ia, organization_id)
VALUES
  ('6ea4adad-4d9c-4986-a3e0-4497ee51e870', '2025-11-13', 68, 'ORANGE',
   'Projet en zone orange (68/100). POSITIFS: Équipe performante, client engagé, architecture solide. RISQUES: Retard 3 sem livraison microservices (67% risque délai), surcharge équipe (52h/sem), qualité code sous objectifs (coverage 64% vs 80%). INCIDENTS: 1 critical resolved (secret leak), 1 high ongoing (migration data quality). ACTIONS: Recommandations activées (MVP redéfinition, renfort équipe, plan qualité). PROCHAINES ÉTAPES: Sprint review client 15/11, décision go/no-go renfort équipe. Surveillance: vélocité, team health, incidents critiques.',
   'a1111111-1111-1111-1111-111111111111');

-- ====================
-- VERIFICATION QUERIES
-- ====================

-- Count total time entries for Matthieu
SELECT
  COUNT(*) as total_entries,
  SUM(heures_travaillees) as total_hours,
  MIN(date) as first_entry,
  MAX(date) as last_entry
FROM temps_passe
WHERE consultant_id = (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu');

-- Count tasks by status for Matthieu
SELECT
  statut,
  COUNT(*) as task_count
FROM tache
WHERE consultant_responsable_id = (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu')
GROUP BY statut
ORDER BY statut;

-- Summary of incidents
SELECT
  severite,
  statut,
  COUNT(*) as incident_count
FROM incident
WHERE projet_id = '6ea4adad-4d9c-4986-a3e0-4497ee51e870'
GROUP BY severite, statut
ORDER BY severite DESC, statut;

-- Summary of deliverables
SELECT
  statut,
  COUNT(*) as deliverable_count
FROM livrable
WHERE projet_id = '6ea4adad-4d9c-4986-a3e0-4497ee51e870'
GROUP BY statut;
