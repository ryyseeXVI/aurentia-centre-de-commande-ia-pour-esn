/**
 * Types for the Project Roadmap / Milestone System
 * All types use camelCase (frontend/API format)
 * Database uses snake_case and is transformed via API routes
 */

import type { TaskCard } from "./tasks";

// =====================================================
// Enums
// =====================================================

export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "at_risk";
export type MilestonePriority = "low" | "medium" | "high" | "critical";
export type DependencyType =
  | "finish_to_start"
  | "start_to_start"
  | "finish_to_finish"
  | "start_to_finish";
export type ProgressMode = "auto" | "manual";
export type AssignmentRole = "owner" | "contributor" | "reviewer";

// =====================================================
// Core Entities
// =====================================================

/**
 * Milestone - A high-level goal or project phase
 * Higher level than daily tasks, represents significant deliverables
 */
export interface Milestone {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  description: string | null;
  startDate: string; // ISO date string
  dueDate: string; // ISO date string
  status: MilestoneStatus;
  priority: MilestonePriority;
  color: string | null; // Hex color code like #3B82F6
  progressMode: ProgressMode;
  progressPercentage: number; // 0-100, used when progressMode = 'manual'

  // Calculated fields (from milestone_progress_view)
  calculatedProgress: number; // 0-100, calculated from linked tasks
  totalTasks: number;
  completedTasks: number;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Related data (populated by joins)
  assignments?: MilestoneAssignment[];
  dependencies?: MilestoneDependency[]; // Milestones this one depends on
  dependents?: MilestoneDependency[]; // Milestones that depend on this one
  tasks?: MilestoneTask[];
}

/**
 * Milestone Dependency
 * Defines relationships between milestones (A must finish before B starts, etc.)
 */
export interface MilestoneDependency {
  id: string;
  milestoneId: string;
  dependsOnMilestoneId: string;
  dependencyType: DependencyType;
  lagDays: number; // Positive for delay, negative for lead time
  createdAt: string;

  // Populated by joins
  dependsOnMilestone?: Milestone; // For forward dependencies
  milestone?: Milestone; // For reverse dependencies (dependents)
}

/**
 * Milestone Assignment
 * Team members assigned to a milestone
 */
export interface MilestoneAssignment {
  id: string;
  milestoneId: string;
  userId: string;
  role: AssignmentRole;
  createdAt: string;

  // Populated by joins
  user?: MilestoneUser;
}

/**
 * Milestone Task
 * Links milestones to existing task cards for progress tracking
 */
export interface MilestoneTask {
  id: string;
  milestoneId: string;
  tacheId: string;
  weight: number; // For weighted progress calculation
  createdAt: string;

  // Populated by joins
  task?: TaskCard;
}

/**
 * Simplified user info for milestone assignments
 */
export interface MilestoneUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

// =====================================================
// Critical Path Analysis
// =====================================================

/**
 * Critical Path Node
 * Result of critical path calculation for a single milestone
 */
export interface CriticalPathNode {
  milestoneId: string;
  milestone: Milestone;
  earliestStart: string; // ISO date
  earliestFinish: string; // ISO date
  latestStart: string; // ISO date
  latestFinish: string; // ISO date
  slack: number; // Days of slack/float
  isCritical: boolean; // True if on critical path (slack = 0)
}

/**
 * Critical Path Result
 * Complete critical path analysis for a project
 */
export interface CriticalPathResult {
  criticalPath: CriticalPathNode[];
  projectDuration: number; // Total days from start to finish
  projectStartDate: string; // ISO date
  projectEndDate: string; // ISO date
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request body for creating a milestone
 */
export interface CreateMilestoneRequest {
  organizationId: string;
  name: string;
  description?: string;
  startDate: string; // ISO date
  dueDate: string; // ISO date
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  color?: string; // Hex color
  progressMode?: ProgressMode;
  progressPercentage?: number; // 0-100
}

/**
 * Request body for updating a milestone
 */
export interface UpdateMilestoneRequest {
  name?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  color?: string;
  progressMode?: ProgressMode;
  progressPercentage?: number;
}

/**
 * Request body for updating milestone dates with dependency validation
 */
export interface UpdateMilestoneDatesRequest {
  startDate: string;
  dueDate: string;
  adjustDependents?: boolean; // Auto-adjust dependent milestones
}

/**
 * Response when updating dates with conflicts
 */
export interface UpdateDatesResponse {
  updated: {
    id: string;
    startDate: string;
    dueDate: string;
  };
  conflicts?: Array<{
    milestoneId: string;
    milestoneName: string;
    conflictType: string;
    message: string;
  }>;
  adjusted?: Array<{
    milestoneId: string;
    oldStartDate: string;
    newStartDate: string;
    oldDueDate: string;
    newDueDate: string;
  }>;
}

/**
 * Request body for adding a dependency
 */
export interface AddDependencyRequest {
  dependsOnMilestoneId: string;
  dependencyType: DependencyType;
  lagDays?: number;
}

/**
 * Request body for assigning users to a milestone
 */
export interface AssignUserRequest {
  userId: string;
  role?: AssignmentRole;
}

/**
 * Request body for linking tasks to a milestone
 */
export interface LinkTasksRequest {
  tacheIds: string[];
  weights?: number[]; // Optional, same length as tacheIds
}

/**
 * Response for linking tasks
 */
export interface LinkTasksResponse {
  linked: number; // Count of tasks successfully linked
  skipped?: number; // Count of tasks already linked (idempotent)
}

// =====================================================
// Query/Filter Types
// =====================================================

/**
 * Query parameters for listing milestones
 */
export interface MilestoneListQuery {
  organizationId: string;
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  assignedToMe?: boolean; // Filter by current user
  startDateFrom?: string;
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

// =====================================================
// UI State Types
// =====================================================

/**
 * Roadmap canvas view scale
 */
export type ViewScale = "day" | "week" | "month" | "quarter";

/**
 * Roadmap state for React Flow
 */
export interface RoadmapState {
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  viewScale: ViewScale;
  showCriticalPath: boolean;
  criticalPathData: CriticalPathResult | null;
  isLoading: boolean;
  error?: string;
}

/**
 * Drag and drop state for roadmap
 */
export interface RoadmapDragState {
  activeMilestoneId?: string;
  isDragging: boolean;
  originalPosition?: { x: number; y: number };
}

// =====================================================
// Form Validation Types
// =====================================================

/**
 * Form errors for milestone creation/editing
 */
export interface MilestoneFormErrors {
  name?: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  color?: string;
  progressPercentage?: string;
}

// =====================================================
// Utility Types
// =====================================================

/**
 * Generic API response wrapper for milestones
 */
export interface MilestoneApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Date range helper
 */
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
