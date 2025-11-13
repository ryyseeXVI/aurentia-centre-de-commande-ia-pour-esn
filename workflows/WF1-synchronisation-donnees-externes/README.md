# WF1 - Synchronisation Données Externes

## 🎯 Objectif

Synchroniser automatiquement les données depuis les **outils externes** (Jira, Azure DevOps, feuilles de temps, CRM) vers Supabase pour alimenter le Centre de Commande IA.

## 💡 À quoi ça sert ?

- **Agrégation automatique** : Plus de saisie manuelle
- **Données temps réel** : Synchronisation continue (horaire)
- **Source unique de vérité** : Toutes les données dans Supabase
- **Interopérabilité** : Connecte les silos d'outils

## 🔄 Déclenchement

- **Fréquence** : Horaire (ou toutes les 2h selon volume)
- **Type** : Schedule + Webhooks (si outils supportent)

## 📊 Données Synchronisées

### Source → Destination Supabase

#### 1. Jira / Azure DevOps → `incident` + `tache`
**Champs mappés** :
- Issue Jira → `incident` (si type Bug/Incident)
- Task/Story Jira → `tache`
- Statut, priorité, assignee, dates

#### 2. Feuilles de temps → `temps_passe`
**Outils supportés** :
- Timesheet Excel/CSV
- Harvest
- Toggl
- Clockify

**Champs mappés** :
- Consultant → `consultant_id`
- Projet → `projet_id`
- Date + Heures → `date`, `heures_travaillees`

#### 3. CRM (HubSpot, Salesforce) → `client`
**Champs mappés** :
- Company → `client`
- Contact → `contact_principal`
- Deals → Mise à jour `projet.statut`

#### 4. RH / SIRH → `consultant` + `consultant_competence`
**Champs mappés** :
- Employés → `consultant`
- Compétences → `consultant_competence`
- Manager hiérarchique → `manager_id`

## ✅ Résultat Attendu

Tables Supabase mises à jour automatiquement avec :
- **Nouveaux enregistrements** (insert)
- **Mises à jour** (update si existe)
- **Log de synchronisation** (succès/erreurs)

## 📐 Vue d'Ensemble du Flux

```
[Schedule horaire]
    ↓
[Pour chaque source externe] ──┐
    ↓                           │ LOOP
[Authentification API]          │
    ↓                           │
[Récupération données]          │
    ↓                           │
[Transformation/Mapping]        │
    ↓                           │
[Détection nouveaux/modifiés]  │
    ↓                           │
[Upsert dans Supabase] ────────┘
    ↓
[Log résumé synchronisation]
```

## 🔌 Intégrations à Configurer

### 1. Jira/Azure DevOps
**Node N8N** : `n8n-nodes-base.jira` ou `n8n-nodes-base.microsoftToDo`
**API** : REST API + OAuth
**Mapping** :
```
Jira Issue → Supabase
- id → external_id
- summary → titre
- status → statut
- priority → severite
- assignee → consultant_assigne_id
- created → date_ouverture
```

### 2. Feuilles de temps
**Node N8N** : `n8n-nodes-base.httpRequest` (API custom)
**Format** : CSV, JSON, Excel via API
**Mapping** :
```
Timesheet → Supabase
- employee_email → consultant (lookup)
- project_name → projet (lookup)
- date → date
- hours → heures_travaillees
```

### 3. CRM
**Node N8N** : `n8n-nodes-base.hubspot` ou `n8n-nodes-base.salesforce`
**Mapping** :
```
CRM Company → Supabase
- name → client.nom
- industry → secteur
- primary_contact → contact_principal
```

### 4. RH/SIRH
**Node N8N** : `n8n-nodes-base.httpRequest` (API RH)
**Mapping** :
```
Employee → Supabase
- email → consultant.email
- name → nom + prenom
- hire_date → date_embauche
- manager_email → manager_id (lookup)
```

## 🔄 Stratégie de Synchronisation

### Mode Incrémental (recommandé)
- Synchroniser uniquement les modifications depuis dernière sync
- Utiliser timestamps `updated_at` des sources
- Plus rapide et économique

### Mode Complet (fallback)
- Tout resynchroniser (1x/jour la nuit)
- Garantit cohérence totale
- Plus lent mais sécurisé

## 🛡️ Gestion des Erreurs

### Erreurs à gérer
1. **API indisponible** : Retry 3x avec backoff exponentiel
2. **Mapping incomplet** : Log warning, continuer avec données partielles
3. **Duplication** : Upsert avec clé unique (external_id)
4. **Rate limiting** : Batch requests, respecter limites API

## 💰 Coûts Estimés

- **Par exécution** : $0.00 (HTTP requests uniquement)
- **Par mois** : $0.00 (dans limites n8n gratuites)
- **Note** : Coûts API externes selon fournisseurs

## 🚀 Priorité

**🟡 MOYENNE - PHASE 3 Optimisation**

Utile mais pas bloquant pour MVP :
- **Alternative MVP** : Saisie manuelle dans Supabase
- **Alternative intermédiaire** : Import CSV manuel quotidien
- **Production** : Automatisation complète requise

## 📝 Notes

- Configuration variable selon outils client
- Nécessite credentials/API keys multiples
- Tester d'abord avec 1 source (Jira ou Timesheet)
- Peut être développé progressivement (1 source à la fois)

## 🎯 Ordre de Développement Recommandé

1. **Timesheet** (le plus critique pour WF2/WF3)
2. **Jira/Azure DevOps** (incidents et tâches)
3. **CRM** (clients)
4. **RH** (consultants et compétences)
