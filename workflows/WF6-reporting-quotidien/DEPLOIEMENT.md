# 🚀 GUIDE DE DÉPLOIEMENT - WF6 Reporting Quotidien

## 📋 Résumé

- **Workflow** : WF6 - Reporting Automatique Quotidien
- **Objectif** : Email quotidien 8h30 avec état projets + résumé IA
- **Coût** : $0.03/mois (économie 98% vs estimation)
- **Durée dev** : 2-3 heures
- **Nodes** : 22 nodes
- **Complexité** : Moyenne

---

## ✅ ÉTAPE 1 : PRÉREQUIS (5 min)

### 1.1 Créer la table Supabase

```bash
# Se connecter à Supabase SQL Editor
# Copier-coller le contenu de schema-destinataires.sql
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

Résultat attendu : 2 lignes (direction + pmo)

---

### 1.2 Configurer SMTP (Gmail)

**Dans N8N → Settings → Credentials → Add Credential → SMTP**

- **Host** : `smtp.gmail.com`
- **Port** : `587`
- **User** : `noreply@aurentia.agency`
- **Password** : [App Password Gmail]
- **Secure** : Yes (TLS)
- **From Email** : `Reporting ESN <noreply@aurentia.agency>`

**Important** : Utiliser un App Password Gmail, pas le mot de passe principal.

**Générer App Password Gmail** :
1. Google Account → Security → 2-Step Verification → App Passwords
2. Select app : "Mail"
3. Select device : "Other" (N8N)
4. Copier le mot de passe généré

---

### 1.3 Vérifier Credentials Existantes

- ✅ **Supabase (Postgres)** : Déjà configuré
- ✅ **Gemini API** : "Infra Aurentia Agency"
- ✅ **OpenRouter API** : "Infra"

---

## 🏗️ ÉTAPE 2 : CRÉER LE WORKFLOW (2-3h)

### Option A : Création Manuelle (Recommandé pour apprentissage)

**Suivre le plan** : `PLAN-PRODUCTION-FINAL.md`

1. Créer workflow vide : "WF6 - Reporting Automatique Quotidien"
2. Créer **Partie 1** (9 nodes) → Tester
3. Créer **Partie 2** (3 nodes) → Tester
4. Créer **Partie 3** (7 nodes) → Tester
5. Créer **Partie 4** (3 nodes) → Tester

**Avantage** : Comprendre chaque étape, débogage facile

---

### Option B : Utiliser `/n8n/production` (Plus rapide)

```bash
# Depuis le terminal
/n8n/production "Crée le WF6 Reporting Quotidien selon PLAN-PRODUCTION-FINAL.md partie par partie"
```

**Avantage** : Automatisé, rapide

**Note** : Valider chaque partie avant de passer à la suivante.

---

## ✅ ÉTAPE 3 : TESTS (30 min)

### Test 1 : Partie 1 - Data Fetching

**Exécuter manuellement** le workflow (jusqu'à Checkpoint 1)

**Vérifier logs** :
```
✅ CHECKPOINT 1: {
  "partie": "PARTIE 1 - Data Fetching",
  "metrics": {
    "scores": 42,
    "derives": 5,
    "predictions": 3,
    ...
  }
}
```

**Problèmes possibles** :
- Scores = 0 → WF2 n'a pas tourné dans les 48h
- Destinataires = 0 → Table non créée ou vide

---

### Test 2 : Partie 2 - Processing

**Vérifier logs Checkpoint 2** :
```
✅ CHECKPOINT 2: {
  "stats_summary": {
    "total_projets": 42,
    "projets_rouge": 3,
    "score_moyen": 68
  }
}
```

**Vérifier calculs manuellement** (comparer avec données SQL)

---

### Test 3 : Partie 3 - AI Generation

**Vérifier logs Checkpoint 3** :
```
✅ CHECKPOINT 3: {
  "llm_mode": "GEMINI",
  "resume_length": 487,
  "urgence": "MOYEN"
}
```

**Tester fallback** :
1. Déconnecter credentials Gemini/OpenRouter
2. Relancer workflow
3. Vérifier logs : `"llm_mode": "FALLBACK_STATIQUE"`

---

### Test 4 : Partie 4 - Output

**Copier HTML dans navigateur** :
1. Ouvrir logs du node "Build HTML Email"
2. Copier le HTML complet
3. Créer fichier `test.html`
4. Ouvrir dans Chrome/Firefox

**Vérifier** :
- Rendu correct (tables, couleurs, styles)
- Responsive mobile (F12 → Toggle device toolbar)
- Pas d'erreurs CSS

**Envoyer email test** :
1. Modifier temporairement destinataires : votre email perso
2. Exécuter workflow
3. Vérifier réception email
4. Tester dans Gmail, Outlook, Apple Mail

---

## ✅ ÉTAPE 4 : VALIDATION END-TO-END (10 min)

### Exécution Complète

1. **Remettre vrais destinataires** (direction@esn.com, etc.)
2. **Exécuter manuellement** le workflow complet
3. **Vérifier tous les checkpoints** dans logs
4. **Chronométrer** : doit être < 30 secondes
5. **Vérifier email reçu** :
   - Subject correct
   - Contenu complet
   - Pas d'erreurs HTML
   - Données cohérentes

---

## ✅ ÉTAPE 5 : ACTIVATION PRODUCTION (5 min)

### Configuration Finale

1. **Ajouter tag** : "Starting"
2. **Settings workflow** :
   - Execution Order : `v1`
   - Timezone : `Europe/Paris`
3. **Activer le workflow** : Toggle ON

### Premier Test en Production

**Attendre 8h30 le lendemain matin** OU **modifier temporairement** le cron pour test immédiat :

```json
{
  "rule": {
    "interval": [{
      "field": "minutes",
      "minutesInterval": 1  // Toutes les minutes pour test
    }]
  }
}
```

**Après test** : Remettre cron 8h30.

---

## 📊 MONITORING (Quotidien)

### Vérifications Quotidiennes

**Via N8N Interface** :
1. Workflow Executions → Vérifier status SUCCESS
2. Logs → Vérifier 3 checkpoints présents
3. Durée → Doit être < 30s

**Via Email** :
1. Ouvrir email reçu à 8h30
2. Vérifier données cohérentes
3. Vérifier urgence alignée (si 5+ projets rouges → ELEVE)

### Alertes à Surveiller

⚠️ **Workflow échoue 2 jours consécutifs** :
- Vérifier WF2-WF5 ont tourné
- Vérifier table scores non vide
- Vérifier credentials SMTP/LLM valides

⚠️ **Email non reçu mais workflow SUCCESS** :
- Vérifier spam
- Vérifier credentials SMTP
- Tester envoi manuel

⚠️ **Résumé IA vide ou aberrant** :
- Vérifier logs Checkpoint 3
- Si FALLBACK_STATIQUE → Gemini/OpenRouter down
- Vérifier quota API

---

## 🔧 DÉPANNAGE

### Problème : Aucun score disponible

**Erreur** : `Aucun score de santé disponible`

**Cause** : WF2 n'a pas tourné dans les 48h

**Solution** :
1. Vérifier WF2 actif et schedule correct
2. Exécuter WF2 manuellement
3. Relancer WF6

---

### Problème : HTML cassé dans email

**Symptômes** : Mise en page incorrecte, styles manquants

**Cause** : Client email strip certains styles

**Solution** :
1. Vérifier que TOUT est en inline styles
2. Pas de classes CSS
3. Utiliser tables HTML (pas Grid/Flexbox)
4. Code fourni est déjà optimisé pour ça

---

### Problème : LLM timeout ou erreur

**Erreur** : `Erreur génération résumé IA`

**Cause** : Gemini/OpenRouter API indisponible

**Solution** :
- Le fallback mode dégradé s'active automatiquement
- Email envoyé avec résumé statique
- Vérifier logs : `"mode": "FALLBACK_STATIQUE"`
- Pas d'action requise, rapport envoyé quand même

---

### Problème : Email non envoyé

**Erreur** : `SMTP connection failed`

**Solution** :
1. Vérifier credentials SMTP
2. Vérifier port 587 (TLS)
3. Vérifier App Password Gmail valide
4. Tester connexion SMTP depuis N8N

---

## 📈 ÉVOLUTIONS FUTURES

### Phase 2 (Nice-to-have)

- [ ] Export PDF en pièce jointe
- [ ] Graphiques visuels (Chart.js)
- [ ] Notification Slack/Teams
- [ ] Personnalisation par destinataire
- [ ] Comparaison vs semaine dernière

### Optimisations

- [ ] Cache liste projets (change rarement)
- [ ] Métriques tracking (Datadog/Grafana)
- [ ] Tests automatiques du schéma DB

---

## 📝 CHECKLIST DÉPLOIEMENT

- [ ] Table `reporting_destinataires` créée
- [ ] Credentials SMTP configurés
- [ ] Workflow WF6 créé (22 nodes)
- [ ] Test Partie 1 OK (données récupérées)
- [ ] Test Partie 2 OK (calculs corrects)
- [ ] Test Partie 3 OK (résumé IA généré)
- [ ] Test Partie 4 OK (email reçu)
- [ ] Test end-to-end OK (<30s)
- [ ] Test fallback LLM OK
- [ ] Tag "Starting" ajouté
- [ ] Workflow activé
- [ ] Premier email 8h30 reçu et validé
- [ ] Monitoring quotidien en place

---

## 🎉 SUCCÈS !

Une fois tous les tests validés, le WF6 est **PRODUCTION-READY**.

**Coût réel** : $0.03/mois
**Temps économisé** : 20h/mois PMO
**ROI** : Immédiat

**Félicitations !** 🚀
