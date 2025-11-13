# WF6 - Reporting Automatique Quotidien

## 🎯 Objectif

Générer et envoyer automatiquement chaque matin un **rapport exécutif** consolidant l'état de tous les projets, alertes critiques et recommandations prioritaires.

## 💡 À quoi ça sert ?

- **Visibilité direction** : Rapport synthétique sans effort manuel
- **Routine quotidienne** : Briefing automatique chaque matin
- **Priorisation** : Direction sait immédiatement où agir
- **Suppression reporting manuel** : Gain de temps PMO/Managers

## 🔄 Déclenchement

- **Fréquence** : Quotidien à 8h30 du matin
- **Type** : Schedule automatique (après WF2, WF3, WF4, WF5)

## 📊 Données Utilisées

### Tables Supabase en LECTURE :
- `score_sante_projet` : Scores de la veille
- `detection_derive` : Dérives des dernières 24h
- `prediction_risque` : Prédictions actives
- `recommandation_action` : Actions EN_ATTENTE
- `projet` : Infos projets
- `incident` : Incidents non résolus
- `consultant` : Consultants en surcharge

### Tables Supabase en ÉCRITURE :
Aucune (workflow de sortie)

## ✅ Résultat Attendu

**Email HTML professionnel** envoyé aux destinataires :
- Direction Delivery
- PMO
- Managers (optionnel, filtré par projets)

## 📐 Vue d'Ensemble du Flux

```
[Schedule 8h30]
    ↓
[Récupérer données consolidées]
    ├─ Scores santé projets
    ├─ Dérives 24h
    ├─ Prédictions actives
    └─ Recommandations EN_ATTENTE
    ↓
[Calculs statistiques]
    ↓
[LLM Chain: Génération rapport]
    ↓
[Mise en forme HTML]
    ↓
[Envoi Email]
```

## 📧 Structure du Rapport

### 1. Vue Globale (Header)
- **Nombre projets** par couleur (🟢 VERT / 🟠 ORANGE / 🔴 ROUGE)
- **Score moyen** global
- **Tendance** vs veille (↗️ amélioration / ↘️ dégradation)

### 2. Top 3 Projets Critiques
- Nom projet
- Score santé
- Raison principale de criticité
- Manager responsable

### 3. Alertes Critiques (dernières 24h)
- Dérives CRITIQUES détectées
- Prédictions risque > 80%
- Incidents majeurs non résolus

### 4. Recommandations Prioritaires
- Top 5 actions recommandées
- Type d'action
- Projet concerné
- Statut (EN_ATTENTE)

### 5. Indicateurs Clés
- **Budget** : Marge globale consommée
- **Équipe** : Consultants en surcharge
- **Qualité** : Incidents non résolus

### 6. Résumé Exécutif IA
- Synthèse narrative (200 mots)
- Focus sur points d'attention
- Recommandations stratégiques

## 💰 Coûts Estimés

- **Par exécution** : ~$0.05
- **Par mois** : ~$1.50 (30 jours)
- **Modèle IA** : GPT-4o-mini pour génération texte

## 🚀 Priorité

**🟠 HAUTE - PHASE 2 Production**

Important mais pas critique pour MVP. Peut être remplacé temporairement par un log/export JSON.

## 📝 Notes

- Format HTML responsive (mobile-friendly)
- Optionnel : Export PDF en pièce jointe
- Optionnel : Webhook Slack/Teams pour version courte
- Personnalisation par rôle (Direction vs Manager)
