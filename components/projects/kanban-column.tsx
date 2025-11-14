"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskCard as TaskCardType, TaskColumn } from "@/types/tasks";
import { sortTasksByPosition } from "@/utils/task-transformers";
import TaskCard from "./task-card";

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: TaskCardType[];
  onCreateTask: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
}

export default function KanbanColumn({
  column,
  tasks,
  onCreateTask,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const sortedTasks = sortTasksByPosition(tasks);
  const taskIds = sortedTasks.map((task) => task.id);

  return (
    <div className="flex flex-col w-80 md:w-72 lg:w-80 bg-muted/30 rounded-lg shrink-0 border border-border/50">
      {/* Column Header */}
      <div className="p-4 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {column.color && (
              <div
                className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
                style={{ backgroundColor: column.color }}
                aria-label={`Column color: ${column.color}`}
              />
            )}
            <h3 className="font-semibold">{column.name}</h3>
            <span
              className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              aria-label={`${tasks.length} tasks`}
            >
              {tasks.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 transition-all hover:scale-110"
            onClick={() => onCreateTask(column.id)}
            aria-label={`Add task to ${column.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]"
        role="region"
        aria-label={`${column.name} tasks`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground px-4 text-center">
            <div className="mb-2 text-2xl" aria-hidden="true">
              📋
            </div>
            <p>No tasks yet</p>
            <p className="text-xs mt-1">Drag tasks here or click + to add</p>
          </div>
        )}
      </div>
    </div>
  );
}
