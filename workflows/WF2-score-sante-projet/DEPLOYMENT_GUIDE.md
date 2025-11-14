# 🚀 WF2 - Guide de Déploiement

## ✅ État Actuel

**Workflow ID**: `22FHNdVFxpmwRe2j`
**Statut**: Configuré et prêt pour tests
**Credentials**: ✅ "supabase ESN Hackaton" appliqué sur tous les nœuds PostgreSQL

## 📋 Checklist de Déploiement

### 1️⃣ Configuration Requise dans N8N

#### Variable d'Environnement (CRITIQUE)

Le workflow utilise `$env.ORGANIZATION_ID` qui doit être configuré dans N8N :

**Option A - Cloud N8N** :
1. Aller dans **Settings → Environments**
2. Ajouter : `ORGANIZATION_ID` = `00000000-0000-0000-0000-000000000001`

**Option B - Self-hosted N8N** :
Ajouter dans le fichier `.env` :
```bash
N8N_ENV_ORGANIZATION_ID=00000000-0000-0000-0000-000000000001
```

> **Note**: L'UUID `00000000-0000-0000-0000-000000000001` est l'organization par défaut créée lors de la migration multi-tenancy.

#### Vérifier la Credential Supabase

✅ Déjà configurée : "supabase ESN Hackaton"

Valider que la connexion contient :
- **Host** : `<project-id>.supabase.co`
- **Database** : `postgres`
- **Port** : `5432`
- **User** : `postgres`
- **Password** : Votre mot de passe Supabase
- **SSL** : Require (important pour Supabase)

### 2️⃣ Test Manuel Avant Activation

#### Ajouter un Nœud de Test Temporaire

1. Ouvrir le workflow dans N8N
2. Ajouter un nœud **Manual Trigger** avant "Schedule Quotidien 6h00"
3. Connecter **Manual Trigger** → **Set Organization ID**
4. Cliquer sur **Execute Workflow**

#### Vérifier les Résultats

**Si le workflow s'exécute avec succès** :
- Chaque nœud SQL devrait retourner des données (ou 0 résultats si aucun incident)
- Le nœud "Insert detection_derive" devrait insérer les incidents détectés
- Le nœud "Upsert score_sante_projet" devrait créer/mettre à jour les scores

**Valider dans Supabase** :
```sql
-- Vérifier les incidents détectés aujourd'hui
SELECT * FROM detection_derive
WHERE date_detection::DATE = CURRENT_DATE
ORDER BY created_at DESC;

-- Vérifier les scores calculés
SELECT
  projet_id,
  score_global,
  couleur_risque,
  raisonnement_ia
FROM score_sante_projet
WHERE date_analyse = CURRENT_DATE;
```

### 3️⃣ Activation du Workflow

Une fois les tests validés :

1. **Supprimer le nœud Manual Trigger** de test
2. **Reconnecter** "Schedule Quotidien 6h00" → "Set Organization ID"
3. **Activer le workflow** : Toggle "Active" sur ON
4. Le workflow s'exécutera automatiquement chaque jour à 6h00 (Europe/Paris)

### 4️⃣ Monitoring Post-Déploiement

#### Vérifier la Première Exécution

Le lendemain à 6h05 :
```sql
-- Vérifier l'exécution d'aujourd'hui
SELECT COUNT(*) as incidents_detectes
FROM detection_derive
WHERE date_detection::DATE = CURRENT_DATE;

-- Vérifier les scores par couleur
SELECT
  couleur_risque,
  COUNT(*) as nb_projets,
  ROUND(AVG(score_global), 1) as score_moyen
FROM score_sante_projet
WHERE date_analyse = CURRENT_DATE
GROUP BY couleur_risque;
```

#### Dashboard N8N

- **Executions** : Vérifier que le workflow s'est exécuté sans erreur
- **Logs** : Consulter les logs pour détecter d'éventuels warnings
- **Duration** : Première exécution peut être lente, ensuite ~10-30 secondes

## 🎯 Incidents Détectés par le Workflow

| Type | Gravité | Seuil | Pénalité |
|------|---------|-------|----------|
| **Dépassement Budget** | CRITIQUE | >20% | -25 pts |
| **Retard Planning** | MAJEUR | >30 jours | -15 pts |
| **Explosion Heures** | CRITIQUE | >150% | -25 pts |
| **Tâches Bloquées** | MOYEN | >7 jours | -2 pts/tâche |
| **Incidents Critiques** | MOYEN | Ouverts | -5 pts/incident |
| **Marge Faible** | MAJEUR | <10% | -15 pts |

## 🎨 Couleurs de Risque

```
VERT   : 80-100 points (Projet sain)
ORANGE : 50-79 points  (Vigilance)
ROUGE  : 0-49 points   (Alerte)
```

## 🔍 Debugging

### Erreur : "organization_id is null"

➡️ La variable d'environnement `ORGANIZATION_ID` n'est pas configurée dans N8N

### Erreur : "Connection refused"

➡️ Vérifier les paramètres de connexion Supabase (credential)

### Erreur : "Column does not exist"

➡️ Vérifier que toutes les migrations Supabase sont appliquées :
```sql
SELECT version FROM supabase_migrations.schema_migrations
ORDER BY version DESC LIMIT 5;
```

### Aucun Incident Détecté

C'est normal si :
- Vous testez sur une base vide
- Tous les projets sont en bonne santé
- Les seuils ne sont pas dépassés

**Pour tester avec des données** : Créer manuellement des dépassements dans la base.

## 📊 Prochaines Étapes

Une fois WF2 actif :
1. ✅ Afficher les scores dans le dashboard "War Room"
2. Créer WF3 - Prédiction de Risques (IA avancée)
3. Créer WF4 - Recommandations d'Actions
4. Intégrer les alertes Slack/Email

## 💡 Optimisations Possibles

### Performance
- Ajouter des index composites sur les colonnes fréquemment filtrées
- Mettre en cache les calculs de `cout_reel` si la table `temps_passe` devient très grande

### Fonctionnalités
- Envoyer une notification Slack si score ROUGE détecté
- Générer un rapport PDF hebdomadaire
- Calculer un "trend" d'évolution du score sur 7 jours

## 📞 Support

En cas de problème :
1. Consulter les logs N8N
2. Vérifier les requêtes SQL dans Supabase Query Editor
3. Valider les données dans les tables sources
