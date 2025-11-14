// @ts-nocheck
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Calendar, CheckSquare, MessageSquare, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TaskCard as TaskCardType } from "@/types/tasks";
import { isTaskOverdue } from "@/utils/task-transformers";

interface TaskCardProps {
  task: TaskCardType;
  isDragging?: boolean;
  onClick?: () => void;
}

export default function TaskCard({
  task,
  isDragging = false,
  onClick,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const priorityColors = {
    urgent: "bg-red-100 text-red-700 border-red-300",
    high: "bg-orange-100 text-orange-700 border-orange-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-gray-100 text-gray-700 border-gray-300",
  };

  const isOverdue = isTaskOverdue(task);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={
        isDragging
          ? ""
          : "cursor-grab active:cursor-grabbing focus-visible:outline-none"
      }
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.nom}`}
    >
      <Card
        className="p-3 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={(e) => {
          if (!isSortableDragging && onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        onKeyDown={(e) => {
          if (
            (e.key === "Enter" || e.key === " ") &&
            !isSortableDragging &&
            onClick
          ) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Priority Badge */}
        {task.priority && task.priority !== "medium" && (
          <div className="mb-2">
            <Badge
              variant="outline"
              className={`text-xs ${priorityColors[task.priority]}`}
              aria-label={`Priority: ${task.priority}`}
            >
              {task.priority.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Title */}
        <h4
          className="font-medium text-sm mb-2 line-clamp-2"
          title={task.nom}
        >
          {task.nom}
        </h4>

        {/* Description Preview */}
        {task.description && (
          <p
            className="text-xs text-muted-foreground mb-3 line-clamp-2"
            title={task.description}
          >
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {task.checklistProgress && task.checklistProgress.total > 0 && (
              <div
                className="flex items-center gap-1"
                aria-label={`Checklist: ${task.checklistProgress.completed} of ${task.checklistProgress.total} completed`}
              >
                <CheckSquare className="h-3 w-3" aria-hidden="true" />
                <span>
                  {task.checklistProgress.completed}/
                  {task.checklistProgress.total}
                </span>
              </div>
            )}
            {task.commentsCount && task.commentsCount > 0 && (
              <div
                className="flex items-center gap-1"
                aria-label={`${task.commentsCount} comments`}
              >
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
                <span>{task.commentsCount}</span>
              </div>
            )}
            {task.attachmentsCount && task.attachmentsCount > 0 && (
              <div
                className="flex items-center gap-1"
                aria-label={`${task.attachmentsCount} attachments`}
              >
                <Paperclip className="h-3 w-3" aria-hidden="true" />
                <span>{task.attachmentsCount}</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          {task.dateFinCible && (
            <time
              className={`flex items-center gap-1 transition-colors ${
                isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""
              }`}
              dateTime={task.dateFinCible}
              aria-label={
                isOverdue
                  ? `Overdue: ${format(new Date(task.dateFinCible), "MMM d")}`
                  : `Due: ${format(new Date(task.dateFinCible), "MMM d")}`
              }
            >
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <span>{format(new Date(task.dateFinCible), "MMM d")}</span>
            </time>
          )}
        </div>

        {/* Assignee */}
        {task.consultant && (
          <div
            className="flex items-center gap-1 mt-3"
            role="group"
            aria-label="Assigned to"
          >
            <div
              className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium transition-transform hover:scale-110"
              title={`${task.consultant.prenom} ${task.consultant.nom}`}
              aria-label={`${task.consultant.prenom} ${task.consultant.nom}`}
            >
              {task.consultant.prenom?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
