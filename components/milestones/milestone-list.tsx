"use client";

/**
 * Milestone List Component
 * Displays a list of milestones with filtering and sorting
 */

import { useEffect } from "react";
import { useMilestones } from "@/hooks/use-milestones";
import type {
  Milestone,
  MilestonePriority,
  MilestoneStatus,
} from "@/types/milestones";
import { MilestoneCard } from "./milestone-card";

interface MilestoneListProps {
  projectId: string;
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  assignedToMe?: boolean;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
  onClick?: (milestone: Milestone) => void;
  emptyMessage?: string;
}

export function MilestoneList({
  projectId,
  status,
  priority,
  assignedToMe,
  onEdit,
  onDelete,
  onClick,
  emptyMessage = "No milestones found",
}: MilestoneListProps) {
  const { milestones, loading, error, fetchMilestones } = useMilestones(
    projectId,
    {
      status,
      priority,
      assignedToMe,
    },
  );

  // Fetch milestones on mount and when filters change
  useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, status, priority, assignedToMe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading milestones...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => fetchMilestones()}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
