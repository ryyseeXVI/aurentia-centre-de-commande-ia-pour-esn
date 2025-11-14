# Documentation des Workflows avec Sticky Notes

## Vue d'ensemble

Ce document décrit la fonctionnalité complète de documentation des workflows avec sticky notes interactifs. Cette fonctionnalité permet de créer, gérer et visualiser la documentation de tous les workflows automatisés de manière visuelle et interactive.

## Objectifs

- **Documenter visuellement** : Utiliser des sticky notes colorés pour documenter chaque aspect des workflows
- **Organisation flexible** : Grouper, épingler, filtrer les notes selon les besoins
- **Collaboration** : Permettre aux équipes de documenter et comprendre les workflows facilement
- **Maintenance facilitée** : Avoir une vue d'ensemble claire de tous les workflows et leurs interdépendances

## Architecture

### Base de données

#### Tables principales

1. **workflow_documentation** - Informations principales du workflow
   - `id`, `organization_id`, `workflow_code`, `workflow_name`
   - `objective`, `description`, `trigger_type`, `trigger_config`
   - `priority`, `phase`, `status`
   - `cost_per_execution`, `cost_per_month`
   - `n8n_workflow_id`, `n8n_workflow_url`

2. **workflow_sticky_note** - Notes documentaires
   - `id`, `workflow_id`, `note_type`, `title`, `content`
   - `position_x`, `position_y`, `width`, `height`, `color`
   - `display_order`, `group_id`
   - `is_pinned`, `is_collapsed`, `is_archived`
   - `metadata`, `attachments`

3. **workflow_data_flow** - Flux de données
   - `id`, `workflow_id`, `table_name`, `flow_type` (READ/WRITE/BOTH)
   - `purpose`, `columns_used`

4. **workflow_dependency** - Dépendances entre workflows
   - `id`, `workflow_id`, `depends_on_workflow_id`
   - `dependency_type` (REQUIRED/OPTIONAL/RECOMMENDED)

5. **workflow_step** - Étapes du workflow
   - `id`, `workflow_id`, `step_number`, `step_name`, `step_type`
   - `description`, `code_snippet`, `n8n_node_type`, `configuration`

#### Vues

- **v_workflow_overview** - Vue consolidée avec compteurs
- **v_workflow_with_notes** - Workflow avec toutes les notes actives
- **v_workflow_data_graph** - Graphe des dépendances de données

#### Fonctions

- `get_workflow_by_code()` - Récupérer un workflow par son code
- `clone_workflow_documentation()` - Cloner un workflow complet

### API Routes

#### Workflows

- `GET /api/workflows` - Liste tous les workflows (avec filtres)
- `POST /api/workflows` - Créer un nouveau workflow
- `GET /api/workflows/[workflowId]` - Détails d'un workflow avec relations
- `PUT /api/workflows/[workflowId]` - Mettre à jour un workflow
- `DELETE /api/workflows/[workflowId]` - Supprimer un workflow (ADMIN uniquement)

#### Sticky Notes

- `GET /api/workflows/[workflowId]/sticky-notes` - Liste les notes d'un workflow
- `POST /api/workflows/[workflowId]/sticky-notes` - Créer une note
- `PUT /api/workflows/[workflowId]/sticky-notes/[noteId]` - Modifier une note
- `DELETE /api/workflows/[workflowId]/sticky-notes/[noteId]` - Supprimer une note
- `PATCH /api/workflows/[workflowId]/sticky-notes` - Mise à jour batch des positions

### Composants UI

#### Components de base

1. **StickyNote** (`components/workflows/sticky-note.tsx`)
   - Note individuelle avec drag & drop
   - Menu contextuel (épingler, modifier, supprimer)
   - Couleurs personnalisables (7 couleurs)
   - Support de l'effondrement (collapse)
   - Affichage des métadonnées

2. **StickyNoteBoard** (`components/workflows/sticky-note-board.tsx`)
   - Tableau de notes avec grille
   - Section épinglées séparée
   - Filtres par type et groupe
   - Gestion du drag & drop
   - Compteurs et statistiques

3. **WorkflowCard** (`components/workflows/workflow-card.tsx`)
   - Carte de présentation du workflow
   - Badges de statut, priorité, phase
   - Métadonnées (coût, trigger, compteurs)
   - Liens vers documentation et N8N

#### Pages

1. **WorkflowsListPage** (`app/app/workflows/page.tsx`)
   - Liste de tous les workflows
   - Filtres multiples (statut, phase, priorité, recherche)
   - Groupement par phase
   - Bouton de création (ADMIN/MANAGER)

2. **WorkflowDetailPage** (`app/app/workflows/[workflowId]/page.tsx`)
   - Vue détaillée d'un workflow
   - Onglets : Documentation, Vue d'ensemble, Flux de données, Dépendances, Étapes
   - Board de sticky notes interactif
   - Cartes de statistiques

## Schéma des données

### Types de notes disponibles

- `overview` - Vue d'ensemble
- `step` - Étape du workflow
- `data` - Données utilisées
- `dependency` - Dépendance avec autre workflow
- `warning` - Attention/avertissement
- `cost` - Information de coût
- `custom` - Note personnalisée

### Couleurs disponibles

- `yellow` - Jaune (par défaut)
- `blue` - Bleu
- `green` - Vert
- `red` - Rouge
- `orange` - Orange
- `purple` - Violet
- `pink` - Rose

### Statuts de workflow

- `ACTIVE` - Workflow actif et en production
- `INACTIVE` - Workflow inactif
- `DEVELOPMENT` - En développement
- `TESTING` - En phase de test

### Phases de workflow

- `MVP` - Phase 1 - Minimum Viable Product
- `PRODUCTION` - Phase 2 - En production
- `OPTIMIZATION` - Phase 3 - Optimisation

### Priorités

- `CRITICAL` - Critique
- `HIGH` - Haute
- `MEDIUM` - Moyenne
- `LOW` - Basse

## Installation et Configuration

### 1. Créer les tables

```bash
# Exécuter le schéma SQL dans Supabase
psql -h [supabase-host] -U postgres -d postgres -f workflows/schema-workflow-documentation.sql
```

Ou via l'interface Supabase :
1. Aller dans SQL Editor
2. Copier le contenu de `workflows/schema-workflow-documentation.sql`
3. Exécuter la requête

### 2. Vérifier les tables créées

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'workflow%';
```

Vous devriez voir :
- `workflow_documentation`
- `workflow_sticky_note`
- `workflow_data_flow`
- `workflow_dependency`
- `workflow_step`

### 3. Vérifier les vues

```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'v_workflow%';
```

### 4. Ajouter un lien dans la navigation

Modifier `components/sidebar/app-sidebar.tsx` :

```typescript
{
  title: 'Workflows',
  url: '/app/workflows',
  icon: FileText, // ou GitBranch, Workflow, etc.
}
```

## Utilisation

### Créer un workflow

```typescript
// POST /api/workflows
{
  "workflow_code": "WF8",
  "workflow_name": "Nouveau Workflow",
  "objective": "Description de l'objectif",
  "trigger_type": "schedule",
  "trigger_config": {
    "cron": "0 8 * * *",
    "frequency": "daily"
  },
  "priority": "HIGH",
  "phase": "MVP",
  "status": "DEVELOPMENT",
  "cost_per_execution": 0.05,
  "cost_per_month": 1.50
}
```

### Créer une sticky note

```typescript
// POST /api/workflows/[workflowId]/sticky-notes
{
  "note_type": "overview",
  "title": "Vue d'ensemble",
  "content": "Ce workflow gère...",
  "color": "yellow",
  "position_x": 100,
  "position_y": 100,
  "group_id": "main",
  "metadata": {
    "author": "John Doe",
    "last_review": "2025-01-14"
  }
}
```

### Ajouter des flux de données

```typescript
// Via Supabase client
await supabase.from('workflow_data_flow').insert([
  {
    workflow_id: 'xxx',
    table_name: 'projet',
    flow_type: 'READ',
    purpose: 'Lecture des projets actifs',
    columns_used: ['id', 'nom', 'statut']
  },
  {
    workflow_id: 'xxx',
    table_name: 'score_sante_projet',
    flow_type: 'WRITE',
    purpose: 'Écriture des scores calculés'
  }
])
```

### Ajouter des dépendances

```typescript
await supabase.from('workflow_dependency').insert({
  workflow_id: 'wf3_id',
  depends_on_workflow_id: 'wf2_id',
  dependency_type: 'REQUIRED',
  description: 'WF3 nécessite les scores générés par WF2'
})
```

## Permissions

### ADMIN
- Créer/modifier/supprimer tous les workflows
- Créer/modifier/supprimer toutes les notes
- Accès complet à toutes les fonctionnalités

### MANAGER
- Créer/modifier des workflows
- Créer/modifier/supprimer des notes
- Pas de suppression de workflows

### CONSULTANT / CLIENT
- Lecture seule
- Visualisation de la documentation
- Pas de modification

## Cas d'usage

### Documentation d'un nouveau workflow

1. Créer le workflow via l'API ou l'interface
2. Ajouter des notes "overview" avec l'objectif général
3. Créer des notes "step" pour chaque étape importante
4. Ajouter des notes "data" pour les tables utilisées
5. Créer des notes "warning" pour les points d'attention
6. Épingler les notes les plus importantes
7. Grouper les notes par thématique

### Migration depuis les README.md existants

Pour chaque workflow dans `workflows/WFX-nom/README.md` :

1. Créer le workflow avec les métadonnées du README
2. Parser le README et créer des sticky notes :
   - Section "Objectif" → note "overview"
   - Section "Déclenchement" → note "overview" avec metadata
   - Section "Données Utilisées" → notes "data"
   - Section "Vue d'Ensemble du Flux" → notes "step"
   - Section "Coûts" → note "cost"

3. Ajouter les flux de données depuis la section "Tables Supabase"
4. Créer les dépendances si mentionnées

### Script de migration automatique

Un script peut être créé pour parser les README et créer automatiquement les entrées en base.

## Extensibilité

### Ajouter un nouveau type de note

1. Modifier `lib/validations/workflow-documentation.ts` :
```typescript
export const NoteTypeSchema = z.enum([
  'overview',
  'step',
  'data',
  'dependency',
  'warning',
  'cost',
  'custom',
  'security' // NOUVEAU
])
```

2. Ajouter le label dans `components/workflows/sticky-note.tsx` :
```typescript
const noteTypeLabels = {
  // ...
  security: 'Sécurité'
}
```

### Ajouter une nouvelle couleur

1. Modifier le schéma de validation
2. Ajouter la classe CSS dans `components/workflows/sticky-note.tsx` :
```typescript
const colorClasses = {
  // ...
  cyan: 'bg-cyan-100 border-cyan-300 dark:bg-cyan-900/20 dark:border-cyan-700'
}
```

### Ajouter des champs personnalisés

Les champs `metadata` et `attachments` (JSONB) permettent d'ajouter des données sans modifier le schéma :

```typescript
{
  metadata: {
    estimated_time: '15 minutes',
    complexity: 'medium',
    reviewed_by: 'user@example.com',
    last_incident: '2025-01-10',
    tags: ['critical', 'customer-facing']
  }
}
```

## Optimisations futures

### Fonctionnalités à ajouter

1. **Éditeur de notes avancé**
   - Support du Markdown
   - Attachement de fichiers/images
   - Liens vers d'autres notes

2. **Vue Kanban**
   - Organiser les workflows par statut
   - Drag & drop entre colonnes

3. **Vue Timeline**
   - Historique des modifications
   - Version control des workflows

4. **Recherche avancée**
   - Recherche full-text dans les notes
   - Filtres combinés
   - Recherche par metadata

5. **Export/Import**
   - Export en PDF avec mise en page
   - Export en Markdown
   - Import depuis JSON/YAML

6. **Collaboration temps réel**
   - Voir qui modifie quoi
   - Curseurs collaboratifs
   - Commentaires sur les notes

7. **Templates de workflows**
   - Modèles préconçus
   - Bibliothèque de notes réutilisables

## Troubleshooting

### Les notes ne s'affichent pas

Vérifier :
1. RLS policies activées : `SELECT * FROM workflow_sticky_note WHERE workflow_id = 'xxx'`
2. L'utilisateur appartient à la bonne organisation
3. Les notes ne sont pas archivées : `is_archived = FALSE`

### Impossible de créer un workflow

Vérifier :
1. Le rôle de l'utilisateur (ADMIN ou MANAGER)
2. Le `workflow_code` n'existe pas déjà pour l'organisation
3. Tous les champs obligatoires sont remplis

### Drag & drop ne fonctionne pas

Vérifier :
1. L'utilisateur n'est pas en mode readonly
2. Les événements drag sont bien capturés
3. La propriété `draggable` est à `true`

## Maintenance

### Nettoyage des notes archivées

```sql
-- Supprimer les notes archivées depuis plus de 90 jours
DELETE FROM workflow_sticky_note
WHERE is_archived = TRUE
AND updated_at < NOW() - INTERVAL '90 days';
```

### Backup de la documentation

```sql
-- Export complet
COPY (
  SELECT * FROM workflow_documentation
  JOIN workflow_sticky_note ON workflow_documentation.id = workflow_sticky_note.workflow_id
) TO '/tmp/workflow_backup.csv' CSV HEADER;
```

### Audit des modifications

```sql
-- Notes modifiées récemment
SELECT
  w.workflow_code,
  w.workflow_name,
  wsn.title,
  wsn.updated_at,
  p.nom || ' ' || p.prenom AS modified_by
FROM workflow_sticky_note wsn
JOIN workflow_documentation w ON wsn.workflow_id = w.id
LEFT JOIN profiles p ON wsn.updated_by = p.id
WHERE wsn.updated_at > NOW() - INTERVAL '7 days'
ORDER BY wsn.updated_at DESC;
```

## Ressources

### Fichiers créés

- `workflows/schema-workflow-documentation.sql` - Schéma de base de données
- `lib/validations/workflow-documentation.ts` - Validation Zod
- `app/api/workflows/route.ts` - API liste workflows
- `app/api/workflows/[workflowId]/route.ts` - API workflow individuel
- `app/api/workflows/[workflowId]/sticky-notes/route.ts` - API liste notes
- `app/api/workflows/[workflowId]/sticky-notes/[noteId]/route.ts` - API note individuelle
- `components/workflows/sticky-note.tsx` - Composant note
- `components/workflows/sticky-note-board.tsx` - Composant board
- `components/workflows/workflow-card.tsx` - Composant carte
- `app/app/workflows/page.tsx` - Page liste workflows
- `app/app/workflows/workflow-list.tsx` - Composant liste
- `app/app/workflows/[workflowId]/page.tsx` - Page détail workflow
- `app/app/workflows/[workflowId]/workflow-documentation-view.tsx` - Composant vue

### Documentation associée

- `workflows/README.md` - Vue d'ensemble des workflows
- `workflows/WF1-nom/README.md` à `workflows/WF7-nom/README.md` - Workflows existants

## Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs de l'API (`console.error`)
3. Tester les requêtes SQL directement dans Supabase
4. Créer une issue dans le repository

---

**Version** : 1.0
**Date** : 2025-01-14
**Auteur** : Claude Code
**Status** : ✅ Production Ready
