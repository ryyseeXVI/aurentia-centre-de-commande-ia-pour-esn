/**
 * Task Transformers - snake_case ↔ camelCase
 *
 * CRITICAL: Your database uses snake_case (tache table)
 * All API responses must be camelCase
 * These functions handle the transformation
 */

import type {
  CreateTaskRequest,
  TaskCard,
  TaskCardDb,
  UpdateTaskRequest,
} from "@/types/tasks";
import { TaskStatus } from "@/types/tasks";

/**
 * Transform task from database (snake_case) to API (camelCase)
 */
export function taskFromDb(task: TaskCardDb): TaskCard {
  return {
    id: task.id,
    projetId: task.projet_id,
    livrableId: task.livrable_id,
    consultantResponsableId: task.consultant_responsable_id,
    nom: task.nom,
    description: task.description,
    chargeEstimeeJh: task.charge_estimee_jh,
    dateFinCible: task.date_fin_cible,
    statut: task.statut,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    organizationId: task.organization_id,
    position: task.position,
    color: task.color,
    tags: task.tags || [],
  };
}

/**
 * Transform task for database insert (camelCase to snake_case)
 */
export function taskForInsert(
  data: CreateTaskRequest,
  organizationId: string,
): any {
  return {
    projet_id: data.projetId,
    livrable_id: data.livrableId || null,
    consultant_responsable_id: data.consultantResponsableId || null,
    nom: data.nom,
    description: data.description || null,
    charge_estimee_jh: data.chargeEstimeeJh || null,
    date_fin_cible: data.dateFinCible || null,
    statut: data.statut || "TODO",
    organization_id: organizationId,
    position: data.position || 0,
    color: data.color || null,
    tags: data.tags || [],
  };
}

/**
 * Transform task for database update (camelCase to snake_case)
 */
export function taskForUpdate(data: UpdateTaskRequest): any {
  const update: any = {};

  if (data.nom !== undefined) update.nom = data.nom;
  if (data.description !== undefined) update.description = data.description;
  if (data.statut !== undefined) update.statut = data.statut;
  if (data.consultantResponsableId !== undefined)
    update.consultant_responsable_id = data.consultantResponsableId;
  if (data.livrableId !== undefined) update.livrable_id = data.livrableId;
  if (data.chargeEstimeeJh !== undefined)
    update.charge_estimee_jh = data.chargeEstimeeJh;
  if (data.dateFinCible !== undefined)
    update.date_fin_cible = data.dateFinCible;
  if (data.color !== undefined) update.color = data.color;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.position !== undefined) update.position = data.position;

  return update;
}

/**
 * Group tasks by column (for Kanban board)
 */
export function groupTasksByColumn(
  tasks: TaskCard[],
): Record<string, TaskCard[]> {
  const grouped: Record<string, TaskCard[]> = {
    todo: [],
    "in-progress": [],
    done: [],
    blocked: [],
  };

  tasks.forEach((task) => {
    const columnId = statusToColumnId(task.statut);
    if (grouped[columnId]) {
      grouped[columnId].push(task);
    }
  });

  // Sort by position within each column
  Object.keys(grouped).forEach((columnId) => {
    grouped[columnId].sort((a, b) => a.position - b.position);
  });

  return grouped;
}

/**
 * Convert TaskStatus to column ID
 */
export function statusToColumnId(status: TaskStatus): string {
  const mapping: Record<TaskStatus, string> = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    DONE: "done",
    BLOCKED: "blocked",
  };
  return mapping[status] || "todo";
}

/**
 * Convert column ID to TaskStatus
 */
export function columnIdToStatus(columnId: string): TaskStatus {
  const mapping: Record<string, TaskStatus> = {
    todo: TaskStatus.TODO,
    "in-progress": TaskStatus.IN_PROGRESS,
    done: TaskStatus.DONE,
    blocked: TaskStatus.BLOCKED,
  };
  return mapping[columnId] || TaskStatus.TODO;
}

/**
 * Calculate new position when moving task
 */
export function calculateNewPosition(
  tasks: TaskCard[],
  overTaskId: string | null,
): number {
  if (!overTaskId || tasks.length === 0) {
    // Place at end
    const maxPosition = Math.max(...tasks.map((t) => t.position), -1);
    return maxPosition + 1;
  }

  const overTask = tasks.find((t) => t.id === overTaskId);
  if (!overTask) {
    const maxPosition = Math.max(...tasks.map((t) => t.position), -1);
    return maxPosition + 1;
  }

  const overIndex = tasks.indexOf(overTask);

  if (overIndex === 0) {
    // Place before first task
    return Math.max(0, overTask.position - 1);
  }

  // Place between tasks
  const prevTask = tasks[overIndex - 1];
  return (prevTask.position + overTask.position) / 2;
}

/**
 * Reorder tasks after a move operation
 * Returns updated positions for all affected tasks
 */
export function reorderTasks(
  tasks: TaskCard[],
  movedTaskId: string,
  newColumnId: string,
  newPosition: number,
): Array<{ id: string; position: number; statut: TaskStatus }> {
  const updates: Array<{ id: string; position: number; statut: TaskStatus }> =
    [];
  const newStatus = columnIdToStatus(newColumnId);

  // Get tasks in the target column (excluding the moved task)
  const targetColumnTasks = tasks.filter(
    (t) => statusToColumnId(t.statut) === newColumnId && t.id !== movedTaskId,
  );

  // Add the moved task at its new position
  const movedTask = tasks.find((t) => t.id === movedTaskId);
  if (!movedTask) return updates;

  targetColumnTasks.splice(newPosition, 0, {
    ...movedTask,
    statut: newStatus,
    position: newPosition,
  });

  // Renumber all tasks in the column
  targetColumnTasks.forEach((task, index) => {
    updates.push({
      id: task.id,
      position: index,
      statut: newStatus,
    });
  });

  return updates;
}

/**
 * Get task statistics from list of tasks
 */
export function getTaskStats(tasks: TaskCard[]): {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  blocked: number;
  completionRate: number;
} {
  const stats = {
    total: tasks.length,
    todo: 0,
    inProgress: 0,
    done: 0,
    blocked: 0,
    completionRate: 0,
  };

  tasks.forEach((task) => {
    switch (task.statut) {
      case "TODO":
        stats.todo++;
        break;
      case "IN_PROGRESS":
        stats.inProgress++;
        break;
      case "DONE":
        stats.done++;
        break;
      case "BLOCKED":
        stats.blocked++;
        break;
    }
  });

  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.done / stats.total) * 100);
  }

  return stats;
}

/**
 * Filter tasks by search query
 */
export function filterTasks(tasks: TaskCard[], query: string): TaskCard[] {
  if (!query || query.trim().length === 0) return tasks;

  const lowerQuery = query.toLowerCase();

  return tasks.filter(
    (task) =>
      task.nom.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery) ||
      task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}

/**
 * Sort tasks by various criteria
 */
export function sortTasks(
  tasks: TaskCard[],
  sortBy: "position" | "dateFinCible" | "nom" | "createdAt",
  order: "asc" | "desc" = "asc",
): TaskCard[] {
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "position":
        comparison = a.position - b.position;
        break;
      case "dateFinCible": {
        const dateA = a.dateFinCible ? new Date(a.dateFinCible).getTime() : 0;
        const dateB = b.dateFinCible ? new Date(b.dateFinCible).getTime() : 0;
        comparison = dateA - dateB;
        break;
      }
      case "nom":
        comparison = a.nom.localeCompare(b.nom);
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(task: TaskCard): boolean {
  if (!task.dateFinCible) return false;
  if (task.statut === "DONE") return false;

  const dueDate = new Date(task.dateFinCible);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

/**
 * Get tasks that are overdue
 */
export function getOverdueTasks(tasks: TaskCard[]): TaskCard[] {
  return tasks.filter(isTaskOverdue);
}

/**
 * Get tasks assigned to a specific consultant
 */
export function getTasksByConsultant(
  tasks: TaskCard[],
  consultantId: string,
): TaskCard[] {
  return tasks.filter((t) => t.consultantResponsableId === consultantId);
}

/**
 * Get tasks by tags
 */
export function getTasksByTags(tasks: TaskCard[], tags: string[]): TaskCard[] {
  if (tags.length === 0) return tasks;

  return tasks.filter((task) => tags.some((tag) => task.tags.includes(tag)));
}
