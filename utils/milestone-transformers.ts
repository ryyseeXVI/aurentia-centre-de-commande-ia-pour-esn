/**
 * Data Transformers for Project Roadmap System
 * Converts between snake_case (database) and camelCase (API/frontend)
 */

import type {
  DependencyType,
  Milestone,
  MilestoneAssignment,
  MilestoneDependency,
  MilestonePriority,
  MilestoneStatus,
  MilestoneTask,
  MilestoneUser,
} from "@/types/milestones";
import type { TaskCard } from "@/types/tasks";

// =====================================================
// Database Row Types (snake_case)
// =====================================================

interface MilestoneRow {
  id: string;
  organization_id: string;
  projet_id: string; // French: projet_id not project_id
  name: string;
  description?: string | null;
  start_date: string;
  due_date: string;
  status: string;
  priority: string;
  color?: string | null;
  progress_mode: string;
  progress_percentage: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MilestoneProgressRow {
  milestone_id: string;
  organization_id: string;
  progress_mode: string;
  manual_progress: number;
  calculated_progress: number;
  total_tasks: number;
  completed_tasks: number;
}

interface MilestoneDependencyRow {
  id: string;
  milestone_id: string;
  depends_on_milestone_id: string;
  dependency_type: string;
  lag_days: number;
  created_at: string;
}

interface MilestoneAssignmentRow {
  id: string;
  milestone_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface MilestoneTaskRow {
  id: string;
  milestone_id: string;
  tache_id: string;
  weight: number;
  created_at: string;
}

interface MilestoneUserRow {
  id: string;
  email: string;
  prenom?: string; // French: first name
  nom?: string; // French: last name
  avatar_url?: string | null;
}

// =====================================================
// Transformer Functions
// =====================================================

/**
 * Transform database milestone row to Milestone
 */
export function transformMilestone(
  row: MilestoneRow,
  progressRow?: MilestoneProgressRow,
): Milestone {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.projet_id, // Database uses French: projet_id
    name: row.name,
    description: row.description ?? null,
    startDate: row.start_date,
    dueDate: row.due_date,
    status: row.status as MilestoneStatus,
    priority: row.priority as MilestonePriority,
    color: row.color ?? null,
    progressMode: row.progress_mode as "auto" | "manual",
    progressPercentage: row.progress_percentage,
    calculatedProgress: progressRow?.calculated_progress ?? 0,
    totalTasks: progressRow?.total_tasks ?? 0,
    completedTasks: progressRow?.completed_tasks ?? 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform database milestone dependency row to MilestoneDependency
 */
export function transformMilestoneDependency(
  row: MilestoneDependencyRow,
): MilestoneDependency {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    dependsOnMilestoneId: row.depends_on_milestone_id,
    dependencyType: row.dependency_type as DependencyType,
    lagDays: row.lag_days,
    createdAt: row.created_at,
  };
}

/**
 * Transform database milestone assignment row to MilestoneAssignment
 */
export function transformMilestoneAssignment(
  row: MilestoneAssignmentRow,
): MilestoneAssignment {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    userId: row.user_id,
    role: row.role as "owner" | "contributor" | "reviewer",
    createdAt: row.created_at,
  };
}

/**
 * Transform database milestone task row to MilestoneTask
 */
export function transformMilestoneTask(row: MilestoneTaskRow): MilestoneTask {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    tacheId: row.tache_id,
    weight: row.weight,
    createdAt: row.created_at,
  };
}

/**
 * Transform database user row to MilestoneUser
 */
export function transformMilestoneUser(row: MilestoneUserRow): MilestoneUser {
  const fullName =
    row.prenom && row.nom
      ? `${row.prenom} ${row.nom}`
      : row.prenom || row.nom || undefined;

  return {
    id: row.id,
    email: row.email,
    firstName: row.prenom, // Database uses French: prenom
    lastName: row.nom, // Database uses French: nom
    fullName,
    avatarUrl: row.avatar_url ?? null,
  };
}

// =====================================================
// Database Insert/Update Transformers (camelCase → snake_case)
// =====================================================

/**
 * Transform milestone data for database insert
 */
export function transformMilestoneForInsert(data: {
  organizationId: string;
  name: string;
  description?: string;
  startDate: string;
  dueDate: string;
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  color?: string;
  progressMode?: "auto" | "manual";
  progressPercentage?: number;
  createdBy: string;
}) {
  return {
    organization_id: data.organizationId,
    name: data.name,
    description: data.description ?? null,
    start_date: data.startDate,
    due_date: data.dueDate,
    status: data.status ?? "not_started",
    priority: data.priority ?? "medium",
    color: data.color ?? null,
    progress_mode: data.progressMode ?? "auto",
    progress_percentage: data.progressPercentage ?? 0,
    created_by: data.createdBy,
  };
}

/**
 * Transform milestone data for database update
 */
export function transformMilestoneForUpdate(data: {
  name?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  color?: string;
  progressMode?: "auto" | "manual";
  progressPercentage?: number;
}) {
  const update: Record<string, unknown> = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.startDate !== undefined) update.start_date = data.startDate;
  if (data.dueDate !== undefined) update.due_date = data.dueDate;
  if (data.status !== undefined) update.status = data.status;
  if (data.priority !== undefined) update.priority = data.priority;
  if (data.color !== undefined) update.color = data.color;
  if (data.progressMode !== undefined) update.progress_mode = data.progressMode;
  if (data.progressPercentage !== undefined)
    update.progress_percentage = data.progressPercentage;

  return update;
}

/**
 * Transform dependency data for database insert
 */
export function transformDependencyForInsert(data: {
  milestoneId: string;
  dependsOnMilestoneId: string;
  dependencyType: DependencyType;
  lagDays?: number;
}) {
  return {
    milestone_id: data.milestoneId,
    depends_on_milestone_id: data.dependsOnMilestoneId,
    dependency_type: data.dependencyType,
    lag_days: data.lagDays ?? 0,
  };
}

/**
 * Transform assignment data for database insert
 */
export function transformAssignmentForInsert(data: {
  milestoneId: string;
  userId: string;
  role?: "owner" | "contributor" | "reviewer";
}) {
  return {
    milestone_id: data.milestoneId,
    user_id: data.userId,
    role: data.role ?? "contributor",
  };
}

/**
 * Transform milestone task data for database insert
 */
export function transformMilestoneTaskForInsert(data: {
  milestoneId: string;
  taskCardId: string;
  weight?: number;
}) {
  return {
    milestone_id: data.milestoneId,
    tache_id: data.taskCardId,
    weight: data.weight ?? 1,
  };
}

// =====================================================
// Status & Priority Utilities
// =====================================================

/**
 * Get status label
 */
export function getStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "blocked":
      return "Blocked";
    case "at_risk":
      return "At Risk";
  }
}

/**
 * Get status color class
 */
export function getStatusColor(status: MilestoneStatus): string {
  switch (status) {
    case "not_started":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "in_progress":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "completed":
      return "text-green-600 bg-green-50 border-green-200";
    case "blocked":
      return "text-red-600 bg-red-50 border-red-200";
    case "at_risk":
      return "text-orange-600 bg-orange-50 border-orange-200";
  }
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: MilestonePriority): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "critical":
      return "Critical";
  }
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: MilestonePriority): string {
  switch (priority) {
    case "low":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "critical":
      return "text-red-600 bg-red-50 border-red-200";
  }
}

/**
 * Get dependency type label
 */
export function getDependencyTypeLabel(type: DependencyType): string {
  switch (type) {
    case "finish_to_start":
      return "Finish to Start";
    case "start_to_start":
      return "Start to Start";
    case "finish_to_finish":
      return "Finish to Finish";
    case "start_to_finish":
      return "Start to Finish";
  }
}

/**
 * Get dependency type description
 */
export function getDependencyTypeDescription(type: DependencyType): string {
  switch (type) {
    case "finish_to_start":
      return "This milestone starts when dependency finishes";
    case "start_to_start":
      return "Both milestones start at the same time";
    case "finish_to_finish":
      return "Both milestones finish at the same time";
    case "start_to_finish":
      return "This milestone finishes when dependency starts";
  }
}

// =====================================================
// Date Utilities
// =====================================================

/**
 * Check if milestone is overdue
 */
export function isMilestoneOverdue(milestone: Milestone): boolean {
  if (milestone.status === "completed") return false;
  return new Date(milestone.dueDate) < new Date();
}

/**
 * Calculate milestone duration in days
 */
export function getMilestoneDuration(milestone: Milestone): number {
  const start = new Date(milestone.startDate);
  const end = new Date(milestone.dueDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until milestone due date
 */
export function getDaysUntilDue(milestone: Milestone): number {
  const today = new Date();
  const dueDate = new Date(milestone.dueDate);
  return Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: string, dueDate: string): boolean {
  return new Date(startDate) <= new Date(dueDate);
}

/**
 * Format date for display
 */
export function formatMilestoneDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date range for display
 */
export function formatMilestoneDateRange(milestone: Milestone): string {
  const start = formatMilestoneDate(milestone.startDate);
  const end = formatMilestoneDate(milestone.dueDate);
  return `${start} → ${end}`;
}

// =====================================================
// Progress Utilities
// =====================================================

/**
 * Calculate progress percentage from tasks
 */
export function calculateProgressFromTasks(tasks: TaskCard[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.statut === "DONE").length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Get effective progress (respects progressMode)
 */
export function getEffectiveProgress(milestone: Milestone): number {
  return milestone.progressMode === "manual"
    ? milestone.progressPercentage
    : milestone.calculatedProgress;
}

/**
 * Get progress color class
 */
export function getProgressColor(percentage: number): string {
  if (percentage === 0) return "bg-gray-200";
  if (percentage < 25) return "bg-red-500";
  if (percentage < 50) return "bg-orange-500";
  if (percentage < 75) return "bg-yellow-500";
  if (percentage < 100) return "bg-blue-500";
  return "bg-green-500";
}

/**
 * Check if milestone is on track
 */
export function isMilestoneOnTrack(milestone: Milestone): boolean {
  const now = new Date();
  const start = new Date(milestone.startDate);
  const end = new Date(milestone.dueDate);

  // Not started yet
  if (now < start) return true;

  // Completed
  if (milestone.status === "completed") return true;

  // Calculate expected progress
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress = (elapsed / totalDuration) * 100;

  const actualProgress = getEffectiveProgress(milestone);

  // On track if actual progress is within 10% of expected
  return actualProgress >= expectedProgress - 10;
}

// =====================================================
// Assignment Utilities
// =====================================================

/**
 * Get assignment role label
 */
export function getAssignmentRoleLabel(
  role: "owner" | "contributor" | "reviewer",
): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "contributor":
      return "Contributor";
    case "reviewer":
      return "Reviewer";
  }
}

/**
 * Get assignment role color
 */
export function getAssignmentRoleColor(
  role: "owner" | "contributor" | "reviewer",
): string {
  switch (role) {
    case "owner":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "contributor":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "reviewer":
      return "text-green-600 bg-green-50 border-green-200";
  }
}

// =====================================================
// Sorting & Filtering Utilities
// =====================================================

/**
 * Sort milestones by start date
 */
export function sortMilestonesByStartDate(
  milestones: Milestone[],
): Milestone[] {
  return [...milestones].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

/**
 * Sort milestones by due date
 */
export function sortMilestonesByDueDate(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
}

/**
 * Sort milestones by priority
 */
export function sortMilestonesByPriority(milestones: Milestone[]): Milestone[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...milestones].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
}

/**
 * Filter milestones by status
 */
export function filterMilestonesByStatus(
  milestones: Milestone[],
  statuses: MilestoneStatus[],
): Milestone[] {
  return milestones.filter((m) => statuses.includes(m.status));
}

/**
 * Filter milestones by priority
 */
export function filterMilestonesByPriority(
  milestones: Milestone[],
  priorities: MilestonePriority[],
): Milestone[] {
  return milestones.filter((m) => priorities.includes(m.priority));
}

/**
 * Filter milestones by date range
 */
export function filterMilestonesByDateRange(
  milestones: Milestone[],
  startDate: Date,
  endDate: Date,
): Milestone[] {
  return milestones.filter((m) => {
    const mStart = new Date(m.startDate);
    const mEnd = new Date(m.dueDate);
    return (
      (mStart >= startDate && mStart <= endDate) ||
      (mEnd >= startDate && mEnd <= endDate) ||
      (mStart <= startDate && mEnd >= endDate)
    );
  });
}

/**
 * Get milestones assigned to user
 */
export function getMilestonesAssignedToUser(
  milestones: Milestone[],
  userId: string,
): Milestone[] {
  return milestones.filter((m) =>
    m.assignments?.some((a) => a.userId === userId),
  );
}

// =====================================================
// Dependency Utilities
// =====================================================

/**
 * Check if milestone has dependencies
 */
export function hasDependencies(milestone: Milestone): boolean {
  return (milestone.dependencies?.length ?? 0) > 0;
}

/**
 * Check if milestone has dependents
 */
export function hasDependents(milestone: Milestone): boolean {
  return (milestone.dependents?.length ?? 0) > 0;
}

/**
 * Get all dependency IDs for a milestone
 */
export function getDependencyIds(milestone: Milestone): string[] {
  return milestone.dependencies?.map((d) => d.dependsOnMilestoneId) ?? [];
}

/**
 * Get all dependent IDs for a milestone
 */
export function getDependentIds(milestone: Milestone): string[] {
  return milestone.dependents?.map((d) => d.milestoneId) ?? [];
}

/**
 * Check for circular dependencies (simple check)
 */
export function hasCircularDependency(
  milestones: Milestone[],
  fromId: string,
  toId: string,
): boolean {
  const visited = new Set<string>();

  function dfs(currentId: string): boolean {
    if (currentId === fromId) return true;
    if (visited.has(currentId)) return false;

    visited.add(currentId);

    const current = milestones.find((m) => m.id === currentId);
    if (!current) return false;

    for (const dep of current.dependencies ?? []) {
      if (dfs(dep.dependsOnMilestoneId)) return true;
    }

    return false;
  }

  return dfs(toId);
}
