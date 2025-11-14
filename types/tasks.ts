/**
 * Task Types - Matches 'tache' table schema
 *
 * Your database uses French table names (tache, projet, consultant)
 * These types match your exact schema with proper TypeScript typing
 */

// Task status enum (matches statut_tache in database)
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

// Task priority
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// Base task interface (camelCase for TypeScript/API)
export interface TaskCard {
  id: string;
  projetId: string;
  livrableId?: string | null;
  consultantResponsableId?: string | null;
  nom: string;
  description?: string | null;
  chargeEstimeeJh?: number | null; // charge_estimee_jh in DB
  dateFinCible?: string | null; // date_fin_cible in DB (ISO date string)
  statut: TaskStatus;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  position: number;
  color?: string | null;
  tags: string[];

  // Computed/joined fields (not in DB, added by queries)
  consultant?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
}

// Database version (snake_case)
// IMPORTANT: The actual DB column is profile_responsable_id, not consultant_responsable_id
export interface TaskCardDb {
  id: string;
  projet_id: string;
  livrable_id?: string | null;
  profile_responsable_id?: string | null; // FIXED: Actual column name in database
  consultant_responsable_id?: string | null; // Legacy - kept for backwards compatibility
  nom: string;
  description?: string | null;
  charge_estimee_jh?: number | null;
  date_fin_cible?: string | null;
  statut: TaskStatus;
  created_at: string;
  updated_at: string;
  organization_id: string;
  position: number;
  color?: string | null;
  tags: string[];
}

// Column definition for Kanban board
export interface TaskColumn {
  id: string;
  name: string;
  statut: TaskStatus; // FIXED: was 'status', now matches DB schema
  color: string;
  order: number;
}

// Default columns for Kanban
export const DEFAULT_COLUMNS: TaskColumn[] = [
  {
    id: "todo",
    name: "À faire",
    statut: TaskStatus.TODO,
    color: "#94a3b8",
    order: 0,
  },
  {
    id: "in-progress",
    name: "En cours",
    statut: TaskStatus.IN_PROGRESS,
    color: "#3b82f6",
    order: 1,
  },
  {
    id: "review",
    name: "En revue",
    statut: TaskStatus.REVIEW,
    color: "#f59e0b",
    order: 2,
  },
  {
    id: "done",
    name: "Terminé",
    statut: TaskStatus.DONE,
    color: "#10b981",
    order: 3,
  },
  {
    id: "blocked",
    name: "Bloqué",
    statut: TaskStatus.BLOCKED,
    color: "#ef4444",
    order: 4,
  },
];

// API Request/Response types

export interface CreateTaskRequest {
  projetId: string;
  nom: string;
  description?: string;
  statut?: TaskStatus;
  consultantResponsableId?: string | null;
  livrableId?: string | null;
  chargeEstimeeJh?: number | null;
  dateFinCible?: string | null;
  color?: string;
  tags?: string[];
  position?: number;
}

export interface UpdateTaskRequest {
  nom?: string;
  description?: string;
  statut?: TaskStatus;
  consultantResponsableId?: string;
  livrableId?: string;
  chargeEstimeeJh?: number;
  dateFinCible?: string;
  color?: string;
  tags?: string[];
  position?: number;
}

export interface MoveTaskRequest {
  statut: TaskStatus;
  position: number;
}

export interface TaskListQuery {
  projetId?: string;
  statut?: TaskStatus | TaskStatus[];
  consultantResponsableId?: string;
  livrableId?: string;
  tags?: string[];
  search?: string;
}

export interface TaskListResponse {
  data: TaskCard[];
  total: number;
}

export interface TaskResponse {
  data: TaskCard;
}

// Task statistics
export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  blocked: number;
  byConsultant: Record<string, number>;
  overdue: number;
}

// Task activity log entry
export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    nom: string;
    prenom: string;
    email: string;
    avatarUrl?: string;
  };
}
