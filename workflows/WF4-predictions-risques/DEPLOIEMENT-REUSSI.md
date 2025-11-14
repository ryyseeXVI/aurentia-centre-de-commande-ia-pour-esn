# 🎉 WF4 - DÉPLOIEMENT RÉUSSI

## ✅ Statut du Déploiement

**Date** : 2025-11-14 02:54:46 UTC
**Statut** : ✅ DÉPLOYÉ AVEC SUCCÈS
**Workflow ID** : `iNlgDXlHzJcyQtwI`
**Nom** : WF4 - Prédictions Risques
**Version** : Simplifiée (16 nodes, règles métier)

---

## 📍 Accès au Workflow

### Via Interface N8N

```
URL: https://votre-instance-n8n.com/workflow/iNlgDXlHzJcyQtwI
```

Ou dans N8N :
1. Aller dans **Workflows**
2. Chercher "WF4 - Prédictions Risques"
3. Cliquer pour ouvrir

### Architecture Déployée

**16 nodes** créés et connectés :

```
1. Schedule Trigger (7h00 quotidien)
   ↓
2. Log Start
   ↓
3. Get Projets Actifs (Supabase)
   ↓
4. Validate Projets
   ↓
5. Split In Batches (batchSize: 1)
   ↓
6. Log Batch
   ↓
7. Fetch Historique (6 requêtes parallèles via REST API)
   ↓
8. IF Check Data (>= 7 jours)
   ├─ true → 10. Calculs Metriques
   └─ false → 9. Log No Data → loop back

10. Calculs Metriques (régression linéaire)
    ↓
11. Generate Predictions (règles métier)
    ↓
12. Validate Predictions
    ↓
13. Insert Predictions (Supabase)
    ↓
14. Log Insert
    ↓
    Loop back to Split In Batches

    When loop complete:
    ↓
15. Aggregate Results
    ↓
16. Log Final
```

---

## 🚨 ACTIONS REQUISES AVANT ACTIVATION

### 1. Configurer les Environment Variables

Le workflow utilise `process.env.SUPABASE_URL` et `process.env.SUPABASE_KEY`.

**Docker** :
```yaml
# docker-compose.yml
services:
  n8n:
    environment:
      - SUPABASE_URL=https://wvtdnzmdescsvxosunds.supabase.co
      - SUPABASE_KEY=<votre_service_role_key>
```

**N8N Cloud** :
```
Settings → Environment → Environment Variables
Ajouter:
- SUPABASE_URL = https://wvtdnzmdescsvxosunds.supabase.co
- SUPABASE_KEY = <votre_service_role_key>
```

**Self-hosted** :
```bash
# Fichier .env
SUPABASE_URL=https://wvtdnzmdescsvxosunds.supabase.co
SUPABASE_KEY=<votre_service_role_key>
```

⚠️ **IMPORTANT** : Redémarrer N8N après avoir ajouté les variables !

### 2. Créer le Credential Supabase

Le workflow référence un credential nommé **"Supabase API"**.

**Étapes** :
1. Dans N8N : Settings → Credentials → Add Credential
2. Type : **Supabase**
3. Nom : `Supabase API` (exactement ce nom)
4. Configuration :
   - Host : `https://wvtdnzmdescsvxosunds.supabase.co`
   - Service Role Secret : `<votre_service_role_key>`
5. Cliquer "Save"

**Nodes concernés** :
- `Get Projets Actifs` (workflows/WF4-predictions-risques/DEPLOIEMENT-REUSSI.md:3)
- `Insert Predictions` (workflows/WF4-predictions-risques/DEPLOIEMENT-REUSSI.md:13)

### 3. Vérifier la Base de Données

**Tables requises** :
- ✅ `projet` (avec colonne `statut`)
- ✅ `temps_passe`
- ✅ `budget_projet`
- ✅ `incident`
- ✅ `score_sante_projet`
- ✅ `tache`
- ✅ `affectation`
- ✅ `prediction_risque` (avec colonnes WF4)

**Vérification rapide** :
```sql
-- Dans Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('projet', 'prediction_risque', 'temps_passe', 'budget_projet', 'incident', 'score_sante_projet', 'tache', 'affectation');
```

Devrait retourner 8 tables.

**Si colonnes WF4 manquantes** :
```sql
-- Vérifier si migration WF4 appliquée
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'prediction_risque'
  AND column_name IN ('metriques_source', 'confidence', 'justification', 'workflow_execution_id');
```

Si résultat vide → Exécuter `workflows/WF4-predictions-risques/schema.sql`

---

## 🧪 Test du Workflow

### Test Manuel (Recommandé)

1. Ouvrir le workflow dans N8N
2. Cliquer sur **"Execute Workflow"** en haut à droite
3. Observer l'exécution node par node
4. Vérifier les logs dans chaque node

**Logs attendus** :
```
🚀 [WF4] Démarrage workflow Prédictions Risques
⏰ [WF4] Timestamp : 2025-11-14T...
✅ [WF4] X projets ACTIF récupérés
📊 [WF4] Projets à analyser :
   - Nom Projet 1 (id123)
   - Nom Projet 2 (id456)
🔄 [WF4] Batch 1/2
📁 [WF4] Projet : Nom Projet 1 (id123)
📊 [WF4] Fetch historique 90j pour projet Nom Projet 1
📐 [WF4] Calculs métriques pour Nom Projet 1
🎯 [WF4] Indicateurs : 🔴 RETARD | 🟢 BUDGET | 🟢 BURN-OUT
🔮 [WF4] Généré 5 prédictions pour Nom Projet 1
✅ [WF4] Validation 5 prédictions pour Nom Projet 1
✅ 5/5 prédictions validées
   🔴 RETARD : 78% à 30j
   🟡 DEPASSEMENT_BUDGET : 65% à 60j
   🟢 BURN_OUT : 42% à 60j
   🟢 NON_RENOUVELLEMENT : 35% à 90j
   🟡 STAFFING : 55% à 30j
💾 [WF4] 5 prédictions insérées
   📊 RETARD:1 BUDGET:1 BURN-OUT:1 RENOUVELLEMENT:1 STAFFING:1
🔄 [WF4] Batch 2/2
[... répété pour chaque projet ...]
🏁 [WF4] Workflow terminé
📊 [WF4] Traités:2 Skippés:0 Prédictions:10
⏱️  Durée: 8s
✅ [WF4] Workflow terminé avec succès
```

### Vérifier les Insertions Supabase

```sql
-- Nombre de prédictions créées dans la dernière heure
SELECT COUNT(*)
FROM prediction_risque
WHERE date_prediction >= NOW() - INTERVAL '1 hour';

-- Voir les prédictions détaillées
SELECT
  p.nom as projet,
  pr.type_risque,
  pr.probabilite_pct,
  pr.horizon_jours,
  pr.justification,
  pr.confidence,
  pr.date_prediction
FROM prediction_risque pr
JOIN projet p ON p.id = pr.projet_id
WHERE pr.date_prediction >= NOW() - INTERVAL '1 hour'
ORDER BY pr.probabilite_pct DESC
LIMIT 20;

-- Utiliser la vue optimisée
SELECT * FROM v_predictions_critiques_wf4
WHERE date_prediction >= NOW() - INTERVAL '1 hour';
```

---

## 🔄 Activation du Schedule

Une fois le test réussi :

### Option 1 : Via Interface N8N
1. Ouvrir le workflow
2. En haut à droite : Toggle **"Active"** → ON
3. Le workflow s'exécutera automatiquement tous les jours à **7h00** (Europe/Paris)

### Option 2 : Via API
```bash
curl -X PATCH "https://votre-instance-n8n.com/api/v1/workflows/iNlgDXlHzJcyQtwI" \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

**Vérification** :
```bash
# Via API
curl "https://votre-instance-n8n.com/api/v1/workflows/iNlgDXlHzJcyQtwI" \
  -H "X-N8N-API-KEY: your-api-key"

# Devrait retourner: "active": true
```

---

## 📊 Monitoring

### Vérifier les Exécutions

**Via Interface N8N** :
```
Executions → Filter by "WF4 - Prédictions Risques"
```

**Via API** :
```bash
curl "https://votre-instance-n8n.com/api/v1/executions?workflowId=iNlgDXlHzJcyQtwI&limit=10" \
  -H "X-N8N-API-KEY: your-api-key"
```

### Statistiques Supabase

```sql
-- Prédictions générées par jour (7 derniers jours)
SELECT
  DATE(date_prediction) as jour,
  COUNT(*) as total_predictions,
  COUNT(DISTINCT projet_id) as projets_analyses,
  AVG(probabilite_pct) as proba_moyenne,
  COUNT(*) FILTER (WHERE probabilite_pct >= 70) as alertes_critiques
FROM prediction_risque
WHERE date_prediction >= NOW() - INTERVAL '7 days'
GROUP BY DATE(date_prediction)
ORDER BY jour DESC;

-- Top 5 projets à risque
SELECT
  p.nom,
  COUNT(*) as nb_risques_critiques,
  ARRAY_AGG(pr.type_risque) as types_risques,
  MAX(pr.probabilite_pct) as risque_max
FROM prediction_risque pr
JOIN projet p ON p.id = pr.projet_id
WHERE pr.probabilite_pct >= 70
  AND pr.date_prediction >= NOW() - INTERVAL '7 days'
GROUP BY p.nom
ORDER BY risque_max DESC
LIMIT 5;
```

---

## 🔧 Dépannage

### Erreur : "SUPABASE_URL is not defined"

**Cause** : Environment variables non configurées ou N8N pas redémarré

**Solution** :
1. Vérifier que les variables sont bien ajoutées
2. **Redémarrer N8N complètement**
3. Tester avec un Code node simple :
```javascript
console.log('URL:', process.env.SUPABASE_URL);
console.log('KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
return [];
```

### Erreur : "Credential 'Supabase API' not found"

**Cause** : Credential inexistant ou nom incorrect

**Solution** :
1. Vérifier Settings → Credentials
2. Le nom DOIT être exactement `Supabase API`
3. Recréer si nécessaire
4. Ouvrir les nodes "Get Projets Actifs" et "Insert Predictions"
5. Re-sélectionner le credential manuellement

### Erreur : "Table 'prediction_risque' does not exist"

**Cause** : Migrations non appliquées

**Solution** :
```sql
-- Dans Supabase SQL Editor
\i workflows/WF4-predictions-risques/schema.sql
```

Ou copier-coller tout le contenu de `schema.sql` dans SQL Editor.

### Erreur : "Insufficient data (historique_jours < 7)"

**Cause** : Projet récent sans historique

**Solution** : Normal ! Le workflow skip automatiquement les projets avec moins de 7 jours d'historique. Logs :
```
⚠️  [WF4] Projet XXX : données insuffisantes
   Historique : 3 jours (minimum : 7)
```

C'est un comportement attendu pour éviter des prédictions peu fiables.

---

## 🎯 Prochaines Étapes

### 1. Monitoring Automatique (Recommandé)

Créer un webhook pour recevoir des alertes sur prédictions critiques >= 70% :

```javascript
// Ajouter après "Log Insert"
// Node : Webhook Alert (IF probabilite >= 70)
const critiques = $input.all().filter(item => item.json.probabilite_pct >= 70);
if (critiques.length > 0) {
  // Envoyer notification Slack/Email
}
```

### 2. Dashboard Supabase

Créer des vues pour visualisation :

```sql
-- Vue : Projets à surveiller
CREATE OR REPLACE VIEW v_projets_surveiller_wf4 AS
SELECT
  p.nom as projet_nom,
  COUNT(*) FILTER (WHERE pr.probabilite_pct >= 70) as alertes_critiques,
  COUNT(*) FILTER (WHERE pr.probabilite_pct >= 50) as alertes_moderees,
  MAX(pr.date_prediction) as derniere_analyse,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'type', pr.type_risque,
      'proba', pr.probabilite_pct,
      'horizon', pr.horizon_jours
    ) ORDER BY pr.probabilite_pct DESC
  ) as risques
FROM prediction_risque pr
JOIN projet p ON p.id = pr.projet_id
WHERE pr.date_prediction >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.nom
HAVING COUNT(*) FILTER (WHERE pr.probabilite_pct >= 50) > 0
ORDER BY alertes_critiques DESC;
```

### 3. Amélioration Continue

Après 30 jours, évaluer la précision :

```sql
-- Fonction déjà créée dans schema.sql
SELECT * FROM stats_qualite_predictive_wf4();
```

Ajuster les règles métier dans le node "Generate Predictions" si nécessaire.

### 4. Upgrade vers Version IA (Optionnel)

Pour passer à la version complète avec Agent IA GPT-4o-mini :

1. Lire `workflows/WF4-predictions-risques/IMPORT-WORKFLOW.md` section "ÉTAPE 3"
2. Ajouter 6 nodes LangChain entre "Calculs Metriques" et "Validate Predictions"
3. Configurer prompts depuis `workflows/WF4-predictions-risques/prompts/`
4. Créer credential OpenAI API

**Avantages** :
- Justifications IA contextuelles et détaillées
- Probabilités ajustées selon patterns complexes
- Détection de corrélations subtiles

**Coût** : ~$3.60/mois pour 10 projets × 30 jours

---

## 📋 Checklist Finale

- [x] Workflow créé avec ID `iNlgDXlHzJcyQtwI`
- [x] 16 nodes configurés et connectés
- [x] Tous les codes JavaScript embedded
- [ ] Environment variables configurées (`SUPABASE_URL`, `SUPABASE_KEY`)
- [ ] N8N redémarré après ajout des variables
- [ ] Credential "Supabase API" créé
- [ ] Tables Supabase vérifiées (schema.sql appliqué)
- [ ] Test manuel réussi
- [ ] Insertions vérifiées dans `prediction_risque`
- [ ] Workflow activé (schedule 7h00)

**Une fois tous les items cochés → WORKFLOW PRÊT POUR PRODUCTION ! 🚀**

---

## 📚 Documentation Complète

- **Spécifications** : `workflows/WF4-predictions-risques/README.md`
- **Guide déploiement complet** : `workflows/WF4-predictions-risques/deployment-guide.md`
- **Import rapide** : `workflows/WF4-predictions-risques/IMPORT-WORKFLOW.md`
- **Architecture** : `workflows/WF4-predictions-risques/DEPLOIEMENT-COMPLET.md`
- **Codes sources** : `workflows/WF4-predictions-risques/code-nodes/`
- **Prompts IA** : `workflows/WF4-predictions-risques/prompts/`

---

## 🎉 Résumé

**Workflow WF4 - Prédictions Risques** déployé avec succès !

- ✅ ID : `iNlgDXlHzJcyQtwI`
- ✅ 16 nodes opérationnels
- ✅ Architecture complète
- ✅ Tous les codes inline
- ⏳ Nécessite configuration environment variables + credential
- ⏳ Puis test + activation

**Temps estimé pour finaliser** : 10-15 minutes

**Prochaine action** : Configurer les environment variables et créer le credential Supabase !

---

**Version** : 1.0
**Date déploiement** : 2025-11-14 02:54:46 UTC
**Déployé via** : N8N MCP API
**Status** : ✅ SUCCÈS
