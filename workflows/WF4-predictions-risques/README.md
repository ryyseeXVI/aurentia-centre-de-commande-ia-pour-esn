# WF4 - Prédictions Risques

## 🎯 Objectif

Prédire automatiquement les **risques futurs** des projets à horizon 30/60/90 jours : retards, dépassements budgétaires, burn-out consultants, non-renouvellement contrats.

## 💡 À quoi ça sert ?

- **Anticipation** : Détecter les problèmes AVANT qu'ils arrivent
- **Planification** : Ajuster ressources et budgets en avance
- **Staffing prédictif** : Prévoir besoins en consultants
- **Prévention burn-out** : Identifier consultants à risque

## 🔄 Déclenchement

- **Fréquence** : Quotidien à 7h00 (après WF2 Score Santé)
- **Type** : Schedule automatique

## 📊 Données Utilisées

### Tables Supabase en LECTURE :
- `projet` : Projets actifs
- `temps_passe` : Historique charge (30-90 jours)
- `budget_projet` : Consommation budgétaire
- `incident` : Historique incidents
- `tache` : Vélocité d'avancement
- `affectation` : Historique charge consultants
- `consultant` : Profil consultants
- `score_sante_projet` : Évolution scores (tendances)
- `detection_derive` : Historique dérives

### Tables Supabase en ÉCRITURE :
- `prediction_risque` : Insertion des prédictions

## ✅ Résultat Attendu

Pour chaque projet/consultant analysé :
- **type_risque** : RETARD / DEPASSEMENT_BUDGET / BURN_OUT / NON_RENOUVELLEMENT / STAFFING
- **probabilite_pct** : 0-100%
- **horizon_jours** : 30, 60 ou 90 jours
- **projet_id** / **consultant_id** : Entité concernée
- **justification** : Explication IA de la prédiction

## 📐 Vue d'Ensemble du Flux

```
[Schedule 7h00]
    ↓
[Récupérer projets ACTIF]
    ↓
[Pour chaque projet] ─────────┐
    ↓                          │ LOOP
[Récupérer historique 90j]    │
    ├─ Temps passé            │
    ├─ Budget consommé        │
    ├─ Incidents              │
    ├─ Scores santé           │
    └─ Vélocité tâches        │
    ↓                          │
[Calculs tendances/métriques] │
    ↓                          │
[Agent IA - Analyse prédictive]│
    ↓                          │
[5 types de prédictions]      │
    ├─ Risque retard          │
    ├─ Risque budget          │
    ├─ Risque burn-out        │
    ├─ Risque non-renouvellement│
    └─ Prévision staffing     │
    ↓                          │
[Stocker prédictions] ────────┘
    ↓
[Log résumé]
```

## 🔮 Types de Prédictions

### 1. Risque Retard Projet
**Basé sur** :
- Vélocité actuelle (tâches terminées/jour)
- Charge restante estimée
- Jours restants vs date_fin_prevue

**Calcul** :
```
Si (charge_restante / vélocité) > jours_restants * 1.2
→ Probabilité retard = 80%+
```

**Horizons** : 30, 60, 90 jours

---

### 2. Risque Dépassement Budgétaire
**Basé sur** :
- Burn rate actuel (coût/jour)
- Budget restant
- Jours restants projet

**Calcul** :
```
Si (burn_rate * jours_restants) > budget_restant * 0.9
→ Probabilité dépassement = 70%+
```

**Horizons** : 30, 60 jours

---

### 3. Risque Burn-out Consultant
**Basé sur** :
- Charge cumulée >90% sur 4+ semaines
- Nombre d'heures hebdomadaires >45h
- Incidents assignés non résolus >5
- Historique surcharge

**Calcul** :
```
Score risque =
  (charge_moy * 0.4) +
  (heures_hebdo/50 * 0.3) +
  (incidents_ouverts/10 * 0.3)

Si score > 0.8 → Probabilité burn-out = 75%+
```

**Horizons** : 30, 60 jours

---

### 4. Risque Non-Renouvellement Contrat
**Basé sur** :
- Score santé projet <60 sur 30 jours
- Incidents CRITIQUES récurrents
- Dérives fréquentes
- Satisfaction client (si disponible)

**Calcul IA** :
```
Analyse contextuelle multi-facteurs
→ Probabilité basée sur patterns similaires
```

**Horizons** : 60, 90 jours

---

### 5. Prévision Staffing
**Basé sur** :
- Projets finissant dans 30/60 jours
- Nouveaux projets prévus
- Compétences disponibles vs requises
- Taux d'occupation actuel

**Calcul** :
```
Consultants libérés = projets_finissant
Consultants requis = nouveaux_projets
Gap = requis - libérés

Si gap > 0 → Besoin recrutement
Si gap < 0 → Risque inter-contrat
```

**Horizons** : 30, 60 jours

---

## 🤖 Algorithme Prédictif

### Approche Hybride

#### 1. Règles Métier (30%)
- Seuils prédéfinis
- Rapides et explicables
- Exemple : Si charge >120% → Risque retard

#### 2. Analyse Tendances (40%)
- Régression linéaire simple
- Extrapolation historique
- Exemple : Burn rate × jours_restants

#### 3. IA Contextuelle (30%)
- LLM analyse patterns complexes
- Facteurs qualitatifs (incidents, équipe)
- Justification narrative

## 💰 Coûts Estimés

- **Par exécution** : ~$0.15 (Agent IA + calculs)
- **Par mois** : ~$4.50 (30 jours)
- **Modèle IA** : GPT-4o-mini pour analyse, GPT-4 pour prédictions complexes (optionnel)

## 🚀 Priorité

**🟡 MOYENNE - PHASE 3 Optimisation**

Valeur ajoutée mais pas critique pour MVP :
- **Alternative MVP** : WF3 (Dérives) détecte déjà les problèmes actuels
- **Phase 2** : Prédictions basées sur règles simples
- **Phase 3** : Prédictions IA avancées avec historique

## 📊 Métriques de Qualité Prédictive

Pour valider les prédictions dans le temps :

- **Précision** : % de prédictions justes
- **Rappel** : % de risques effectifs détectés
- **Faux positifs** : Alertes inutiles à minimiser

**Amélioration continue** :
- Logger prédictions vs réalité
- Ajuster seuils selon retours
- Entraîner modèle ML (futur)

## 📝 Notes

- Nécessite **historique de données** (30+ jours minimum)
- Qualité prédictions ∝ qualité/quantité données
- Débuter avec règles simples, complexifier progressivement
- Peut utiliser WF2 (scores) comme indicateur prédictif

## 🎯 Développement Progressif

### Phase 1 : MVP Règles Simples
- Prédictions basées sur seuils fixes
- Calculs mathématiques simples
- 3 types de risques : Retard, Budget, Burn-out

### Phase 2 : Tendances Historiques
- Analyse évolution sur 30 jours
- Régression linéaire
- +2 types de risques : Non-renouvellement, Staffing

### Phase 3 : IA Avancée
- Agent IA avec analyse contextuelle
- Patterns complexes multi-facteurs
- Amélioration continue basée sur historique
