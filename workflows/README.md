# Workflows N8N - Centre de Commande IA pour ESN

## 📚 Vue d'Ensemble

Ce dossier contient les **7 workflows automatisés complets** pour le Centre de Commande IA.

Chaque sous-dossier contient un fichier `README.md` décrivant l'automatisation.

---

## 🗂️ Structure

```
workflows/
├── README.md (ce fichier)
├── WF1-synchronisation-donnees-externes/
│   └── README.md
├── WF2-score-sante-projet/
│   └── README.md
├── WF3-detection-derives/
│   └── README.md
├── WF4-predictions-risques/
│   └── README.md
├── WF5-generation-recommandations/
│   └── README.md
├── WF6-reporting-quotidien/
│   └── README.md
└── WF7-alertes-temps-reel/
    └── README.md
```

---

## 🎯 Workflows Complets (7 au total)

### 🔴 PHASE 1 - MVP (Développer en priorité)

#### 1. WF2 - Calcul Score Santé Projet
**Objectif** : Score 0-100 + couleur risque (VERT/ORANGE/ROUGE) pour chaque projet actif

**Pourquoi d'abord ?**
- Permet de créer le dashboard "War Room"
- Démo immédiate de la valeur IA
- Base pour les workflows suivants

**Déclenchement** : Quotidien 6h00

---

#### 2. WF3 - Détection Dérives Temps Réel
**Objectif** : Détecter automatiquement retards, surcharges, risques budgétaires

**Pourquoi ensuite ?**
- Cœur du système d'alerte
- Valeur business immédiate
- Complète WF2 avec détection proactive

**Déclenchement** : Horaire (24/7)

---

#### 3. WF5 - Génération Recommandations IA
**Objectif** : Proposer actions correctives automatiquement

**Pourquoi en 3ème ?**
- Complète la boucle détection → action
- Démontre l'IA proactive
- Dépend de WF3 (dérives)

**Déclenchement** : Trigger sur dérive CRITIQUE

---

### 🟠 PHASE 2 - Production

#### 4. WF6 - Reporting Automatique Quotidien
**Objectif** : Email quotidien consolidé pour la direction

**Déclenchement** : Quotidien 8h30

---

#### 5. WF7 - Alertes Temps Réel
**Objectif** : Notifications instantanées sur événements critiques

**Déclenchement** : Webhook temps réel

---

### 🟡 PHASE 3 - Optimisation

#### 6. WF4 - Prédictions Risques
**Objectif** : Prédire risques futurs à 30/60/90 jours (retard, budget, burn-out)

**Pourquoi plus tard ?**
- Plus complexe (analyse tendances)
- Nécessite historique de données
- WF3 (Dérives) couvre déjà les besoins immédiats

**Déclenchement** : Quotidien 7h00

---

#### 7. WF1 - Synchronisation Données Externes
**Objectif** : Importer automatiquement données depuis Jira, Timesheet, CRM, RH

**Pourquoi en dernier ?**
- Configuration variable selon client
- Alternative MVP : saisie manuelle dans Supabase
- Non bloquant pour démo

**Déclenchement** : Horaire ou webhooks

---

## 📊 Dépendances entre Workflows

```
WF1 (Sync Externes) ──→ Alimente toutes les tables
  ↓
WF2 (Score Santé)
  ↓ (utilise scores)
WF3 (Détection Dérives) + WF4 (Prédictions)
  ↓ (utilise dérives + prédictions)
WF5 (Recommandations)
  ↓ (utilise tout)
WF6 (Reporting) + WF7 (Alertes)
```

**Ordre de développement recommandé** :
- **MVP** : WF2 → WF3 → WF5
- **Production** : WF6 → WF7 → WF4 → WF1

---

## 💰 Budget Mensuel Estimé

| Workflow | Fréquence | Coût/mois |
|----------|-----------|-----------|
| WF1 - Sync Externes | Horaire | $0.00 (HTTP) |
| WF2 - Score Santé | Quotidien | $3.00 |
| WF3 - Détection | Horaire | $36.00 |
| WF4 - Prédictions | Quotidien | $4.50 |
| WF5 - Recommandations | Variable | $8.00 |
| WF6 - Reporting | Quotidien | $1.50 |
| WF7 - Alertes | Variable | $1.00 |
| **TOTAL** | - | **$54.00** |

---

## 🗄️ Tables Supabase Utilisées

### Tables en LECTURE (toutes)
- `projet` : Projets actifs
- `consultant` : Consultants et compétences
- `temps_passe` : Heures travaillées
- `budget_projet` : Budgets et marges
- `incident` : Incidents
- `tache` : Tâches
- `affectation` : Affectations consultants
- `livrable` : Livrables

### Tables en ÉCRITURE (par workflow)
- WF1 → `projet`, `consultant`, `temps_passe`, `incident`, `tache`, `client`
- WF2 → `score_sante_projet`
- WF3 → `detection_derive`
- WF4 → `prediction_risque`
- WF5 → `recommandation_action`
- WF6, WF7 → Aucune (sortie externe)

---

## 🛠️ Technologies

- **N8N** : Orchestration workflows
- **Supabase** : Base de données PostgreSQL
- **OpenRouter** : LLM (GPT-4o-mini principalement)
- **Email** : Notifications (SMTP)
- **Slack/Teams** (optionnel) : Alertes temps réel

---

## 🚀 Prochaines Étapes

### Phase 1 - MVP
1. ✅ Créer structure dossiers workflows (7 workflows)
2. ✅ Rédiger README.md de chaque workflow
3. ⏳ Développer WF2 (Score Santé) - Priorité 1
4. ⏳ Tester WF2 avec données mockup
5. ⏳ Développer WF3 (Détection Dérives)
6. ⏳ Développer WF5 (Recommandations)
7. ⏳ Créer dashboard "War Room"

### Phase 2 - Production
8. ⏳ Développer WF6 (Reporting Quotidien)
9. ⏳ Développer WF7 (Alertes Temps Réel)

### Phase 3 - Optimisation
10. ⏳ Développer WF4 (Prédictions Risques)
11. ⏳ Développer WF1 (Synchronisation Externes)

---

## 📝 Notes

- Chaque workflow sera développé avec `/n8n/production`
- Architecture détaillée créée au moment du développement
- Tests avec données mockup Supabase avant activation
- Tags workflows : `Starting` → `En cours` → `Production`
