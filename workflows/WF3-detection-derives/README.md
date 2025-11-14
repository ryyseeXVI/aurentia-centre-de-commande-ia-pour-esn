# WF3 - Détection Dérives Temps Réel

## 🎯 Objectif

Détecter automatiquement et en temps réel les **dérives opérationnelles** sur les projets : retards, surcharges, risques budgétaires, incidents critiques.

## 💡 À quoi ça sert ?

- **Alertes immédiates** : Réagir dès qu'une dérive est détectée, pas après
- **Prévention** : Éviter l'effet domino (une dérive en entraîne d'autres)
- **Traçabilité** : Historique complet des dérives pour analyse
- **Action rapide** : Managers/PMO peuvent intervenir immédiatement

## 🔄 Déclenchement

- **Fréquence** : Toutes les heures (24/7)
- **Type** : Schedule automatique + Webhooks (optionnel)

## 📊 Données Utilisées

### Tables Supabase en LECTURE :
- `projet` : Projets actifs
- `tache` : Tâches en retard
- `livrable` : Livrables dépassés
- `temps_passe` : Charge réelle vs estimée
- `affectation` : Charge consultants
- `incident` : Incidents non résolus
- `budget_projet` : Dépassements budgétaires

### Tables Supabase en ÉCRITURE :
- `detection_derive` : Insertion des dérives détectées

## ✅ Résultat Attendu

Pour chaque dérive détectée, le système stocke :
- **type_derive** : PLANNING / CHARGE / BUDGET / INCIDENT / SURCHARGE
- **gravite** : FAIBLE / MOYENNE / HAUTE / CRITIQUE
- **date_detection** : Timestamp précis
- **projet_id** / **consultant_id** : Entité concernée
- **description** : Détails de la dérive (généré par IA)

## 📐 Vue d'Ensemble du Flux

```
[Schedule horaire]
    ↓
[Récupérer projets ACTIF]
    ↓
[Pour chaque projet] ───────┐
    ↓                        │ LOOP
[5 analyses en parallèle]   │
    ├─ Dérive planning       │
    ├─ Surcharge consultant  │
    ├─ Risque budget         │
    ├─ Incidents critiques   │
    └─ Charge dépassée       │
    ↓                        │
[Filtrer dérives détectées] │
    ↓                        │
[Analyse IA contextuelle]   │
    ↓                        │
[Stocker dérives] ──────────┘
    ↓
[Log résumé]
```

## 🔍 Types de Dérives Détectées

### 1. Dérive Planning
- Tâche dépassant date_fin_cible de +3 jours
- Livrable dépassant date_cible

### 2. Surcharge Consultant
- Consultant avec charge_allouee_pct > 100% sur plusieurs projets
- Risque burn-out

### 3. Dérive Charge
- Temps réel dépassant charge estimée de +20%

### 4. Risque Budget
- Coût réel dépassant budget de +10%
- Marge négative ou < 50% de la cible

### 5. Incident Critique
- Incident CRITIQUE non résolu depuis +5 jours

## 💰 Coûts Estimés

- **Par exécution** : ~$0.05
- **Par mois** : ~$36.00 (720 exécutions)
- **Modèle IA** : GPT-4o-mini pour analyse contextuelle

## 🚀 Priorité

**🔴 CRITIQUE - PHASE 1 MVP**

Cœur du système d'alerte. Sans détection, pas de réactivité.

## 📝 Notes

- Détermine gravité (évite spam d'alertes mineures)
- Alimente WF5 (recommandations) et WF7 (alertes)
- Historique complet pour analyse tendances
