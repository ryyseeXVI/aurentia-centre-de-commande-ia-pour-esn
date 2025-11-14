"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TaskCard as TaskCardType, TaskColumn } from "@/types/tasks";
import {
  calculateNewPosition,
  columnIdToStatus,
  groupTasksByColumn,
  statusToColumnId,
} from "@/utils/task-transformers";
import KanbanColumn from "./kanban-column";
import TaskCard from "./task-card";

interface KanbanBoardProps {
  projectId: string;
  columns: TaskColumn[];
  tasks: TaskCardType[];
  onTaskCreated?: (task: TaskCardType) => void;
  onTaskUpdated?: (task: TaskCardType) => void;
  onTaskDeleted?: (taskId: string) => void;
  onTaskMoved: (taskId: string, columnId: string, position: number) => void;
  onRefresh?: () => void;
  onTaskClick?: (taskId: string) => void;
  onCreateTask?: (columnId?: string) => void;
}

export default function KanbanBoard({
  projectId,
  columns,
  tasks,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskMoved,
  onRefresh,
  onTaskClick,
  onCreateTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskCardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tasksByColumn = groupTasksByColumn(tasks);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine if dropped over a column or another task
    const overColumn = columns.find((col) => col.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    const targetColumnId = overColumn
      ? overColumn.id
      : overTask
        ? statusToColumnId(overTask.statut)
        : undefined;

    if (!targetColumnId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // If no change, do nothing
    const currentColumnId = statusToColumnId(task.statut);
    if (currentColumnId === targetColumnId && !overTask) return;

    // Calculate new position
    const tasksInColumn = tasksByColumn[targetColumnId] || [];
    let newPosition: number;

    if (overTask) {
      // Dropped on a task - insert before it
      newPosition = calculateNewPosition(tasksInColumn, overTask.id);
    } else {
      // Dropped on column - add to end
      newPosition = calculateNewPosition(tasksInColumn, null);
    }

    // Optimistically update UI
    onTaskMoved(taskId, targetColumnId, newPosition);

    // Send to server
    try {
      // Convert columnId to statut
      const newStatus = columnIdToStatus(targetColumnId);

      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: newStatus,
          position: newPosition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || "Failed to move task";
        const errorDetails = errorData.details ? JSON.stringify(errorData.details) : "";

        console.error("Move task failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          taskId,
          targetColumnId,
          newStatus,
          newPosition,
        });

        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const result = await response.json();
      console.log("Task moved successfully:", result);
    } catch (error: any) {
      console.error("Error moving task:", error);
      const errorMsg = error.message || "Failed to move task";
      toast.error(errorMsg.length > 100 ? "Failed to move task - check console for details" : errorMsg);
      onRefresh?.();
    }
  };

  const handleCreateTask = (columnId: string) => {
    if (onCreateTask) {
      onCreateTask(columnId);
    }
  };

  const handleTaskClickInternal = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              onCreateTask={handleCreateTask}
              onTaskClick={handleTaskClickInternal}
            />
          ))}

          {columns.length === 0 && (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">No columns found</p>
                <p className="text-sm mt-2">
                  Columns should be created automatically for new organizations.
                </p>
                <Button variant="outline" className="mt-4" onClick={onRefresh}>
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
