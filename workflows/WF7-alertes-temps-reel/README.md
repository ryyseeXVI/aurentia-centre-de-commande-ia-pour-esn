# WF7 - Alertes Temps Réel

## 🎯 Objectif

Envoyer des **notifications instantanées** (email, Slack, SMS) lorsqu'un événement critique se produit nécessitant une action immédiate.

## 💡 À quoi ça sert ?

- **Réactivité maximale** : Notification en <5 min après détection
- **Escalade automatique** : Bonne personne informée au bon moment
- **Éviter crises** : Intervention avant que la situation empire
- **Traçabilité** : Historique des alertes envoyées

## 🔄 Déclenchement

- **Type** : Webhook temps réel sur événements critiques
- **Événements déclencheurs** :
  - Dérive CRITIQUE détectée (WF3)
  - Prédiction risque > 90% (WF4)
  - Incident CRITIQUE ouvert
  - Marge projet < 5%
  - Consultant charge > 120%

## 📊 Données Utilisées

### Tables Supabase en LECTURE :
- `detection_derive` : Dérive déclencheur
- `prediction_risque` : Prédiction déclencheur
- `incident` : Incident critique
- `projet` : Contexte projet
- `consultant` : Consultant concerné
- `profiles` : Destinataires (manager, direction)

### Tables Supabase en ÉCRITURE :
Optionnel : `log_alertes` (historique notifications)

## ✅ Résultat Attendu

**Notification multi-canal** :
- **Email urgent** : Objet préfixé [ALERTE CRITIQUE]
- **Slack/Teams** : Mention @manager ou @channel
- **SMS** (optionnel) : Direction uniquement

## 📐 Vue d'Ensemble du Flux

```
[Webhook: Événement critique]
    ↓
[Identifier type d'alerte]
    ↓
[Récupérer contexte]
    ↓
[Déterminer destinataires]
    ├─ Manager projet
    ├─ PMO
    └─ Direction (si critique)
    ↓
[Génération message IA]
    ↓
[Envoi multi-canal]
    ├─ Email
    ├─ Slack/Teams
    └─ SMS (optionnel)
    ↓
[Log alerte envoyée]
```

## 🚨 Types d'Alertes

### 1. Alerte Dérive Critique
**Déclencheur** : Dérive gravité CRITIQUE
**Destinataires** : Manager projet + PMO
**Contenu** :
- Type de dérive
- Projet concerné
- Données clés
- Action recommandée

### 2. Alerte Risque Imminent
**Déclencheur** : Prédiction risque > 90%
**Destinataires** : Manager + Direction
**Contenu** :
- Type de risque
- Probabilité
- Horizon (jours)
- Action préventive

### 3. Alerte Incident Majeur
**Déclencheur** : Incident CRITIQUE ouvert
**Destinataires** : Manager + Consultant assigné
**Contenu** :
- Titre incident
- Sévérité
- Projet impacté
- Consultant à mobiliser

### 4. Alerte Marge Négative
**Déclencheur** : Marge < 5% ou négative
**Destinataires** : Direction + PMO
**Contenu** :
- Projet concerné
- Marge actuelle vs cible
- Coûts vs budget
- Action corrective urgente

### 5. Alerte Surcharge Consultant
**Déclencheur** : Charge > 120%
**Destinataires** : Manager consultant + RH
**Contenu** :
- Consultant concerné
- Charge cumulée
- Projets affectés
- Risque burn-out

## 💰 Coûts Estimés

- **Par alerte** : ~$0.02
- **Par mois** : ~$1.00 (~50 alertes)
- **Modèle IA** : GPT-4o-mini pour génération message

## 🚀 Priorité

**🟠 HAUTE - PHASE 2 Production**

Important pour production mais pas bloquant pour MVP/démo.

## 📝 Notes

- Éviter spam : Throttling (max 1 alerte/projet/heure)
- Désactivation nocturne optionnelle (23h-7h) sauf CRITIQUE
- Template messages personnalisables par type
- Optionnel : Accusé réception (manager clique "Vu")
