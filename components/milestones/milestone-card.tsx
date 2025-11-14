"use client";

/**
 * Milestone Card Component
 * Displays a milestone with status, progress, dates, and actions
 */

import type { Milestone } from "@/types/milestones";
import {
  formatMilestoneDateRange,
  getDaysUntilDue,
  getEffectiveProgress,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  isMilestoneOverdue,
} from "@/utils/milestone-transformers";

interface MilestoneCardProps {
  milestone: Milestone;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
  onClick?: (milestone: Milestone) => void;
}

export function MilestoneCard({
  milestone,
  onEdit,
  onDelete,
  onClick,
}: MilestoneCardProps) {
  const progress = getEffectiveProgress(milestone);
  const isOverdue = isMilestoneOverdue(milestone);
  const daysUntilDue = getDaysUntilDue(milestone);

  return (
    <div
      className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(milestone)}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: milestone.color || "#3B82F6",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{milestone.name}</h3>
          {milestone.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {milestone.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(milestone);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
              aria-label="Edit milestone"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(milestone);
              }}
              className="text-sm text-destructive hover:text-destructive/80"
              aria-label="Delete milestone"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`text-xs px-2 py-1 rounded border ${getStatusColor(milestone.status)}`}
        >
          {getStatusLabel(milestone.status)}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded border ${getPriorityColor(milestone.priority)}`}
        >
          {getPriorityLabel(milestone.priority)}
        </span>
        {isOverdue && (
          <span className="text-xs px-2 py-1 rounded border text-red-600 bg-red-50 border-red-200">
            Overdue
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task Count */}
      {milestone.totalTasks > 0 && (
        <div className="text-sm text-muted-foreground mb-3">
          {milestone.completedTasks}/{milestone.totalTasks} tasks completed
        </div>
      )}

      {/* Dates */}
      <div className="text-sm text-muted-foreground mb-3">
        {formatMilestoneDateRange(milestone)}
      </div>

      {/* Days Until Due */}
      {daysUntilDue > 0 && daysUntilDue <= 30 && (
        <div className="text-sm text-orange-600">
          {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"} until due
        </div>
      )}

      {/* Team Members */}
      {milestone.assignments && milestone.assignments.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Team:</span>
          <div className="flex -space-x-2">
            {milestone.assignments.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
                title={assignment.user?.email}
              >
                {assignment.user?.firstName?.[0] ||
                  assignment.user?.email[0].toUpperCase()}
              </div>
            ))}
            {milestone.assignments.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center border-2 border-white">
                +{milestone.assignments.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
