# Database Schema

## Overview

Aurentia uses **PostgreSQL** (via Supabase) with a **multi-tenant architecture** where all data is scoped to organizations via `organization_id` foreign keys. The schema supports complete ESN management including users, projects, tasks, consultants, time tracking, analytics, and real-time collaboration.

## Schema Diagram

```
┌──────────────────┐
│  organizations   │
│  (Multi-Tenant)  │
└─────────┬────────┘
          │
          ├─────────────────────────────────────────────┐
          │                                             │
    ┌─────┴──────────┐                         ┌───────┴────────┐
    │   profiles     │◄────────────────────────┤ user_organiz.  │
    │   (Users)      │                         │ (Membership)   │
    └────────────────┘                         └────────────────┘
          │
          ├──► consultant_details
          ├──► profile_competences
          └──► activity_logs
          │
    ┌─────┴──────────┐
    │    client      │
    └────────┬───────┘
          │
    ┌─────┴──────────┐
    │    projet      │
    │   (Projects)   │
    └────────┬───────┘
          │
          ├──► tache (Tasks)
          ├──► milestones
          │    ├──► milestone_tasks
          │    ├──► milestone_assignments
          │    └──► milestone_dependencies
          ├──► affectation (Assignments)
          ├──► budget_projet
          ├──► facture (Invoices)
          ├──► score_sante_projet (Health Scores)
          ├──► prediction_risque (Risk Predictions)
          ├──► detection_derive (Drift Detection)
          ├──► recommandation_action
          ├──► incident
          ├──► livrable (Deliverables)
          ├──► temps_passe (Time Tracking)
          └──► project_channels
               └──► channel_messages

Messaging System:
├──► organization_channels
│    └──► channel_messages
├──► direct_messages
├──► group_chats
│    ├──► group_chat_members
│    └──► channel_messages (via channel_id)
└──► message_reactions

Notifications & Activity:
├──► notifications
└──► activity_logs
```

## Core Tables

### organizations

Represents tenant organizations in the multi-tenant architecture.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Organization name |
| slug | text | No | - | Unique URL-safe identifier (3-50 chars, lowercase, numbers, hyphens) |
| description | text | Yes | - | Organization description |
| logo_url | text | Yes | - | Organization logo URL |
| website | text | Yes | - | Organization website |
| image | text | Yes | - | Organization image/banner |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `slug`

**Business Rules:**
- Slug must match pattern: `^[a-z0-9-]+$`
- Slug length: 3-50 characters
- Slug is auto-generated from name if not provided

---

### profiles

User profiles linked to Supabase Auth users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | Primary key (matches auth.users.id) |
| email | text | No | - | User email (unique) |
| nom | text | No | - | Last name |
| prenom | text | No | - | First name |
| role | user_role enum | No | 'CONSULTANT' | Default user role (OWNER, ADMIN, MANAGER, CONSULTANT, CLIENT) |
| avatar_url | text | Yes | - | Profile picture URL |
| phone | text | Yes | - | Phone number |
| status | user_status enum | Yes | 'offline' | User online status (online, offline, away) |
| last_seen | timestamptz | Yes | now() | Last activity timestamp |
| organization_id | uuid | Yes | - | Primary organization (FK to organizations) |
| manager_id | uuid | Yes | - | User's manager (FK to profiles) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `organization_id`
- INDEX on `manager_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)`
- `manager_id` → `profiles(id)`

**Enums:**
- `user_role`: OWNER, ADMIN, MANAGER, CONSULTANT, CLIENT
- `user_status`: online, offline, away

---

### user_organizations

Junction table for many-to-many relationship between users and organizations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | User ID (FK to auth.users) |
| organization_id | uuid | No | - | Organization ID (FK to organizations) |
| role | text | No | 'MEMBER' | Role within organization (ADMIN, MANAGER, CONSULTANT, MEMBER) |
| joined_at | timestamptz | Yes | now() | When user joined organization |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- COMPOSITE INDEX on `(user_id, organization_id)` for fast lookups
- INDEX on `organization_id`

**Foreign Keys:**
- `user_id` → `auth.users(id)`
- `organization_id` → `organizations(id)`

**Note:** This table's `role` takes precedence over `profiles.role` for organization-specific permissions.

---

## Project Management Tables

### projet (Projects)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| client_id | uuid | No | - | Client (FK to client) |
| chef_projet_id | uuid | Yes | - | Project manager (FK to profiles) |
| nom | text | No | - | Project name (unique per organization) |
| description | text | Yes | - | Project description |
| date_debut | date | No | - | Start date |
| date_fin_prevue | date | Yes | - | Expected end date |
| statut | text | No | 'ACTIF' | Project status (ACTIF, TERMINE, SUSPENDU) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `(nom, organization_id)` (project names unique per org)
- INDEX on `organization_id`
- INDEX on `client_id`
- INDEX on `chef_projet_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `client_id` → `client(id)`
- `chef_projet_id` → `profiles(id)`

---

### tache (Tasks)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK to projet) |
| livrable_id | uuid | Yes | - | Deliverable (FK to livrable) |
| profile_responsable_id | uuid | Yes | - | Assignee (FK to profiles) |
| nom | text | No | - | Task name |
| description | text | Yes | - | Task description |
| charge_estimee_jh | numeric | Yes | - | Estimated effort (person-days) |
| date_fin_cible | date | Yes | - | Target completion date |
| statut | statut_tache enum | No | 'TODO' | Status (TODO, IN_PROGRESS, IN_REVIEW, DONE) |
| priority | text | Yes | 'medium' | Priority (low, medium, high, urgent) |
| position | integer | Yes | 0 | Position in Kanban column |
| color | text | Yes | - | Task color (hex code) |
| tags | text[] | Yes | [] | Task tags/labels |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `projet_id`
- INDEX on `profile_responsable_id`
- COMPOSITE INDEX on `(projet_id, statut)` for Kanban queries

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)`
- `livrable_id` → `livrable(id)`
- `profile_responsable_id` → `profiles(id)`

**Enums:**
- `statut_tache`: TODO, IN_PROGRESS, IN_REVIEW, DONE

**Constraints:**
- `priority` must be one of: low, medium, high, urgent

---

### milestones

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | uuid_generate_v4() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | Yes | - | Project (FK to projet, nullable for organization-level milestones) |
| name | varchar | No | - | Milestone name |
| description | text | Yes | - | Milestone description |
| start_date | date | No | - | Start date |
| due_date | date | No | - | Due date |
| status | varchar | No | 'not_started' | Status (not_started, in_progress, completed, on_hold) |
| priority | varchar | Yes | 'medium' | Priority level (low, medium, high, critical) |
| color | varchar | Yes | - | Milestone color (hex code) |
| progress_mode | varchar | Yes | 'auto' | Progress calculation mode (auto, manual) |
| progress_percentage | integer | Yes | 0 | Progress percentage (0-100) |
| created_by | uuid | Yes | - | Creator (FK to profiles) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `projet_id`
- INDEX on `created_by`

**Foreign Keys:**
- `organization_id` → `organizations(id)`
- `projet_id` → `projet(id)`
- `created_by` → `profiles(id)`

**Constraints:**
- `progress_percentage` must be between 0 and 100

---

### milestone_tasks

Junction table linking milestones to tasks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | uuid_generate_v4() | Primary key |
| milestone_id | uuid | No | - | Milestone (FK) |
| tache_id | uuid | No | - | Task (FK) |
| weight | integer | Yes | 1 | Task weight for progress calculation |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `milestone_id`
- INDEX on `tache_id`

**Foreign Keys:**
- `milestone_id` → `milestones(id)` ON DELETE CASCADE
- `tache_id` → `tache(id)` ON DELETE CASCADE

---

## Consultant Management Tables

### consultant_details

Extended information for consultants.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| profile_id | uuid | No | - | User profile (FK to profiles, unique) |
| date_embauche | date | No | - | Hire date |
| taux_journalier_cout | numeric | No | - | Daily cost rate (for company) |
| taux_journalier_vente | numeric | Yes | - | Daily billing rate (to client) |
| statut | text | Yes | 'AVAILABLE' | Consultant status (AVAILABLE, ON_MISSION, ON_LEAVE) |
| job_title | text | Yes | - | Job title/role |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `profile_id`
- INDEX on `organization_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `profile_id` → `profiles(id)`

---

### competence (Skills)

Master list of skills/competencies.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| nom | text | No | - | Skill name (unique per organization) |
| description | text | Yes | - | Skill description |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `(nom, organization_id)`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE

---

### profile_competences

Junction table for user skills with proficiency levels.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| profile_id | uuid | No | - | User (FK to profiles) |
| competence_id | uuid | No | - | Skill (FK to competence) |
| organization_id | uuid | No | - | Organization (FK) |
| niveau | integer | Yes | - | Proficiency level (1-5) |
| date_evaluation | date | Yes | - | Last evaluation date |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `(profile_id, competence_id, organization_id)`
- INDEX on `organization_id`

**Foreign Keys:**
- `profile_id` → `profiles(id)` ON DELETE CASCADE
- `competence_id` → `competence(id)` ON DELETE CASCADE
- `organization_id` → `organizations(id)` ON DELETE CASCADE

**Constraints:**
- `niveau` must be between 1 and 5

---

## Financial Tables

### budget_projet

Project budgets and margin targets.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK, unique) |
| montant_total_vente | numeric | No | - | Total sales amount |
| cout_estime_total | numeric | No | - | Estimated total cost |
| marge_cible_pct | numeric | No | - | Target profit margin (%) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `projet_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)` ON DELETE CASCADE

**Constraints:**
- `marge_cible_pct` must be between 0 and 100

---

### facture (Invoices)

Client invoicing for projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK) |
| montant | numeric | No | - | Invoice amount |
| date_facturation | date | No | - | Invoice date |
| statut_paiement | text | Yes | - | Payment status (EN_ATTENTE, PAYE, RETARD) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `projet_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)` ON DELETE CASCADE

---

### temps_passe (Time Tracking)

Time entries for consultants on projects/tasks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK) |
| profile_id | uuid | No | - | Consultant (FK to profiles) |
| tache_id | uuid | Yes | - | Task (FK to tache, optional) |
| date | date | No | - | Date of work |
| heures_travaillees | numeric | No | - | Hours worked (must be >= 0) |
| source_outil | text | Yes | - | Source tool/system |
| validation_statut | text | Yes | 'EN_ATTENTE' | Validation status (EN_ATTENTE, VALIDE, REJETE) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `projet_id`
- INDEX on `profile_id`
- COMPOSITE INDEX on `(projet_id, date)` for reporting

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)` ON DELETE CASCADE
- `profile_id` → `profiles(id)` ON DELETE CASCADE
- `tache_id` → `tache(id)` ON DELETE SET NULL

**Constraints:**
- `heures_travaillees` must be >= 0

---

## Analytics & AI Tables

### score_sante_projet (Project Health Scores)

AI-generated project health assessments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK) |
| date_analyse | date | No | - | Analysis date |
| score_global | numeric | Yes | - | Overall health score (0-100) |
| couleur_risque | text | No | - | Risk color (VERT, ORANGE, ROUGE) |
| raisonnement_ia | text | Yes | - | AI reasoning/explanation |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `projet_id`
- INDEX on `date_analyse`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)` ON DELETE CASCADE

**Constraints:**
- `score_global` must be between 0 and 100

---

### prediction_risque (Risk Predictions)

AI-generated risk predictions for projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK) |
| profile_id | uuid | Yes | - | Consultant (FK, if consultant-specific) |
| date_prediction | timestamptz | Yes | now() | Prediction timestamp |
| horizon_jours | integer | No | - | Prediction horizon (days) |
| type_risque | text | No | - | Risk type (BUDGET, DELAI, QUALITE, RESSOURCES) |
| probabilite_pct | numeric | Yes | - | Probability percentage (0-100) |
| confidence | numeric | Yes | - | Model confidence (0.0-1.0) |
| justification | text | Yes | 'Prédiction générée automatiquement' | Explanation |
| metriques_source | jsonb | Yes | - | Source metrics (JSON) |
| workflow_execution_id | varchar | Yes | - | n8n workflow execution ID |
| modele_ia_utilise | varchar | Yes | - | AI model used |
| realise | boolean | Yes | - | Whether prediction came true |
| date_evaluation | timestamptz | Yes | - | Evaluation date |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `projet_id`
- INDEX on `date_prediction`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)` ON DELETE CASCADE
- `profile_id` → `profiles(id)` ON DELETE SET NULL

**Constraints:**
- `probabilite_pct` must be between 0 and 100
- `confidence` must be between 0.0 and 1.0

---

## Messaging System Tables

### organization_channels

Organization-wide chat channels.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| name | text | No | - | Channel name (e.g., "general", "announcements") |
| description | text | Yes | - | Channel description |
| created_by | uuid | No | - | Creator (FK to profiles) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `created_by` → `profiles(id)`

---

### project_channels

Project-specific chat channels (automatically created with projects).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| projet_id | uuid | No | - | Project (FK, unique) |
| name | text | Yes | - | Channel name (defaults to project name) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `projet_id`
- INDEX on `organization_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `projet_id` → `projet(id)` ON DELETE CASCADE

---

### channel_messages

Messages in all channel types (organization, project, group).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| channel_id | uuid | No | - | Channel ID (polymorphic) |
| channel_type | text | No | - | Channel type (organization, project, direct, group) |
| sender_id | uuid | No | - | Message sender (FK to profiles) |
| content | text | No | - | Message content |
| edited_at | timestamptz | Yes | - | Edit timestamp |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- COMPOSITE INDEX on `(channel_id, channel_type)` for channel queries
- INDEX on `sender_id`
- INDEX on `created_at` for time-based queries

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `sender_id` → `profiles(id)`

**Constraints:**
- `channel_type` must be one of: organization, project, direct, group

---

### direct_messages

Direct 1-on-1 messages between users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| sender_id | uuid | No | - | Message sender (FK to profiles) |
| recipient_id | uuid | No | - | Message recipient (FK to profiles) |
| content | text | No | - | Message content |
| read_at | timestamptz | Yes | - | Read timestamp |
| edited_at | timestamptz | Yes | - | Edit timestamp |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- COMPOSITE INDEX on `(sender_id, recipient_id)` for conversation queries
- INDEX on `recipient_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `sender_id` → `profiles(id)` ON DELETE CASCADE
- `recipient_id` → `profiles(id)` ON DELETE CASCADE

---

### group_chats

Group chat metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| name | varchar | No | - | Group name |
| description | text | Yes | - | Group description |
| created_by | uuid | No | - | Creator (FK to auth.users) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `created_by` → `auth.users(id)`

---

### group_chat_members

Group chat membership.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| group_chat_id | uuid | No | - | Group chat (FK) |
| user_id | uuid | No | - | Member (FK to auth.users) |
| joined_at | timestamptz | Yes | now() | Join timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `group_chat_id`
- INDEX on `user_id`

**Foreign Keys:**
- `group_chat_id` → `group_chats(id)` ON DELETE CASCADE
- `user_id` → `auth.users(id)` ON DELETE CASCADE

---

## Notification & Activity Tables

### notifications

User notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| user_id | uuid | No | - | Recipient (FK to profiles) |
| type | text | No | - | Notification type (INFO, SUCCESS, WARNING, ERROR, TASK_ASSIGNED, etc.) |
| title | text | No | - | Notification title |
| message | text | Yes | - | Notification message |
| link | text | Yes | - | Action link URL |
| metadata | jsonb | Yes | {} | Additional metadata (JSON) |
| read_at | timestamptz | Yes | - | Read timestamp |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `user_id`
- INDEX on `read_at` for unread queries

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `user_id` → `profiles(id)` ON DELETE CASCADE

**Notification Types:**
- INFO, SUCCESS, WARNING, ERROR
- TASK_ASSIGNED, TASK_COMPLETED
- PROJECT_UPDATE, MILESTONE_REACHED
- SYSTEM

---

### activity_logs

Comprehensive audit trail for all user actions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| user_id | uuid | No | - | User who performed action (FK to profiles) |
| action | text | No | - | Action type (CREATED, UPDATED, DELETED, etc.) |
| description | text | Yes | - | Human-readable description |
| resource_type | text | Yes | - | Resource type (project, task, user, etc.) |
| resource_id | uuid | Yes | - | Resource ID |
| metadata | jsonb | Yes | {} | Additional context (JSON) |
| created_at | timestamptz | Yes | now() | Action timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `user_id`
- INDEX on `resource_type`
- INDEX on `created_at` for time-based queries

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `user_id` → `profiles(id)` ON DELETE CASCADE

**Common Actions:**
- CREATED, UPDATED, DELETED
- MEMBER_ADDED, MEMBER_REMOVED
- PROJECT_CREATED, PROJECT_UPDATED
- TASK_ASSIGNED, TASK_COMPLETED

---

## Supporting Tables

### client

Client companies for projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| nom | text | No | - | Client company name |
| contact_principal | text | Yes | - | Main contact name |
| contact_user_id | uuid | Yes | - | Contact user (FK to profiles, if user) |
| secteur | text | Yes | - | Industry/sector |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `contact_user_id` → `profiles(id)` ON DELETE SET NULL

---

### join_codes

Invitation codes for joining organizations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| code | text | No | - | Unique join code |
| role | text | No | - | Role to assign (MEMBER, MANAGER) |
| created_by | uuid | No | - | Creator (FK to profiles) |
| expires_at | timestamptz | Yes | - | Expiration date |
| max_uses | integer | Yes | - | Maximum number of uses |
| uses | integer | Yes | 0 | Current number of uses |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `code`
- INDEX on `organization_id`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `created_by` → `profiles(id)`

**Constraints:**
- `role` must be one of: MEMBER, MANAGER

---

### organization_invitations

Email invitations to join organizations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| organization_id | uuid | No | - | Organization (FK) |
| email | text | No | - | Invitee email |
| role | text | No | - | Role to assign (OWNER, ADMIN, MANAGER, MEMBER) |
| invited_by | uuid | No | - | Inviter (FK to profiles) |
| accepted_at | timestamptz | Yes | - | Acceptance timestamp |
| expires_at | timestamptz | No | - | Expiration timestamp |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organization_id`
- INDEX on `email`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `invited_by` → `profiles(id)`

**Constraints:**
- `role` must be one of: OWNER, ADMIN, MANAGER, MEMBER

---

## Database Patterns & Best Practices

### Multi-Tenancy Pattern

**All organization-scoped tables:**
```sql
-- Always include organization_id
CREATE TABLE example (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- ... other fields
);

-- Always filter by organization_id
SELECT * FROM example WHERE organization_id = ?;

-- Composite indexes for performance
CREATE INDEX idx_example_org_status ON example(organization_id, status);
```

### Timestamps Pattern

**All tables have:**
```sql
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now()
```

**Triggers automatically update `updated_at`:**
```sql
CREATE TRIGGER update_example_updated_at
  BEFORE UPDATE ON example
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Soft Deletes (Not Implemented)

Currently using **hard deletes** with `ON DELETE CASCADE`. Soft deletes can be implemented by:
```sql
ALTER TABLE example ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_example_deleted ON example(deleted_at) WHERE deleted_at IS NULL;
```

### UUID Primary Keys

**All tables use UUIDs:**
- Globally unique
- No sequential enumeration risk
- Easier for distributed systems
- Generated via `gen_random_uuid()` or `uuid_generate_v4()`

### JSONB for Flexible Data

**Used for:**
- `metadata` fields (notifications, activity_logs)
- `metriques_source` (prediction_risque)
- `recommandations` (recommandation_action)

**Benefits:**
- Flexible schema
- Queryable with GIN indexes
- No schema migrations for metadata changes

**Drawbacks:**
- No type safety
- Harder to query complex structures

### Foreign Key Cascades

**Common patterns:**
```sql
-- Cascade deletes (organization deleted → all data deleted)
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE

-- Set null (user deleted → profile_id becomes null)
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL

-- Restrict (prevent deletion if referenced)
FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE RESTRICT
```

## Row Level Security (RLS)

### Current Status

**RLS is DISABLED** for all tables for development. Authorization is enforced at the application layer.

### Planned RLS Policies

**When enabled, RLS policies will enforce:**

```sql
-- Users can only see organizations they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Users can only see data from their organizations
CREATE POLICY "Users can view org data" ON projet
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Only ADMIN/OWNER can create/update/delete
CREATE POLICY "Admin can manage data" ON projet
  FOR ALL USING (
    organization_id IN (
      SELECT uo.organization_id
      FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.role IN ('ADMIN', 'OWNER')
    )
  );
```

### Enabling RLS (Production)

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Apply policies
-- (see RLS policy SQL files in supabase/policies/)
```

---

## Database Migrations

### Migration Strategy

**Current:** Manual migrations via Supabase dashboard + SQL scripts

**Planned:** Formal migration system using Supabase CLI

```bash
# Create migration
supabase migration new add_new_feature

# Apply migrations
supabase db push

# Reset database (dev only)
supabase db reset
```

### Migration Best Practices

1. **Always add organization_id** to new tables
2. **Include indexes** for foreign keys and common queries
3. **Use transactions** for multi-step migrations
4. **Test on staging first**
5. **Include rollback script**
6. **Update TypeScript types** after migration

---

## Performance Considerations

### Query Optimization

**Indexes on:**
- All foreign keys
- Frequently filtered columns (status, type, date)
- Composite indexes for common filter combinations

**Query patterns:**
```sql
-- Good: Uses index
SELECT * FROM tache
WHERE organization_id = ? AND statut = 'TODO';

-- Bad: Full table scan
SELECT * FROM tache WHERE nom LIKE '%test%';

-- Better: Use full-text search
SELECT * FROM tache
WHERE to_tsvector('french', nom || ' ' || description) @@ to_tsquery('test');
```

### Connection Pooling

**Supabase uses PgBouncer:**
- Max connections: Based on plan
- Pool mode: Transaction pooling
- Timeout: 60 seconds

### Query Monitoring

**Use Supabase Dashboard:**
- Query performance
- Slow query log
- Connection pool usage
- Database size trends

---

## Backup & Recovery

### Automatic Backups

**Supabase Free:**
- Daily backups
- 7-day retention

**Supabase Pro:**
- Daily backups
- 14-day retention
- Point-in-time recovery (7 days)

### Manual Backups

```bash
# Export schema
pg_dump -h db.xxx.supabase.co -U postgres -s -d postgres > schema.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres -a -d postgres > data.sql

# Full backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > full_backup.sql
```

### Disaster Recovery

1. **Regular backups**: Automated daily
2. **Point-in-time recovery**: Available on Pro plan
3. **Geo-redundancy**: Supabase handles replication
4. **Application-level exports**: CSV exports for critical data

---

**See Also:**
- [Architecture Overview](../architecture/01-overview.md)
- [Multi-Tenancy](./02-multi-tenancy.md)
- [API Conventions](./04-api-conventions.md)
