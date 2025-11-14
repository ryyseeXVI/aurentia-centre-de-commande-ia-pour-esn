"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  Target,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Milestone } from "@/types/milestones";
import type { TaskCard } from "@/types/tasks";
import {
  getEffectiveProgress,
  getStatusColor,
  isMilestoneOverdue,
} from "@/utils/milestone-transformers";

interface MilestoneDetailDialogProps {
  milestone: Milestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MilestoneDetailDialog({
  milestone,
  open,
  onOpenChange,
}: MilestoneDetailDialogProps) {
  const [linkedTasks, setLinkedTasks] = useState<TaskCard[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchLinkedTasks = useCallback(async () => {
    if (!milestone?.id) return;

    setLoadingTasks(true);
    try {
      const response = await fetch(`/api/milestones/${milestone.id}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setLinkedTasks(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching linked tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, [milestone?.id]);

  useEffect(() => {
    if (open && milestone) {
      fetchLinkedTasks();
    }
  }, [open, milestone, fetchLinkedTasks]);

  if (!milestone) {
    return null;
  }

  const progress = getEffectiveProgress(milestone);
  const isOverdue = isMilestoneOverdue(milestone);
  const statusColor = getStatusColor(milestone.status);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-700 border-green-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "REVIEW":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "BLOCKED":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl">{milestone.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {milestone.description || "No description provided"}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusColor as any}>
              {String(milestone.status).replace(/_/g, " ").toUpperCase()}
            </Badge>
            <Badge variant={getPriorityColor(milestone.priority)}>
              {String(milestone.priority).toUpperCase()} PRIORITY
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                OVERDUE
              </Badge>
            )}
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Progress</span>
              </div>
              <span className="text-2xl font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            {milestone.totalTasks > 0 && (
              <p className="text-sm text-muted-foreground">
                {milestone.completedTasks} of {milestone.totalTasks} tasks completed
              </p>
            )}
          </div>

          <Separator />

          {/* Dates Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Start Date</span>
              </div>
              <p className="text-base font-medium">
                {format(new Date(milestone.startDate), "PPP")}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Due Date</span>
              </div>
              <p className="text-base font-medium">
                {format(new Date(milestone.dueDate), "PPP")}
              </p>
            </div>
          </div>

          {/* Timeline Duration */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold">
              {Math.ceil(
                (new Date(milestone.dueDate).getTime() -
                  new Date(milestone.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              days
            </p>
          </div>

          {/* Assigned Team Members */}
          {milestone.assignments && milestone.assignments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Assigned Team</span>
                  <Badge variant="secondary">{milestone.assignments.length}</Badge>
                </div>
                <div className="space-y-2">
                  {milestone.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
                        {assignment.user?.firstName?.charAt(0) ||
                          assignment.user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {assignment.user?.fullName || assignment.user?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.user?.email}
                        </p>
                      </div>
                      <Badge variant="outline">{assignment.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Dependencies */}
          {milestone.dependencies && milestone.dependencies.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Dependencies</span>
                  <Badge variant="secondary">{milestone.dependencies.length}</Badge>
                </div>
                <div className="space-y-2">
                  {milestone.dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Dependency ID: {dep.dependsOnMilestoneId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Type: {dep.dependencyType.replace(/_/g, " ")}
                          {dep.lagDays !== 0 && ` (${dep.lagDays} days lag)`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Linked Tasks */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Linked Tasks</span>
                {linkedTasks.length > 0 && (
                  <Badge variant="secondary">{linkedTasks.length}</Badge>
                )}
              </div>
            </div>

            {loadingTasks ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : linkedTasks.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {linkedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.nom}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {task.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${getTaskStatusColor(task.statut)}`}
                    >
                      {task.statut}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tasks linked to this milestone yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
