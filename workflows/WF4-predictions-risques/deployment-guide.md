# 🚀 Guide de Déploiement - WF4 Prédictions Risques

## 📋 Vue d'Ensemble

Ce guide vous accompagne pour déployer le workflow **WF4 - Prédictions Risques** dans votre instance N8N.

**Durée estimée** : 30-45 minutes
**Niveau** : Avancé
**Prérequis** : Accès admin N8N + Supabase configuré

---

## ✅ Prérequis

### 1. Base de Données Supabase

- [ ] Table `prediction_risque` créée (exécuter `schema.sql`)
- [ ] Tables sources disponibles : `projet`, `temps_passe`, `budget_projet`, `incident`, `score_sante_projet`, `tache`, `affectation`
- [ ] RLS (Row Level Security) configuré
- [ ] Clé Service Role disponible

### 2. N8N Instance

- [ ] N8N version >= 1.0
- [ ] Accès environnement variables
- [ ] Credentials Supabase configurables
- [ ] Credentials OpenAI configurables (GPT-4o-mini)
- [ ] (Optionnel) Credentials Google Gemini pour fallback

### 3. Fichiers Préparés

- [ ] `schema.sql` - Schéma de la table
- [ ] 10 Code Nodes JavaScript (dossier `/code-nodes/`)
- [ ] 2 Prompts IA (dossier `/prompts/`)
- [ ] Ce guide de déploiement

---

## 📦 ÉTAPE 1 : Créer la Table Supabase

### 1.1 Exécuter le Schéma SQL

Connectez-vous à votre dashboard Supabase et exécutez le fichier `schema.sql` :

```bash
# Depuis SQL Editor de Supabase
# Copier-coller le contenu de schema.sql
```

### 1.2 Vérifier la Création

```sql
-- Vérifier que la table existe
SELECT COUNT(*) FROM prediction_risque;

-- Vérifier les indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'prediction_risque';

-- Vérifier les RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'prediction_risque';
```

**Résultat attendu** :
- Table `prediction_risque` créée
- 6 indexes créés
- 3 policies RLS activées
- 2 fonctions utilitaires disponibles
- 1 vue `v_predictions_critiques`

---

## ⚙️ ÉTAPE 2 : Configurer N8N Environment Variables

### 2.1 Variables Requises

Ajouter dans les **Environment Variables** de votre instance N8N :

```bash
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre_service_role_key_ici

# Optionnel : Configuration avancée
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file
```

### 2.2 Où Configurer ?

**Docker** : Dans `docker-compose.yml`
```yaml
environment:
  - SUPABASE_URL=https://xxxxx.supabase.co
  - SUPABASE_KEY=eyJhbGc...
```

**N8N Cloud** : Settings → Environment Variables

**Self-hosted** : Fichier `.env` ou variables système

### 2.3 Vérifier les Variables

Créer un workflow test avec un Code node :
```javascript
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
return [];
```

---

## 🔐 ÉTAPE 3 : Configurer Credentials

### 3.1 Supabase API Credential

1. N8N → Credentials → Add Credential
2. Type : **Supabase**
3. Nom : `Supabase API` (exactement ce nom)
4. Configuration :
   - **Host** : `https://votre-projet.supabase.co`
   - **Service Role Secret** : Votre clé service_role

**Important** : Le nom doit être exactement `Supabase API` car référencé dans les nodes.

### 3.2 OpenAI API Credential

1. N8N → Credentials → Add Credential
2. Type : **OpenAI**
3. Nom : `OpenAI API`
4. Configuration :
   - **API Key** : Votre clé OpenAI
   - **Organization ID** : (optionnel)

### 3.3 (Optionnel) Google Gemini Fallback

1. N8N → Credentials → Add Credential
2. Type : **Google PaLM / Gemini**
3. Nom : `Google Gemini API`
4. Configuration :
   - **API Key** : Votre clé Google AI

---

## 🏗️ ÉTAPE 4 : Créer le Workflow N8N

### Option A : Import Manuel (Recommandé)

En raison de la complexité du workflow (22 nodes), l'import manuel via l'interface N8N est recommandé.

#### 4.1 Créer un Nouveau Workflow

1. N8N → Workflows → Add Workflow
2. Nom : `WF4 - Prédictions Risques`
3. Settings :
   - Execution Order : **v1**
   - Timezone : **Europe/Paris** (ou votre timezone)
   - Save Execution Progress : **Oui**
   - Save Manual Executions : **Oui**

#### 4.2 Ajouter les Nodes - PARTIE 1 : Trigger

**Node 1.1 - Schedule Trigger**
- Type : `Schedule Trigger`
- Mode : `Trigger Times`
- Trigger Times : Every Day at 7:00 AM
- Cron Expression : `0 7 * * *`

**Node 1.2 - Log Start**
- Type : `Code`
- Mode : `Run Once for All Items`
- Language : `JavaScript`
- Code : Copier depuis `code-nodes/1.2-log-start.js`

#### 4.3 Ajouter les Nodes - PARTIE 2 : Récupération Projets

**Node 2.1 - Get Projets Actifs**
- Type : `Supabase`
- Credential : `Supabase API`
- Operation : `Get Many`
- Table : `projet`
- Return All : **Oui**
- Filters :
  - Field : `statut`
  - Operator : `Equal to`
  - Value : `ACTIF`
- Select Fields : `id, nom, date_debut, date_fin_prevue, statut, client_id`

**Node 2.2 - Validate Projets**
- Type : `Code`
- Code : Copier depuis `code-nodes/2.2-validate-projets.js`

#### 4.4 Ajouter les Nodes - PARTIE 3 : Loop

**Node 3.1 - Split In Batches**
- Type : `Split In Batches`
- Batch Size : `1`
- Options : Defaults

**Node 3.2 - Log Batch**
- Type : `Code`
- Code : Copier depuis `code-nodes/3.2-log-batch.js`

#### 4.5 Ajouter les Nodes - PARTIE 4 : Fetch Historique

**Node 4.1 - Fetch Historique 90j**
- Type : `Code`
- Code : Copier depuis `code-nodes/4.1-fetch-historique.js`
- **Important** : Ce node utilise `process.env.SUPABASE_URL` et `process.env.SUPABASE_KEY`

**Node 4.2 - IF Check Data**
- Type : `IF`
- Conditions :
  - Field : `{{ $json.historique_jours }}`
  - Operation : `Larger or Equal`
  - Value : `7`

**Node 4.3 - Log No Data** (branche false)
- Type : `Code`
- Code : Copier depuis `code-nodes/4.3-log-no-data.js`

**Node 4.4 - Calculs Métriques** (branche true)
- Type : `Code`
- Code : Copier depuis `code-nodes/4.4-calculs-metriques.js`

#### 4.6 Ajouter les Nodes - PARTIE 5 : Agent IA

**⚠️ PARTIE COMPLEXE - Configuration LangChain Agent**

Cette partie nécessite la configuration d'un Agent LangChain avec LLM Chain et Structured Output Parser.

**Node 5.1 - AI Agent**
- Type : `@n8n/n8n-nodes-langchain.agent`
- Agent : `Conversational Agent`
- System Message : Copier depuis `prompts/system-message.md`
- User Message : Copier depuis `prompts/user-message.md`
- **Important** : Utiliser les expressions N8N `{{ $json.xxx }}` dans le user message

**Node 5.2 - OpenAI Chat Model**
- Type : `@n8n/n8n-nodes-langchain.lmChatOpenAi`
- Credential : `OpenAI API`
- Model : `gpt-4o-mini`
- Temperature : `0.3`
- Max Tokens : `2000`

**Node 5.3 - Google Gemini** (fallback - optionnel)
- Type : `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
- Credential : `Google Gemini API`
- Model : `gemini-1.5-flash`

**Node 5.4 - Structured Output Parser**
- Type : `@n8n/n8n-nodes-langchain.outputParserStructured`
- Schema :
```json
{
  "type": "object",
  "properties": {
    "predictions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type_risque": {"type": "string"},
          "probabilite_pct": {"type": "number"},
          "horizon_jours": {"type": "number"},
          "justification": {"type": "string"},
          "confidence": {"type": "number"},
          "consultant_id": {"type": ["string", "null"]}
        },
        "required": ["type_risque", "probabilite_pct", "horizon_jours", "justification"]
      }
    }
  },
  "required": ["predictions"]
}
```

**Node 5.5 - Log Agent Error**
- Type : `Code`
- Code : Copier depuis `code-nodes/5.5-log-agent-error.js`
- Connecté à la branche ERROR de l'agent

#### 4.7 Ajouter les Nodes - PARTIE 6 : Insertion Résultats

**Node 6.1 - Validate Predictions**
- Type : `Code`
- Code : Copier depuis `code-nodes/6.1-validate-predictions.js`

**Node 6.2 - Insert Predictions**
- Type : `Supabase`
- Credential : `Supabase API`
- Operation : `Create`
- Table : `prediction_risque`
- Data Mapping : **Auto** (les champs du JSON précédent)

**Node 6.3 - Log Insert**
- Type : `Code`
- Code : Copier depuis `code-nodes/6.3-log-insert.js`

**Node 6.4 - Loop Over Items**
- Connexion : Retour vers `Split In Batches` (port loop)

**Node 6.5 - Aggregate Results**
- Type : `Code`
- Code : Copier depuis `code-nodes/6.5-aggregate-results.js`
- Connecté au port "Done" de Split In Batches

**Node 6.6 - Log Final**
- Type : `Code`
- Code :
```javascript
console.log('✅ [WF4] Workflow terminé avec succès');
console.log(JSON.stringify($json, null, 2));
return [$json];
```

**Node 6.7 - Stop** (erreur)
- Type : `Stop And Error`
- Error Message : `Workflow WF4 terminé avec erreurs`

#### 4.8 Connecter les Nodes

**Flux principal** :
1. Schedule Trigger → Log Start
2. Log Start → Get Projets Actifs
3. Get Projets Actifs → Validate Projets
4. Validate Projets → Split In Batches
5. Split In Batches → Log Batch
6. Log Batch → Fetch Historique 90j
7. Fetch Historique 90j → IF Check Data
8. IF Check Data (false) → Log No Data → Loop Over Items
9. IF Check Data (true) → Calculs Métriques
10. Calculs Métriques → AI Agent
11. AI Agent → Structured Output Parser → Validate Predictions
12. AI Agent (error) → Log Agent Error → Loop Over Items
13. Validate Predictions → Insert Predictions
14. Insert Predictions → Log Insert
15. Log Insert → Loop Over Items
16. Loop Over Items → Split In Batches (loop)
17. Split In Batches (done) → Aggregate Results
18. Aggregate Results → Log Final

### Option B : Import via API (Avancé)

Si vous préférez utiliser l'API N8N pour créer le workflow automatiquement, voir la section **Import Automatique** à la fin de ce guide.

---

## ✅ ÉTAPE 5 : Tester le Workflow

### 5.1 Test Manuel

1. Ouvrir le workflow dans N8N
2. Cliquer sur "Execute Workflow"
3. Observer les logs dans chaque node

### 5.2 Vérifications

**Logs attendus** :
```
🚀 [WF4] Démarrage workflow Prédictions Risques
✅ [WF4] X projets ACTIF récupérés
🔄 [WF4] Batch 1/X
📊 [WF4] Fetch historique 90j pour projet XXX
📐 [WF4] Calculs métriques pour XXX
💾 [WF4] 5 prédictions insérées dans Supabase
🏁 [WF4] Workflow Prédictions Risques terminé
```

**Base de données** :
```sql
-- Vérifier les prédictions insérées
SELECT COUNT(*) FROM prediction_risque WHERE date_prediction >= NOW() - INTERVAL '1 hour';

-- Voir les prédictions critiques récentes
SELECT * FROM v_predictions_critiques LIMIT 10;
```

### 5.3 Activer le Schedule

Une fois le test réussi :
1. Workflow Settings → Active : **ON**
2. Le workflow s'exécutera automatiquement tous les jours à 7h00

---

## 📊 ÉTAPE 6 : Monitoring

### 6.1 Logs N8N

- Executions → Voir l'historique des exécutions
- Filtrer par Status (Success / Error)
- Analyser la durée d'exécution

### 6.2 Métriques Supabase

```sql
-- Prédictions générées par jour
SELECT
  DATE(date_prediction) as jour,
  COUNT(*) as nb_predictions
FROM prediction_risque
GROUP BY DATE(date_prediction)
ORDER BY jour DESC
LIMIT 30;

-- Répartition par type de risque
SELECT
  type_risque,
  COUNT(*) as total,
  AVG(probabilite_pct) as proba_moyenne
FROM prediction_risque
WHERE date_prediction >= NOW() - INTERVAL '7 days'
GROUP BY type_risque;
```

### 6.3 Qualité Prédictive (Amélioration Continue)

Après 30+ jours, analyser la précision :

```sql
-- Statistiques de qualité
SELECT * FROM stats_qualite_predictive(90);
```

---

## 🚨 Dépannage

### Erreur : "Variables SUPABASE_URL et SUPABASE_KEY requises"

**Cause** : Environment variables non configurées
**Solution** : Vérifier ÉTAPE 2.1 et redémarrer N8N

### Erreur : "Supabase query failed for temps_passe"

**Cause** : Credential Supabase invalide ou RLS trop restrictif
**Solution** : Vérifier que la clé `service_role` est utilisée (bypass RLS)

### Erreur : Agent IA ne retourne pas de JSON valide

**Cause** : Prompt IA mal configuré ou Structured Output Parser manquant
**Solution** : Vérifier que les prompts sont correctement copiés depuis `/prompts/`

### Erreur : "Aucun projet ACTIF trouvé"

**Cause** : Aucun projet avec `statut = 'ACTIF'` dans la base
**Solution** : Créer un projet test ou modifier le filtre

### Workflow très lent (>5 min)

**Cause** : Trop de projets à analyser
**Solution** :
- Augmenter Batch Size dans Split In Batches (ex: 3 projets en parallèle)
- Optimiser les requêtes Supabase avec des indexes
- Passer à GPT-4o-mini si GPT-4 est utilisé

---

## 💰 Coûts Estimés

### Par Exécution
- **OpenAI (GPT-4o-mini)** : ~$0.012 par projet
- **Supabase** : Gratuit (dans les limites du plan)
- **Total** : ~$0.12 pour 10 projets

### Par Mois (30 jours)
- **10 projets** : $3.60/mois
- **50 projets** : $18/mois
- **100 projets** : $36/mois

**Optimisation** : Utiliser GPT-4o-mini (10x moins cher que GPT-4)

---

## 📈 Améliorations Futures

### Phase 1 : MVP (Actuel)
- [x] Règles métier prédéfinies
- [x] Analyse IA avec GPT-4o-mini
- [x] 5 types de risques
- [x] Horizons 30/60/90 jours

### Phase 2 : Optimisations (3-6 mois)
- [ ] Machine Learning custom (entrainement sur historique)
- [ ] Analyse par consultant individuel (burn-out)
- [ ] Prédictions multi-projets (staffing global)
- [ ] Dashboard interactif des prédictions

### Phase 3 : Intelligence Avancée (6-12 mois)
- [ ] Modèle ML propriétaire
- [ ] Analyse de sentiments (satisfaction client)
- [ ] Détection d'anomalies en temps réel
- [ ] Recommandations d'actions correctives automatiques

---

## 📚 Ressources

- **Documentation N8N** : https://docs.n8n.io
- **Supabase Docs** : https://supabase.com/docs
- **OpenAI API** : https://platform.openai.com/docs
- **LangChain** : https://js.langchain.com/docs

---

## ✅ Checklist Finale

Avant de passer en production :

- [ ] Schéma SQL créé et vérifié
- [ ] Environment variables configurées
- [ ] 3 credentials créés (Supabase, OpenAI, Gemini)
- [ ] 22 nodes ajoutés au workflow
- [ ] Toutes les connexions vérifiées
- [ ] Test manuel réussi
- [ ] Prédictions insérées en base
- [ ] Logs corrects dans N8N
- [ ] Schedule activé
- [ ] Monitoring configuré

**Workflow prêt pour production ! 🎉**

---

## 🆘 Support

En cas de problème :
1. Consulter la section Dépannage ci-dessus
2. Vérifier les logs N8N détaillés
3. Tester chaque node individuellement
4. Contacter le support technique interne

**Version du guide** : 1.0
**Dernière mise à jour** : 2025-01-14
