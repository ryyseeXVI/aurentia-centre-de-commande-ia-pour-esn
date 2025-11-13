# WF5 - Génération Recommandations IA

## 🎯 Objectif

Générer automatiquement des **recommandations d'actions correctives** lorsqu'une dérive critique est détectée ou qu'un risque élevé est prédit.

## 💡 À quoi ça sert ?

- **IA proactive** : Propose des solutions, pas juste des alertes
- **Gain de temps** : Managers n'ont pas à chercher la solution
- **Cohérence** : Recommandations basées sur best practices ESN
- **Traçabilité** : Suivi des actions recommandées vs actions réalisées

## 🔄 Déclenchement

- **Trigger 1** : Nouvelle dérive HAUTE/CRITIQUE dans `detection_derive`
- **Trigger 2** : Nouvelle prédiction risque > 70% dans `prediction_risque`
- **Trigger 3** : Schedule quotidien (8h) pour consolidation

## 📊 Données Utilisées

### Tables Supabase en LECTURE :
- `detection_derive` : Dérives critiques récentes
- `prediction_risque` : Prédictions à haut risque
- `projet` : Contexte projet
- `consultant` : Compétences disponibles
- `affectation` : Ressources actuelles
- `budget_projet` : Contraintes budgétaires
- `consultant_competence` : Compétences équipe

### Tables Supabase en ÉCRITURE :
- `recommandation_action` : Insertion des recommandations

## ✅ Résultat Attendu

Pour chaque dérive/risque, le système génère :
- **type_action** : RENFORT / CHANGEMENT_RESSOURCE / REPLANIFICATION / ESCALADE / BUDGET / REALLOCATION
- **description_action** : Recommandation détaillée et actionnable
- **statut** : EN_ATTENTE (par défaut)
- **prediction_id** : Lien vers prédiction (si applicable)

## 📐 Vue d'Ensemble du Flux

```
[Trigger: Dérive CRITIQUE OU Risque élevé]
    ↓
[Récupérer contexte complet]
    ├─ Projet
    ├─ Équipe
    ├─ Budget
    └─ Compétences
    ↓
[Agent IA - Analyse multi-critères]
    ↓
[Génération 1-3 recommandations]
    ↓
[Stocker recommandations]
    ↓
[Notification (optionnel)]
```

## 🤖 Types de Recommandations

### 1. Renfort Ressource
- Ajouter consultant avec compétence X
- Suggère profil idéal basé sur `consultant_competence`

### 2. Changement Ressource
- Remplacer consultant surchargé/inadapté
- Propose alternative avec compétences similaires

### 3. Replanification
- Ajuster dates livrables/tâches
- Propose nouveau planning réaliste

### 4. Escalade Client
- Négocier périmètre, délai ou budget
- Justifie avec données factuelles

### 5. Ajustement Budget
- Demander avenant budgétaire
- Calcule montant nécessaire

### 6. Réallocation Compétences
- Optimiser affectations existantes
- Équilibrer charge entre consultants

## 💰 Coûts Estimés

- **Par recommandation** : ~$0.08
- **Par mois** : ~$8.00 (~100 recommandations)
- **Modèle IA** : Agent IA avec GPT-4o-mini + outils

## 🚀 Priorité

**🔴 CRITIQUE - PHASE 1 MVP**

Complète la boucle détection → action. Démontre la valeur de l'IA.

## 📝 Notes

- Utilise Agent IA (pas LLM Chain simple) pour accès aux données
- Recommandations priorisées selon gravité/risque
- Managers peuvent accepter/refuser/modifier (futur)
