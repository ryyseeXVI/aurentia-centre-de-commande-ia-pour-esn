# 🚀 GUIDE D'IMPORT - WF6 Workflow Template

## 📋 Vue d'ensemble

Ce guide explique comment importer le workflow WF6 complet dans N8N à partir du fichier JSON template.

**Fichier à importer** : `WF6-workflow-template.json`
**Nodes inclus** : 24 nodes (100% complet)
**Prêt pour production** : Oui (après configuration credentials)

---

## ⚙️ ÉTAPE 1 : PRÉREQUIS (AVANT IMPORT)

### 1.1 Créer la table Supabase

```bash
# Se connecter à Supabase SQL Editor
# Exécuter le script schema-destinataires.sql
```

Ou directement :

```sql
CREATE TABLE IF NOT EXISTS reporting_destinataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO reporting_destinataires (email, role) VALUES
  ('direction@esn.com', 'DIRECTION'),
  ('pmo@esn.com', 'PMO');
```

**Vérifier** :
```sql
SELECT * FROM reporting_destinataires;
```

### 1.2 Configurer SMTP (Gmail)

**Dans N8N → Settings → Credentials → Add Credential → SMTP**

- **Host** : `smtp.gmail.com`
- **Port** : `587`
- **User** : `noreply@aurentia.agency`
- **Password** : [App Password Gmail]
- **Secure** : Yes (TLS)
- **From Email** : `Reporting ESN <noreply@aurentia.agency>`

---

## 📥 ÉTAPE 2 : IMPORTER LE WORKFLOW

### Option A : Import via Interface N8N (Recommandé)

1. Ouvrir N8N dans le navigateur
2. Cliquer sur **Workflows** → **Add workflow** → **Import from File**
3. Sélectionner `WF6-workflow-template.json`
4. Cliquer **Import**

### Option B : Import via API N8N

```bash
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @WF6-workflow-template.json
```

---

## 🔧 ÉTAPE 3 : CONFIGURER LES CREDENTIALS

Après import, le workflow contient des placeholders pour les credentials. Vous devez les remplacer par vos IDs réels.

### 3.1 Récupérer les Credential IDs

**Dans N8N → Settings → Credentials**, noter les IDs :

```
Supabase (Postgres)   : xxxxx-xxxxx-xxxxx
SMTP Gmail            : yyyyy-yyyyy-yyyyy
Gemini API            : LKvwZ5IMd1Qx6hDE (déjà configuré)
OpenRouter API        : zjFeOZ3Y4KyQ5eov (déjà configuré)
```

### 3.2 Méthode Rapide : Edit JSON avant import

**Avant d'importer**, ouvrir `WF6-workflow-template.json` et remplacer :

```json
"SUPABASE_CREDENTIAL_ID" → votre_supabase_id
"SMTP_CREDENTIAL_ID" → votre_smtp_id
```

**Chercher/Remplacer global** :
- `SUPABASE_CREDENTIAL_ID` → `abc123xyz` (votre ID Supabase)
- `SMTP_CREDENTIAL_ID` → `def456uvw` (votre ID SMTP)

### 3.3 Méthode Manuelle : Edit après import

Après import, ouvrir le workflow et cliquer sur chaque node nécessitant credentials :

**Nodes à configurer (9 nodes Postgres)** :
1. 📊 Get Scores Santé
2. ⚠️ Get Dérives 24h
3. 🔮 Get Prédictions Actives
4. 💡 Get Recommandations EN_ATTENTE
5. 🚨 Get Incidents Non Résolus
6. 👥 Get Consultants Surcharge
7. 📁 Get Projets Actifs
8. 📧 Get Destinataires Email

→ Sélectionner votre credential Supabase

**Node Send Email** :
9. 📧 Send Email SMTP

→ Sélectionner votre credential SMTP

**Nodes LLM (déjà configurés)** :
- 🤖 Gemini 2.0 Flash : `Infra Aurentia Agency`
- 🤖 GPT-4o-mini (Fallback) : `Infra`

---

## ✅ ÉTAPE 4 : VALIDATION STRUCTURE

### 4.1 Vérifier les 24 nodes

Le workflow doit contenir exactement 24 nodes :

**Partie 1 : Foundation (9 nodes)**
- 1x Schedule Trigger
- 8x Postgres queries
- 1x Structure All Data
- 1x Checkpoint 1

**Partie 2 : Processing (3 nodes)**
- 1x Check Data Exists
- 1x Calculate Statistics
- 1x Checkpoint 2

**Partie 3 : AI Generation (7 nodes)**
- 1x Prepare LLM Input
- 1x Gemini 2.0 Flash
- 1x GPT-4o-mini (Fallback)
- 1x LLM Chain
- 1x Output Parser
- 1x Fallback Sans IA
- 1x Checkpoint 3

**Partie 4 : Output (3 nodes)**
- 1x Build HTML Email
- 1x Send Email SMTP
- 1x Log Success

### 4.2 Vérifier les connexions

**Connexions critiques** :
- Trigger → 8 Postgres (parallèle)
- Tous Postgres → Structure All Data
- LLM Chain → 2 sorties (success + error)
- Gemini + OpenRouter → LLM Chain (ai_languageModel)
- Output Parser → LLM Chain (ai_outputParser)

---

## 🧪 ÉTAPE 5 : TESTS

### Test 1 : Exécution Manuelle Complète

1. Cliquer **Execute Workflow** (bouton Play)
2. Vérifier que les 24 nodes s'exécutent sans erreur
3. Temps attendu : < 30 secondes

### Test 2 : Vérifier les Checkpoints

**Ouvrir les logs de chaque checkpoint** :

**Checkpoint 1** doit afficher :
```json
{
  "partie": "PARTIE 1 - Data Fetching",
  "metrics": {
    "scores": 42,
    "derives": 5,
    "predictions": 3,
    ...
  }
}
```

**Checkpoint 2** doit afficher :
```json
{
  "partie": "PARTIE 2 - Processing",
  "stats_summary": {
    "total_projets": 42,
    "projets_rouge": 3,
    "score_moyen": 68
  }
}
```

**Checkpoint 3** doit afficher :
```json
{
  "partie": "PARTIE 3 - AI Generation",
  "llm_mode": "GEMINI",
  "resume_length": 487,
  "urgence": "MOYEN"
}
```

### Test 3 : Vérifier l'Email

1. Ouvrir logs du node **📧 Build HTML Email**
2. Copier le HTML complet
3. Créer fichier `test.html`
4. Ouvrir dans navigateur
5. Vérifier rendu correct

**Envoyer email test** :
1. Modifier temporairement destinataires : votre email perso
2. Exécuter workflow
3. Vérifier réception email
4. Tester dans Gmail, Outlook, Apple Mail

---

## 🎯 ÉTAPE 6 : ACTIVATION PRODUCTION

### 6.1 Configuration Finale

1. **Remettre vrais destinataires** (direction@esn.com, etc.)
2. **Ajouter tag** : "Starting"
3. **Settings workflow** :
   - Execution Order : `v1`
   - Timezone : `Europe/Paris`
4. **Activer le workflow** : Toggle ON

### 6.2 Vérifier le Schedule

Le workflow doit se déclencher **tous les jours à 8h30**.

**Vérifier le cron** :
```json
{
  "field": "hours",
  "triggerAtHour": 8,
  "triggerAtMinute": 30
}
```

---

## 🔍 TROUBLESHOOTING

### Problème : Credentials invalides

**Erreur** : `Authentication failed`

**Solution** :
1. Vérifier que les credential IDs sont corrects
2. Tester la connexion dans Settings → Credentials
3. Vérifier App Password Gmail valide

### Problème : Table destinataires introuvable

**Erreur** : `relation "reporting_destinataires" does not exist`

**Solution** :
1. Exécuter `schema-destinataires.sql` dans Supabase
2. Vérifier avec `SELECT * FROM reporting_destinataires;`
3. Relancer le workflow

### Problème : LLM timeout

**Erreur** : `Timeout waiting for response from Gemini`

**Solution** :
- Le fallback mode dégradé s'active automatiquement
- Email envoyé avec résumé statique
- Vérifier logs Checkpoint 3 : `"mode": "FALLBACK_STATIQUE"`

### Problème : HTML cassé dans email

**Symptômes** : Mise en page incorrecte, styles manquants

**Solution** :
1. Vérifier que tout est en inline styles
2. Pas de classes CSS
3. Utiliser tables HTML (pas Grid/Flexbox)
4. Code fourni est déjà optimisé pour ça

---

## 📊 STRUCTURE DES FICHIERS

```
workflows/WF6-reporting-quotidien/
├── WF6-workflow-template.json       ← Fichier à importer (COMPLET 24 nodes)
├── schema-destinataires.sql         ← Table Supabase (exécuter AVANT import)
├── DEPLOIEMENT.md                   ← Guide déploiement détaillé
├── IMPORT-WORKFLOW.md               ← Ce guide
├── PLAN-PRODUCTION-FINAL.md         ← Spécifications complètes
└── code-nodes/
    └── build-html-email.js          ← Code HTML email (déjà inclus dans JSON)
```

---

## ✅ CHECKLIST IMPORT

- [ ] Table `reporting_destinataires` créée dans Supabase
- [ ] Credentials SMTP configurés dans N8N
- [ ] Credential IDs remplacés dans JSON (ou configurés après import)
- [ ] Workflow importé avec succès (24 nodes)
- [ ] Test exécution manuelle OK
- [ ] 3 Checkpoints affichent logs corrects
- [ ] Email test reçu et validé
- [ ] Tag "Starting" ajouté
- [ ] Workflow activé (Toggle ON)

---

## 🎉 SUCCÈS

Une fois tous les tests validés, le WF6 est **PRODUCTION-READY** et s'exécutera automatiquement tous les jours à 8h30.

**Monitoring** : Vérifier quotidiennement les logs et la réception de l'email.

**Coût** : $0.03/mois
**ROI** : Immédiat (économie 20h/mois PMO)
