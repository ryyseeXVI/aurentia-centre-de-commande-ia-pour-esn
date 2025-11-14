# WF2 - Calcul Score Santé Projet

## 🎯 Objectif

Calculer automatiquement chaque jour un **score de santé (0-100)** pour tous les projets actifs, avec une **couleur de risque** (VERT/ORANGE/ROUGE) et un **raisonnement IA détaillé**.

## 💡 À quoi ça sert ?

- **Vision "War Room"** : Vue d'ensemble instantanée de tous les projets
- **Détection précoce** : Identifier les projets en difficulté avant qu'il soit trop tard
- **Priorisation** : Direction/PMO sait où concentrer l'attention
- **Objectivité** : Score basé sur données réelles, pas sur ressenti

## 🔄 Déclenchement

- **Fréquence** : Quotidien à 6h00 du matin
- **Type** : Schedule automatique

## 📊 Données Utilisées

### Tables Supabase en LECTURE :
- `projet` : Projets actifs
- `temps_passe` : Heures travaillées réelles
- `budget_projet` : Budget et marges
- `incident` : Incidents ouverts/résolus
- `tache` : Tâches et leur statut
- `affectation` : Consultants affectés

### Tables Supabase en ÉCRITURE :
- `score_sante_projet` : Insertion du score calculé

## ✅ Résultat Attendu

Pour chaque projet actif, le système stocke :
- **score_global** : 0-100 (entier)
- **couleur_risque** : VERT (80-100) / ORANGE (50-79) / ROUGE (0-49)
- **raisonnement_ia** : Explication détaillée de l'analyse
- **date_analyse** : Date du calcul

## 📐 Vue d'Ensemble du Flux

```
[Schedule 6h00]
    ↓
[Récupérer projets ACTIF]
    ↓
[Pour chaque projet] ───┐
    ↓                    │ LOOP
[Récupérer données]      │
    ↓                    │
[Calculs métriques]      │
    ↓                    │
[Analyse IA]             │
    ↓                    │
[Stocker score] ─────────┘
    ↓
[Log résumé final]
```

## 🎨 Critères d'Analyse IA

L'IA évalue 5 dimensions :

1. **Planning (25%)** : Respect des dates, tâches en retard
2. **Charge (20%)** : Heures réelles vs estimées
3. **Incidents (20%)** : Nombre, sévérité, résolution
4. **Budget/Marge (25%)** : Coûts vs budget, marge réelle
5. **Équipe (10%)** : Stabilité, nombre de consultants

## 💰 Coûts Estimés

- **Par exécution** : ~$0.10
- **Par mois** : ~$3.00 (30 jours)
- **Modèle IA** : GPT-4o-mini (économique)

## 🚀 Priorité

**🔴 CRITIQUE - PHASE 1 MVP**

C'est le workflow le plus visible et le plus impactant pour la démo.

## 📝 Notes

- Permet de créer le dashboard "War Room"
- Base pour les workflows suivants (détection dérives, recommandations)
- Score recalculé chaque jour pour refléter l'évolution
