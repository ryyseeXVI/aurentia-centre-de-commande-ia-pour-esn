# ANALYSE PRÉDICTIVE - Projet {{$json.projet_nom}}

Analyse les données ci-dessous et génère **5 prédictions de risques** (une par type : RETARD, DEPASSEMENT_BUDGET, BURN_OUT, NON_RENOUVELLEMENT, STAFFING).

---

## 📋 INFORMATIONS PROJET

- **Nom** : {{$json.projet_nom}}
- **ID** : {{$json.projet_id}}
- **Date début** : {{$json.date_debut}}
- **Date fin prévue** : {{$json.date_fin_prevue}}
- **Jours écoulés** : {{$json.jours_ecoules}}
- **Jours restants** : {{$json.jours_restants}}

---

## 📊 MÉTRIQUES CALCULÉES

### Vélocité et Productivité
- **Vélocité** : {{$json.metriques.velocite_taches_jour}} tâches/jour
- **Heures hebdomadaires** : {{$json.metriques.heures_hebdomadaires}}h

### Budget et Coûts
- **Burn rate** : {{$json.metriques.burn_rate_euro_jour}}€/jour
- **Ratio budget consommé** : {{$json.metriques.ratio_budget_consomme_pct}}%
- **Ratio temps écoulé** : {{$json.metriques.ratio_temps_ecoule_pct}}%

### Équipe et Charge
- **Charge moyenne consultants** : {{$json.metriques.charge_moyenne_pct}}%
- **Tendance score santé** : {{$json.metriques.tendance_score}} pts/jour

---

## 🎯 CALCULS RÈGLES MÉTIER (Indicateurs)

- **Jours nécessaires (vélocité)** : {{$json.calculs_regles.jours_necessaires_velocite}}
- **Budget nécessaire (burn rate)** : {{$json.calculs_regles.budget_necessaire}}€
- **Score burn-out** : {{$json.calculs_regles.score_burnout}}

### Risques Indiqués par Règles
- **Retard indiqué** : {{$json.calculs_regles.risque_retard_indique}}
- **Dépassement budget indiqué** : {{$json.calculs_regles.risque_budget_indique}}
- **Burn-out indiqué** : {{$json.calculs_regles.risque_burnout_indique}}

---

## 💰 DONNÉES BUDGET

- **Montant total** : {{$json.donnees_brutes.budget.montant_total}}€
- **Montant consommé** : {{$json.donnees_brutes.budget.montant_consomme}}€
- **Budget restant** : {{$json.donnees_brutes.budget.budget_restant}}€

---

## 🔥 INCIDENTS

- **Total incidents (90j)** : {{$json.donnees_brutes.incidents.total}}
- **Incidents CRITIQUE** : {{$json.donnees_brutes.incidents.critiques}}
- **Incidents MAJEUR** : {{$json.donnees_brutes.incidents.majeurs}}
- **Incidents MINEUR** : {{$json.donnees_brutes.incidents.mineurs}}
- **Incidents ouverts** : {{$json.donnees_brutes.incidents.ouverts}}

---

## 📈 SCORES SANTÉ (30 derniers jours)

- **Score actuel** : {{$json.donnees_brutes.scores.actuel}}/100
- **Score moyen 30j** : {{$json.donnees_brutes.scores.moyen_30j}}/100
- **Historique scores** : {{JSON.stringify($json.donnees_brutes.scores.historique)}}

---

## ✅ TÂCHES

- **Total tâches** : {{$json.donnees_brutes.taches.total}}
- **À faire** : {{$json.donnees_brutes.taches.a_faire}}
- **En cours** : {{$json.donnees_brutes.taches.en_cours}}
- **Terminées** : {{$json.donnees_brutes.taches.terminees}}
- **Charge restante** : {{$json.donnees_brutes.taches.charge_restante_heures}}h
- **Terminées sur 30j** : {{$json.donnees_brutes.taches.terminees_30j}}

---

## 👥 AFFECTATIONS CONSULTANTS

- **Nombre de consultants** : {{$json.donnees_brutes.affectations.nombre_consultants}}
- **Taux occupation moyen** : {{$json.donnees_brutes.affectations.taux_occupation_moyen}}%

---

## ⏱️ TEMPS PASSÉ

- **Total heures (90j)** : {{$json.donnees_brutes.temps_passe.total_heures_90j}}h
- **Jours avec activité** : {{$json.donnees_brutes.temps_passe.jours_activite}}
- **Heures moyennes/jour** : {{$json.donnees_brutes.temps_passe.heures_moyennes_jour}}h

---

# 🎯 INSTRUCTIONS

Génère **5 prédictions de risques** en appliquant les règles métier définies dans ton System Message.

Pour chaque risque :
1. Applique la **règle métier de base**
2. Analyse les **indicateurs fournis**
3. Détermine la **probabilité** (0-100%)
4. Choisis l'**horizon** approprié (30, 60 ou 90 jours)
5. Rédige une **justification détaillée** citant des chiffres précis

**Format de sortie attendu** : JSON avec structure `predictions` (array de 5 objets).

Sois rigoureux, factuel et précis. Tes prédictions seront utilisées pour des décisions stratégiques.
