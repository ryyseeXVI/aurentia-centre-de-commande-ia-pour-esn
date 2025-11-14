# Guide de Démarrage Rapide - Sticky Notes Workflows

## Installation en 5 minutes

### 1. Créer les tables (2 min)

```bash
# Option A: Via SQL Editor Supabase
# 1. Ouvrir Supabase Dashboard > SQL Editor
# 2. Copier le contenu de workflows/schema-workflow-documentation.sql
# 3. Exécuter

# Option B: Via CLI (si configuré)
supabase db push
```

### 2. Ajouter au menu de navigation (1 min)

Éditer `components/sidebar/app-sidebar.tsx` et ajouter :

```typescript
{
  title: 'Workflows',
  url: '/app/workflows',
  icon: FileText, // Import depuis lucide-react
}
```

### 3. Tester l'installation (2 min)

```bash
npm run dev
```

Aller sur http://localhost:3000/app/workflows

Vous devriez voir :
- Page vide avec message "Aucun workflow trouvé"
- Bouton "Créer le premier workflow" (si ADMIN/MANAGER)

## Premier workflow en 3 étapes

### Étape 1: Créer un workflow via l'API

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_code": "WF2",
    "workflow_name": "Score Santé Projet",
    "objective": "Calculer le score de santé des projets",
    "trigger_type": "schedule",
    "trigger_config": {"cron": "0 6 * * *"},
    "priority": "CRITICAL",
    "phase": "MVP",
    "status": "DEVELOPMENT",
    "cost_per_month": 3.00
  }'
```

Ou via Supabase Dashboard :
```sql
INSERT INTO workflow_documentation (
  organization_id,
  workflow_code,
  workflow_name,
  objective,
  priority,
  phase,
  status
) VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'WF2',
  'Score Santé Projet',
  'Calculer le score de santé des projets',
  'CRITICAL',
  'MVP',
  'DEVELOPMENT'
);
```

### Étape 2: Créer votre première sticky note

Aller sur `/app/workflows/[workflow-id]` et cliquer sur "Ajouter une note"

Ou via API:
```bash
curl -X POST http://localhost:3000/api/workflows/{workflow-id}/sticky-notes \
  -H "Content-Type: application/json" \
  -d '{
    "note_type": "overview",
    "title": "Vue d'\''ensemble",
    "content": "Ce workflow calcule un score de 0 à 100 pour chaque projet",
    "color": "yellow"
  }'
```

### Étape 3: Organiser vos notes

1. **Épingler** les notes importantes (click droit > Épingler)
2. **Grouper** par thématique (éditer > Groupe: "general", "steps", etc.)
3. **Drag & drop** pour réorganiser
4. **Filtrer** par type ou groupe

## Structure recommandée

Pour chaque workflow, créez au minimum:

### 1. Note "Vue d'ensemble" (jaune)
```
Type: overview
Titre: Vue d'ensemble
Contenu: Objectif général du workflow
```

### 2. Notes "Étapes" (bleu)
```
Type: step
Titre: Étape 1: [Nom]
Contenu: Description de l'étape
Groupe: steps
```

### 3. Notes "Données" (vert)
```
Type: data
Titre: Table: [nom_table]
Contenu: Colonnes utilisées, type (READ/WRITE)
Groupe: data
```

### 4. Notes "Attention" (rouge)
```
Type: warning
Titre: Point d'attention
Contenu: Éléments critiques à surveiller
```

## Exemple complet: WF2 - Score Santé

```typescript
// 1. Créer le workflow
const workflow = {
  workflow_code: 'WF2',
  workflow_name: 'Score Santé Projet',
  objective: 'Calculer automatiquement un score de santé (0-100) pour chaque projet',
  trigger_type: 'schedule',
  trigger_config: { cron: '0 6 * * *', frequency: 'daily' },
  priority: 'CRITICAL',
  phase: 'MVP',
  status: 'ACTIVE',
  cost_per_month: 3.00,
  cost_per_execution: 0.10
}

// 2. Créer les notes
const notes = [
  {
    note_type: 'overview',
    title: '🎯 Objectif',
    content: 'Score 0-100 + couleur (VERT/ORANGE/ROUGE) pour chaque projet',
    color: 'yellow',
    is_pinned: true
  },
  {
    note_type: 'step',
    title: 'Étape 1: Récupération projets',
    content: 'SELECT * FROM projet WHERE statut = \'ACTIF\'',
    color: 'blue',
    group_id: 'steps'
  },
  {
    note_type: 'step',
    title: 'Étape 2: Calcul métriques',
    content: 'Planning 25% + Charge 20% + Incidents 20% + Budget 25% + Équipe 10%',
    color: 'blue',
    group_id: 'steps'
  },
  {
    note_type: 'step',
    title: 'Étape 3: Analyse IA',
    content: 'GPT-4o-mini génère score + raisonnement',
    color: 'blue',
    group_id: 'steps'
  },
  {
    note_type: 'data',
    title: '📊 Table: projet (READ)',
    content: 'id, nom, statut, date_debut, date_fin_prevue',
    color: 'green',
    group_id: 'data'
  },
  {
    note_type: 'data',
    title: '📊 Table: temps_passe (READ)',
    content: 'Heures réelles vs estimées',
    color: 'green',
    group_id: 'data'
  },
  {
    note_type: 'data',
    title: '💾 Table: score_sante_projet (WRITE)',
    content: 'score_global, couleur_risque, raisonnement_ia',
    color: 'green',
    group_id: 'data'
  },
  {
    note_type: 'warning',
    title: '⚠️ Limite',
    content: 'Ne fonctionne que pour projets avec > 7 jours de données',
    color: 'red'
  },
  {
    note_type: 'cost',
    title: '💰 Coût',
    content: '$0.10 par exécution\n$3.00 par mois (quotidien)',
    color: 'orange'
  }
]
```

## Raccourcis clavier (à venir)

- `N` - Nouvelle note
- `E` - Éditer note sélectionnée
- `Del` - Supprimer note
- `P` - Épingler/détacher
- `Esc` - Fermer dialog
- `/` - Focus recherche

## Astuces

### 1. Utiliser les couleurs de manière cohérente

- 🟡 **Jaune** : Informations générales, vue d'ensemble
- 🔵 **Bleu** : Étapes et processus
- 🟢 **Vert** : Données, tables, configurations
- 🔴 **Rouge** : Alertes, warnings, limitations
- 🟠 **Orange** : Coûts, budgets
- 🟣 **Violet** : Dépendances, relations
- 🩷 **Rose** : Notes temporaires, TODO

### 2. Grouper logiquement

```
Groupe "general"     → Notes de contexte
Groupe "steps"       → Étapes séquentielles
Groupe "data"        → Tables et données
Groupe "config"      → Configuration
Groupe "security"    → Sécurité
Groupe "monitoring"  → Monitoring et logs
```

### 3. Épingler l'essentiel

Épinglez maximum 3-5 notes par workflow :
- La vue d'ensemble
- L'étape la plus critique
- Les warnings importants

### 4. Utiliser les métadonnées

```json
{
  "metadata": {
    "author": "John Doe",
    "last_review": "2025-01-14",
    "priority": "high",
    "tags": ["important", "review-needed"],
    "estimated_time": "15 minutes"
  }
}
```

## Migration depuis README.md

Si vous avez déjà des workflows documentés dans `workflows/WFX-nom/README.md` :

### Script de migration (à adapter)

```typescript
// scripts/migrate-workflows.ts
async function migrateWorkflow(readmePath: string) {
  const content = await fs.readFile(readmePath, 'utf-8')

  // Parser le README
  const sections = parseMarkdown(content)

  // Créer le workflow
  const workflow = await createWorkflow({
    workflow_code: extractCode(readmePath),
    workflow_name: sections.title,
    objective: sections.objectif,
    // ...
  })

  // Créer les notes
  for (const section of sections) {
    await createNote({
      workflow_id: workflow.id,
      note_type: mapSectionToType(section.title),
      title: section.title,
      content: section.content,
      // ...
    })
  }
}
```

## Dépannage rapide

### Erreur: "Workflow not found"
- Vérifier que le workflow appartient à votre organisation
- Vérifier l'ID du workflow dans l'URL

### Erreur: "Insufficient permissions"
- Vérifier votre rôle (ADMIN ou MANAGER requis pour créer/modifier)
- Vérifier que vous appartenez à une organisation

### Les notes ne s'affichent pas
- Vérifier la console (F12)
- Vérifier que `is_archived = FALSE`
- Rafraîchir la page (F5)

### Le drag & drop ne fonctionne pas
- Utiliser un navigateur récent (Chrome/Firefox)
- Vérifier que vous n'êtes pas en mode readonly
- Vérifier les permissions

## Prochaines étapes

1. ✅ Créer vos 7 workflows (WF1-WF7)
2. ✅ Documenter chaque workflow avec des sticky notes
3. ✅ Organiser par groupes et couleurs
4. ✅ Épingler les informations importantes
5. 📖 Consulter `WORKFLOW-DOCUMENTATION-FEATURE.md` pour plus de détails
6. 📖 Consulter `INTEGRATION-COMPLETE.md` pour l'architecture complète

## Support

- 📖 Documentation complète : `workflows/WORKFLOW-DOCUMENTATION-FEATURE.md`
- 🏗️ Architecture : `workflows/INTEGRATION-COMPLETE.md`
- 🗄️ Schéma SQL : `workflows/schema-workflow-documentation.sql`
- 💬 Issues : https://github.com/[your-repo]/issues

---

**Bonne documentation !** 🚀

Vos workflows sont maintenant documentés de manière visuelle et interactive. L'équipe peut collaborer, les nouveaux membres peuvent comprendre rapidement, et la maintenance devient un jeu d'enfant.
