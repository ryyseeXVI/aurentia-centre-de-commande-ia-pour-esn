# Intégration Complète : Sticky Notes dans les Workflows

## Vue d'ensemble

Ce document décrit l'intégration complète des sticky notes dans les workflows, permettant une documentation visuelle et interactive directement depuis l'interface utilisateur.

## Architecture complète

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERFACE UTILISATEUR                       │
├─────────────────────────────────────────────────────────────────┤
│  /app/workflows                                                 │
│  ├─ WorkflowList (Liste des workflows)                         │
│  │  └─ WorkflowCard (Carte workflow)                           │
│  │                                                              │
│  /app/workflows/[workflowId]                                   │
│  └─ WorkflowDocumentationView                                  │
│     ├─ StickyNoteBoard (Board principal)                       │
│     │  └─ StickyNote (Notes individuelles)                     │
│     └─ StickyNoteDialog (Création/Édition)                     │
├─────────────────────────────────────────────────────────────────┤
│                       GESTION D'ÉTAT                            │
├─────────────────────────────────────────────────────────────────┤
│  useStickyNotes Hook                                            │
│  ├─ State management                                            │
│  ├─ API calls                                                   │
│  ├─ Optimistic updates                                          │
│  └─ Auto-refresh (optionnel)                                    │
├─────────────────────────────────────────────────────────────────┤
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  GET    /api/workflows                                          │
│  POST   /api/workflows                                          │
│  GET    /api/workflows/[workflowId]                            │
│  PUT    /api/workflows/[workflowId]                            │
│  DELETE /api/workflows/[workflowId]                            │
│                                                                  │
│  GET    /api/workflows/[workflowId]/sticky-notes               │
│  POST   /api/workflows/[workflowId]/sticky-notes               │
│  PATCH  /api/workflows/[workflowId]/sticky-notes               │
│  PUT    /api/workflows/[workflowId]/sticky-notes/[noteId]     │
│  DELETE /api/workflows/[workflowId]/sticky-notes/[noteId]     │
├─────────────────────────────────────────────────────────────────┤
│                        DATABASE                                 │
├─────────────────────────────────────────────────────────────────┤
│  workflow_documentation                                         │
│  workflow_sticky_note                                           │
│  workflow_data_flow                                             │
│  workflow_dependency                                            │
│  workflow_step                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Composants créés

### 1. Hook personnalisé : `useStickyNotes`

**Fichier** : `hooks/use-sticky-notes.ts`

**Fonctionnalités** :
- ✅ Gestion d'état centralisée des sticky notes
- ✅ CRUD operations avec optimistic updates
- ✅ Auto-refresh optionnel (configurable)
- ✅ Utilitaires de filtrage (par type, groupe, épinglées)
- ✅ Gestion des erreurs avec toast notifications

**Utilisation** :
```typescript
const {
  notes,              // Array des notes
  isLoading,          // État de chargement
  createNote,         // Créer une note
  updateNote,         // Modifier une note
  deleteNote,         // Supprimer/archiver
  pinNote,            // Épingler/détacher
  updatePositions,    // Batch update des positions
  refresh             // Rafraîchir manuellement
} = useStickyNotes({
  workflowId: 'xxx',
  initialNotes: [],
  autoRefresh: true,  // Auto-refresh toutes les 30s
  refreshInterval: 30000
})
```

### 2. Dialog de création/édition : `StickyNoteDialog`

**Fichier** : `components/workflows/sticky-note-dialog.tsx`

**Fonctionnalités** :
- ✅ Formulaire complet avec validation Zod
- ✅ Support création et édition
- ✅ Sélection visuelle de couleur
- ✅ Choix du type de note avec descriptions
- ✅ Paramètres de dimension (largeur/hauteur)
- ✅ Groupement optionnel
- ✅ État de chargement pendant sauvegarde

**Props** :
```typescript
interface StickyNoteDialogProps {
  open: boolean                    // Ouvert/fermé
  onOpenChange: (open: boolean) => void
  workflowId: string               // ID du workflow
  note?: StickyNote                // Note à éditer (undefined = création)
  onSuccess?: () => void           // Callback après succès
}
```

### 3. Board de notes : `StickyNoteBoard`

**Fichier** : `components/workflows/sticky-note-board.tsx`

**Fonctionnalités** :
- ✅ Affichage en grille responsive
- ✅ Section séparée pour notes épinglées
- ✅ Filtres par type et groupe
- ✅ Drag & drop pour réorganiser
- ✅ Compteurs et statistiques
- ✅ Empty states informatifs

### 4. Note individuelle : `StickyNote`

**Fichier** : `components/workflows/sticky-note.tsx`

**Fonctionnalités** :
- ✅ 7 couleurs disponibles
- ✅ Drag & drop natif
- ✅ Menu contextuel (éditer, épingler, supprimer)
- ✅ Collapse/expand
- ✅ Affichage des métadonnées
- ✅ Indicateur de groupe

### 5. Carte de workflow : `WorkflowCard`

**Fichier** : `components/workflows/workflow-card.tsx`

**Fonctionnalités** :
- ✅ Vue synthétique du workflow
- ✅ Badges de statut/priorité/phase
- ✅ Compteurs (notes, étapes, tables)
- ✅ Lien vers documentation et N8N
- ✅ Affichage du coût mensuel

## Flux de données

### Création d'une sticky note

```
User Action
  ↓
[Click "Ajouter une note"]
  ↓
[StickyNoteDialog s'ouvre]
  ↓
[User remplit le formulaire]
  ↓
[Validation Zod]
  ↓
[POST /api/workflows/{id}/sticky-notes]
  ↓
[Optimistic update dans useStickyNotes]
  ↓
[Toast success]
  ↓
[Refresh de la page]
  ↓
[Board mis à jour]
```

### Modification d'une sticky note

```
User Action
  ↓
[Click "Modifier" sur une note]
  ↓
[StickyNoteDialog s'ouvre avec note pré-remplie]
  ↓
[User modifie les champs]
  ↓
[PUT /api/workflows/{id}/sticky-notes/{noteId}]
  ↓
[Optimistic update]
  ↓
[Toast success]
  ↓
[Board mis à jour]
```

### Drag & Drop

```
User Action
  ↓
[User commence à drag une note]
  ↓
[onDragStart: État dragging activé]
  ↓
[User déplace la note]
  ↓
[onDragOver: Prévention du comportement par défaut]
  ↓
[User relâche la note]
  ↓
[onDrop: Calcul nouvelle position (x, y)]
  ↓
[PATCH /api/workflows/{id}/sticky-notes (batch)]
  ↓
[Update local immédiat]
  ↓
[Synchronisation backend]
```

## Permissions et sécurité

### Niveau d'accès

| Rôle       | Visualiser | Créer | Modifier | Supprimer | Épingler |
|------------|-----------|-------|----------|-----------|----------|
| ADMIN      | ✅        | ✅    | ✅       | ✅        | ✅       |
| MANAGER    | ✅        | ✅    | ✅       | ❌*       | ✅       |
| CONSULTANT | ✅        | ❌    | ❌       | ❌        | ❌       |
| CLIENT     | ✅        | ❌    | ❌       | ❌        | ❌       |

*MANAGER peut archiver mais pas supprimer définitivement

### RLS (Row Level Security)

Toutes les requêtes sont filtrées par :
1. **organization_id** - Isolation multi-tenant
2. **user_id** - Permissions utilisateur
3. **role** - Vérification du rôle

Les policies RLS sont définies dans le schéma SQL.

## Synchronisation et performance

### Optimistic Updates

Toutes les modifications sont appliquées immédiatement dans l'UI avant la confirmation du serveur :

```typescript
// Exemple: Pin une note
const pinNote = async (noteId, isPinned) => {
  // 1. Update immédiat dans l'UI
  setNotes(prev =>
    prev.map(n => n.id === noteId ? {...n, is_pinned: isPinned} : n)
  )

  // 2. Appel API
  const response = await fetch(...)

  // 3. Si erreur, rollback (TODO: implémenter)
  if (!response.ok) {
    setNotes(prev => /* rollback */)
  }
}
```

### Auto-refresh

Le hook `useStickyNotes` supporte le rafraîchissement automatique :

```typescript
useStickyNotes({
  workflowId: 'xxx',
  autoRefresh: true,        // Activer auto-refresh
  refreshInterval: 30000    // Toutes les 30 secondes
})
```

### Batch Updates

Pour de meilleures performances, les mises à jour de position peuvent être groupées :

```typescript
// Au lieu de:
await updatePosition(note1, x1, y1)
await updatePosition(note2, x2, y2)

// Faire:
await updatePositions([
  { id: note1.id, position_x: x1, position_y: y1 },
  { id: note2.id, position_x: x2, position_y: y2 }
])
```

## Utilisation dans les workflows

### Page liste des workflows

```tsx
// app/app/workflows/page.tsx
<WorkflowList
  workflows={workflows}
  readonly={isReadOnly}
  canCreate={!isReadOnly}
/>
```

### Page détail d'un workflow

```tsx
// app/app/workflows/[workflowId]/page.tsx
<WorkflowDocumentationView
  workflow={workflowWithRelations}
  readonly={isReadOnly}
/>
```

### Intégration du hook

```tsx
'use client'

export function WorkflowDocumentationView({ workflow, readonly }) {
  const { notes, createNote, updateNote, deleteNote, pinNote } = useStickyNotes({
    workflowId: workflow.id,
    initialNotes: workflow.sticky_notes
  })

  return (
    <>
      <StickyNoteBoard
        notes={notes}
        onAddNote={() => setShowDialog(true)}
        onEditNote={handleEdit}
        onDeleteNote={deleteNote}
        onPinNote={pinNote}
        readonly={readonly}
      />

      <StickyNoteDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        workflowId={workflow.id}
        note={editingNote}
        onSuccess={() => refresh()}
      />
    </>
  )
}
```

## Configuration et personnalisation

### Types de notes disponibles

```typescript
type NoteType =
  | 'overview'      // Vue d'ensemble
  | 'step'          // Étape du workflow
  | 'data'          // Données/Tables
  | 'dependency'    // Dépendance
  | 'warning'       // Attention
  | 'cost'          // Coût
  | 'custom'        // Personnalisé
```

### Couleurs disponibles

```typescript
type NoteColor =
  | 'yellow'   // Jaune (défaut)
  | 'blue'     // Bleu
  | 'green'    // Vert
  | 'red'      // Rouge
  | 'orange'   // Orange
  | 'purple'   // Violet
  | 'pink'     // Rose
```

### Dimensions

- **Largeur** : 200px - 800px (défaut: 300px)
- **Hauteur** : 150px - 600px (défaut: 200px)

## Exemples d'utilisation

### 1. Créer une note de vue d'ensemble

```typescript
await createNote({
  note_type: 'overview',
  title: 'Vue d\'ensemble WF2',
  content: 'Ce workflow calcule le score de santé de chaque projet...',
  color: 'yellow',
  group_id: 'general'
})
```

### 2. Créer une note d'étape

```typescript
await createNote({
  note_type: 'step',
  title: 'Étape 1: Récupération des projets',
  content: 'Requête Supabase pour obtenir tous les projets ACTIFS...',
  color: 'blue',
  group_id: 'steps'
})
```

### 3. Créer une note de données

```typescript
await createNote({
  note_type: 'data',
  title: 'Table: projet',
  content: 'Lecture: id, nom, statut, date_debut, date_fin_prevue',
  color: 'green',
  group_id: 'data'
})
```

### 4. Épingler une note importante

```typescript
await pinNote(noteId, true)
```

### 5. Organiser par groupes

Créer plusieurs notes avec le même `group_id` pour les regrouper visuellement :

```typescript
// Groupe "configuration"
await createNote({ ..., group_id: 'configuration' })
await createNote({ ..., group_id: 'configuration' })

// Groupe "sécurité"
await createNote({ ..., group_id: 'sécurité' })
```

## Maintenance et bonnes pratiques

### 1. Limiter le nombre de notes

Pour de meilleures performances, évitez d'avoir plus de 50 notes par workflow. Privilégiez :
- Le groupement par thématique
- L'utilisation des métadonnées JSONB
- La création de workflows séparés si nécessaire

### 2. Nommage des groupes

Utilisez des noms cohérents pour les groupes :
- `general` - Informations générales
- `steps` - Étapes du workflow
- `data` - Données et tables
- `config` - Configuration
- `security` - Sécurité
- `cost` - Coûts et budgets

### 3. Archivage régulier

Les notes obsolètes doivent être archivées plutôt que supprimées :
- Suppression douce par défaut (is_archived = true)
- Suppression définitive réservée aux ADMIN
- Nettoyage automatique après 90 jours (configurable)

### 4. Utilisation des métadonnées

Enrichissez vos notes avec des métadonnées :

```typescript
{
  metadata: {
    author: 'John Doe',
    last_review: '2025-01-14',
    priority: 'high',
    tags: ['important', 'review-needed'],
    related_tickets: ['JIRA-123', 'JIRA-456']
  }
}
```

## Dépannage

### Les notes ne s'affichent pas

1. Vérifier la console pour les erreurs
2. Vérifier que le workflow existe
3. Vérifier les permissions RLS
4. Tester l'API directement : `GET /api/workflows/{id}/sticky-notes`

### Le drag & drop ne fonctionne pas

1. Vérifier que `readonly={false}`
2. Vérifier la propriété `draggable` sur la note
3. Tester sur un navigateur récent (Chrome/Firefox)

### Les modifications ne se sauvegardent pas

1. Vérifier la console réseau (Network tab)
2. Vérifier les permissions utilisateur (ADMIN/MANAGER)
3. Vérifier la validation Zod des données
4. Tester la route API avec curl/Postman

### Le hook ne rafraîchit pas automatiquement

1. Vérifier `autoRefresh={true}`
2. Vérifier `refreshInterval` (défaut: 30000ms)
3. Vérifier qu'il n'y a pas d'erreur dans `useEffect`

## Évolutions futures

### Court terme
- [ ] Drag & drop entre groupes
- [ ] Recherche full-text dans les notes
- [ ] Export PDF de la documentation
- [ ] Templates de notes

### Moyen terme
- [ ] Collaboration temps réel (WebSockets)
- [ ] Historique des modifications
- [ ] Commentaires sur les notes
- [ ] Liens entre notes

### Long terme
- [ ] IA pour génération automatique de notes
- [ ] Import depuis README.md
- [ ] Versioning des workflows
- [ ] Analytics d'utilisation

## Ressources

### Fichiers créés
- `hooks/use-sticky-notes.ts` - Hook personnalisé
- `components/workflows/sticky-note-dialog.tsx` - Dialog création/édition
- `components/workflows/sticky-note.tsx` - Composant note
- `components/workflows/sticky-note-board.tsx` - Board principal
- `components/workflows/workflow-card.tsx` - Carte workflow
- `app/app/workflows/page.tsx` - Liste workflows
- `app/app/workflows/[workflowId]/page.tsx` - Détail workflow
- `app/app/workflows/[workflowId]/workflow-documentation-view.tsx` - Vue principale

### API créées
- `app/api/workflows/route.ts`
- `app/api/workflows/[workflowId]/route.ts`
- `app/api/workflows/[workflowId]/sticky-notes/route.ts`
- `app/api/workflows/[workflowId]/sticky-notes/[noteId]/route.ts`

### Documentation
- `workflows/WORKFLOW-DOCUMENTATION-FEATURE.md` - Documentation principale
- `workflows/INTEGRATION-COMPLETE.md` - Ce document
- `workflows/schema-workflow-documentation.sql` - Schéma SQL

## Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs de l'API et de la console
3. Tester les endpoints API directement
4. Vérifier les permissions RLS dans Supabase

---

**Version** : 1.0
**Date** : 2025-01-14
**Status** : ✅ Production Ready
**Testé avec** : Next.js 16, React 19, TypeScript, Supabase
