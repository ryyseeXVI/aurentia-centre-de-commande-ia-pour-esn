# 🚀 WF4 - IMPORT RAPIDE DU WORKFLOW

## 📋 Vue d'Ensemble

Ce guide vous permet d'importer le workflow **WF4 - Prédictions Risques** dans N8N en **moins de 15 minutes**.

**Méthode** : Import JSON + Complétion manuelle des codes

---

## ✅ Prérequis (5 min)

### 1. Vérifier Supabase

- [ ] Table `prediction_risque` créée ✅ (déjà fait)
- [ ] Colonnes WF4 ajoutées ✅ (déjà fait)
- [ ] Functions et views créées ✅ (déjà fait)

### 2. Configurer Environment Variables N8N

Ajouter dans votre instance N8N :
```bash
SUPABASE_URL=https://wvtdnzmdescsvxosunds.supabase.co
SUPABASE_KEY=<votre_service_role_key>
```

**Comment ?**
- Docker : `docker-compose.yml`
- N8N Cloud : Settings → Environment Variables
- Self-hosted : Fichier `.env`

**Redémarrer N8N** après ajout des variables !

### 3. Créer Credentials N8N

#### Credential 1 : Supabase API
- Type : **Supabase**
- Nom : `Supabase API` (exactement ce nom)
- Host : `https://wvtdnzmdescsvxosunds.supabase.co`
- Service Role Secret : `<votre_service_role_key>`

#### Credential 2 : OpenAI API
- Type : **OpenAI**
- Nom : `OpenAI API`
- API Key : `<votre_openai_key>`

#### Credential 3 (Optionnel) : Google Gemini
- Type : **Google Gemini**
- Nom : `Google Gemini API`
- API Key : `<votre_gemini_key>`

---

## 📥 ÉTAPE 1 : Importer le Template (2 min)

### 1.1 Ouvrir N8N

Aller sur votre instance N8N : `http://localhost:5678` ou URL cloud

### 1.2 Importer le Workflow

1. Cliquer sur **Workflows** → **Import from File**
2. Sélectionner le fichier : `WF4-workflow-template.json`
3. Cliquer sur **Import**

✅ Le workflow de base est maintenant créé avec 15 nodes !

---

## 🔧 ÉTAPE 2 : Compléter les Code Nodes (10 min)

Les Code Nodes contiennent actuellement des placeholders. Vous devez copier-coller le code complet depuis les fichiers `code-nodes/*.js`.

### Node par Node

#### 📝 Node : "Log Start"
**Fichier** : `code-nodes/1.2-log-start.js`
1. Double-cliquer sur le node "Log Start"
2. Copier TOUT le contenu de `1.2-log-start.js`
3. Coller dans le champ "JavaScript Code"
4. Cliquer sur "Execute Node" pour tester
5. Save

#### 📝 Node : "Validate Projets"
**Fichier** : `code-nodes/2.2-validate-projets.js`
- Copier-coller le code complet (47 lignes)

#### 📝 Node : "Log Batch"
**Fichier** : `code-nodes/3.2-log-batch.js`
- Copier-coller le code complet (24 lignes)

#### 📝 Node : "Fetch Historique 90j" ⭐ CRITIQUE
**Fichier** : `code-nodes/4.1-fetch-historique.js`
- Copier-coller le code complet (293 lignes)
- **IMPORTANT** : Ce code utilise `process.env.SUPABASE_URL` et `process.env.SUPABASE_KEY`
- Vérifier que les environment variables sont bien configurées

#### 📝 Node : "Log No Data"
**Fichier** : `code-nodes/4.3-log-no-data.js`
- Copier-coller le code complet (24 lignes)

#### 📝 Node : "Calculs Métriques"
**Fichier** : `code-nodes/4.4-calculs-metriques.js`
- Copier-coller le code complet (177 lignes)
- Contient la régression linéaire pour tendance score

#### 📝 Node : "Validate Predictions"
**Fichier** : `code-nodes/6.1-validate-predictions.js`
- Copier-coller le code complet (97 lignes)

#### 📝 Node : "Log Insert"
**Fichier** : `code-nodes/6.3-log-insert.js`
- Copier-coller le code complet (45 lignes)

#### 📝 Node : "Aggregate Results"
**Fichier** : `code-nodes/6.5-aggregate-results.js`
- Copier-coller le code complet (58 lignes)

---

## 🤖 ÉTAPE 3 : Ajouter l'Agent IA (OPTIONNEL - Version Avancée)

**Note** : Le template simplifié saute directement de "Calculs Métriques" à "Validate Predictions". Pour la version complète avec IA, suivez ces étapes :

### 3.1 Ajouter les Nodes LangChain

Entre "Calculs Métriques" et "Validate Predictions", ajouter :

1. **Node : AI Agent**
   - Type : `@n8n/n8n-nodes-langchain.agent`
   - Agent Type : Conversational Agent
   - System Message : Copier depuis `prompts/system-message.md` (2500+ mots)
   - Connecter : OpenAI Chat Model + Structured Output Parser

2. **Node : OpenAI Chat Model**
   - Type : `@n8n/n8n-nodes-langchain.lmChatOpenAi`
   - Credential : `OpenAI API`
   - Model : `gpt-4o-mini`
   - Temperature : `0.3`
   - Max Tokens : `2000`

3. **Node : Structured Output Parser**
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
        }
      }
    }
  }
}
```

4. **Node : Log Agent Error**
   - Type : Code
   - Fichier : `code-nodes/5.5-log-agent-error.js`
   - Connecter à la branche ERROR de l'Agent

### 3.2 Configurer les Prompts

**User Message** (dans l'Agent IA) : Copier depuis `prompts/user-message.md`

**IMPORTANT** : Remplacer les `{{$json.xxx}}` par les expressions N8N appropriées.

---

## ✅ ÉTAPE 4 : Tester le Workflow (2 min)

### 4.1 Vérifier les Connexions

1. Cliquer sur "Execute Workflow"
2. Vérifier qu'il n'y a pas d'erreur de connexion

### 4.2 Test Manuel

1. Exécuter le workflow manuellement
2. Observer les logs de chaque node
3. Vérifier les données dans chaque étape

**Logs attendus** :
```
🚀 [WF4] Démarrage workflow Prédictions Risques
✅ [WF4] X projets ACTIF récupérés
🔄 [WF4] Batch 1/X
📊 [WF4] Fetch historique 90j pour projet XXX
📐 [WF4] Calculs métriques pour XXX
💾 [WF4] 5 prédictions insérées dans Supabase
🏁 [WF4] Workflow terminé
```

### 4.3 Vérifier Supabase

```sql
-- Vérifier les insertions
SELECT COUNT(*) FROM prediction_risque
WHERE date_prediction >= NOW() - INTERVAL '1 hour';

-- Voir les prédictions
SELECT * FROM v_predictions_critiques_wf4 LIMIT 10;
```

---

## 🔄 ÉTAPE 5 : Activer le Schedule

Une fois le test réussi :

1. Workflow Settings → **Active : ON**
2. Le workflow s'exécutera automatiquement tous les jours à **7h00**

---

## 🚨 Dépannage Rapide

### Erreur : "Variables SUPABASE_URL et SUPABASE_KEY requises"

**Solution** :
1. Vérifier environment variables dans N8N
2. **Redémarrer N8N** (important !)
3. Tester avec un Code node simple :
```javascript
console.log('URL:', process.env.SUPABASE_URL);
console.log('KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
return [];
```

### Erreur : "Credential 'Supabase API' not found"

**Solution** :
1. Vérifier que le nom est EXACTEMENT `Supabase API`
2. Recréer le credential si nécessaire
3. Sélectionner manuellement dans les nodes Supabase

### Erreur : "Supabase query failed"

**Solution** :
1. Vérifier que la clé utilisée est `service_role` (pas `anon`)
2. Vérifier que l'URL Supabase est correcte
3. Tester la connexion depuis le SQL Editor de Supabase

### Workflow très lent

**Solution** :
- Normal pour le premier run (cold start)
- Temps attendu : ~12s par projet avec GPT-4o-mini
- Optimiser en augmentant Batch Size (ex: 3 projets en parallèle)

---

## 📊 Version Simplifiée vs Version Complète

### Version Simplifiée (Template actuel) - 15 nodes
✅ **Avantages** :
- Import rapide (15 min)
- Pas besoin de configurer l'Agent IA
- Fonctionne immédiatement
- Génère des prédictions basées sur règles métier

❌ **Limites** :
- Pas d'analyse contextuelle IA
- Justifications génériques
- Probabilités calculées par formules simples

**Idéal pour** : MVP, tests, prototypage rapide

### Version Complète (avec Agent IA) - 22 nodes
✅ **Avantages** :
- Prédictions IA contextuelles
- Justifications détaillées et personnalisées
- Probabilités ajustées selon patterns complexes
- Utilise GPT-4o-mini pour $0.012/projet

❌ **Limites** :
- Configuration plus longue (30 min)
- Nécessite clé OpenAI
- Coût mensuel (mais minime : $3.60/mois pour 10 projets)

**Idéal pour** : Production, décisions stratégiques

---

## 🎯 Prochaines Étapes

Une fois le workflow importé et testé :

1. **Monitoring** : Configurer alertes pour prédictions >= 70%
2. **Dashboard** : Créer vues Supabase pour visualisation
3. **Amélioration continue** : Utiliser `stats_qualite_predictive_wf4()` après 30 jours
4. **Scale** : Augmenter Batch Size si beaucoup de projets

---

## 📚 Références

- **Guide complet** : `deployment-guide.md`
- **Architecture** : `DEPLOIEMENT-COMPLET.md`
- **Spécifications** : `README.md`
- **Code source** : Dossier `code-nodes/`
- **Prompts IA** : Dossier `prompts/`

---

## ✅ Checklist Finale

- [ ] Environment variables configurées et N8N redémarré
- [ ] 3 credentials créés (Supabase, OpenAI, Gemini)
- [ ] Workflow importé depuis JSON
- [ ] Codes complets copiés dans les 9 Code Nodes
- [ ] (Optionnel) Agent IA configuré avec prompts
- [ ] Test manuel réussi
- [ ] Prédictions insérées dans Supabase vérifiées
- [ ] Schedule activé

**Workflow prêt pour production ! 🎉**

---

**Version** : 1.0
**Date** : 2025-01-14
**Temps estimé** : 15-30 minutes selon version
**Difficulté** : ⭐⭐⭐ Intermédiaire
