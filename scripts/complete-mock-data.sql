-- This script completes the mock data population
-- Run this after the initial data creation

-- Simplified creation of additional assignments, scores, and invoices for completed projects
-- Project ID for Carrefour project: c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b

-- Assignments for completed Carrefour project
INSERT INTO affectation (projet_id, consultant_id, date_debut, date_fin_prevue, charge_allouee_pct, organization_id)
SELECT 
  'c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b'::uuid,
  c.id,
  '2025-04-01'::date,
  '2025-09-30'::date,
  CASE 
    WHEN c.email = 'alexandre.simon@aurentia.fr' THEN 60
    WHEN c.email = 'emilie.bernard@aurentia.fr' THEN 100
    WHEN c.email = 'thomas.dubois@aurentia.fr' THEN 100
  END,
  'a1111111-1111-1111-1111-111111111111'::uuid
FROM consultant c
WHERE c.email IN ('alexandre.simon@aurentia.fr', 'emilie.bernard@aurentia.fr', 'thomas.dubois@aurentia.fr');

-- Invoices for Carrefour project
INSERT INTO facture (projet_id, montant, date_facturation, statut_paiement, organization_id)
VALUES
  ('c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b', 112500, '2025-05-31', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b', 112500, '2025-07-31', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b', 112500, '2025-09-30', 'PAYEE', 'a1111111-1111-1111-1111-111111111111'),
  ('c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b', 112500, '2025-10-15', 'PAYEE', 'a1111111-1111-1111-1111-111111111111');

-- Health score for completed project
INSERT INTO score_sante_projet (projet_id, date_analyse, score_global, couleur_risque, raisonnement_ia, organization_id)
VALUES
  ('c34dcab2-ac9c-4e1c-ab46-8e28adda0f9b', '2025-09-30', 95, 'VERT',
   'Projet exemplaire livré en avance. Équipe performante, excellente communication client. Livré 2 semaines avant avec toutes fonctionnalités. Client très satisfait.',
   'a1111111-1111-1111-1111-111111111111');

-- ONGOING PROJECTS (in progress, mix of statuses)
-- Create BNP Paribas Banking Platform project (Aurentia ESN)
WITH new_ongoing_1 AS (
  INSERT INTO projet (client_id, chef_projet_id, nom, description, date_debut, date_fin_prevue, statut, organization_id)
  SELECT 
    (SELECT id FROM client WHERE nom = 'BNP Paribas'),
    (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
    'Modernisation Plateforme Bancaire',
    'Migration et modernisation plateforme bancaire legacy vers architecture microservices cloud-native',
    '2025-06-01'::date,
    '2026-03-31'::date,
    'ACTIF',
    'a1111111-1111-1111-1111-111111111111'
  RETURNING id
)
INSERT INTO budget_projet (projet_id, montant_total_vente, cout_estime_total, marge_cible_pct, organization_id)
SELECT id, 1200000, 850000, 29, 'a1111111-1111-1111-1111-111111111111'
FROM new_ongoing_1
RETURNING projet_id;

-- FUTURE PROJECTS (starting soon)
-- Create AXA Digital Portal project (Aurentia ESN)
WITH new_future_1 AS (
  INSERT INTO projet (client_id, chef_projet_id, nom, description, date_debut, date_fin_prevue, statut, organization_id)
  SELECT 
    (SELECT id FROM client WHERE nom = 'AXA Assurances'),
    (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu'),
    'Portail Client Digital 2.0',
    'Nouvelle génération du portail client avec IA conversationnelle et personnalisation avancée',
    '2025-11-25'::date,
    '2026-05-31'::date,
    'PLANIFIE',
    'a1111111-1111-1111-1111-111111111111'
  RETURNING id
)
INSERT INTO budget_projet (projet_id, montant_total_vente, cout_estime_total, marge_cible_pct, organization_id)
SELECT id, 680000, 460000, 32, 'a1111111-1111-1111-1111-111111111111'
FROM new_future_1
RETURNING projet_id;

