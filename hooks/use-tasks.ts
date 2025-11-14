/**
 * Task Management Hooks
 *
 * React hooks for managing tasks (tache table)
 * Provides CRUD operations, filtering, and Kanban board functionality
 */

import { useCallback, useEffect, useState } from "react";
import type {
  CreateTaskRequest,
  MoveTaskRequest,
  TaskCard,
  TaskListQuery,
  UpdateTaskRequest,
} from "@/types/tasks";

/**
 * Fetch tasks for a project
 */
export function useTasks(projectId: string, filters?: TaskListQuery) {
  const [tasks, setTasks] = useState<TaskCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      if (filters?.statut) {
        if (Array.isArray(filters.statut)) {
          params.append("statut", filters.statut.join(","));
        } else {
          params.append("statut", filters.statut);
        }
      }
      if (filters?.consultantResponsableId) {
        params.append(
          "consultantResponsableId",
          filters.consultantResponsableId,
        );
      }
      if (filters?.livrableId) {
        params.append("livrableId", filters.livrableId);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }

      const response = await fetch(
        `/api/projects/${projectId}/tasks?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
}

/**
 * Fetch a single task by ID
 */
export function useTask(taskId: string | null) {
  const [task, setTask] = useState<TaskCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/tasks/${taskId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }

      const data = await response.json();
      setTask(data.data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching task:", err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return {
    task,
    isLoading,
    error,
    refetch: fetchTask,
  };
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (data: CreateTaskRequest) => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch(`/api/projects/${data.projetId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const result = await response.json();
      return result.data as TaskCard;
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating task:", err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createTask,
    isCreating,
    error,
  };
}

/**
 * Update a task
 */
export function useUpdateTask() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskRequest) => {
      try {
        setIsUpdating(true);
        setError(null);

        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update task");
        }

        const result = await response.json();
        return result.data as TaskCard;
      } catch (err: any) {
        setError(err.message);
        console.error("Error updating task:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return {
    updateTask,
    isUpdating,
    error,
  };
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task");
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting task:", err);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    deleteTask,
    isDeleting,
    error,
  };
}

/**
 * Move a task (for Kanban drag & drop)
 */
export function useMoveTask() {
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moveTask = useCallback(
    async (taskId: string, data: MoveTaskRequest) => {
      try {
        setIsMoving(true);
        setError(null);

        const response = await fetch(`/api/tasks/${taskId}/move`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to move task");
        }

        const result = await response.json();
        return result.data;
      } catch (err: any) {
        setError(err.message);
        console.error("Error moving task:", err);
        throw err;
      } finally {
        setIsMoving(false);
      }
    },
    [],
  );

  return {
    moveTask,
    isMoving,
    error,
  };
}

/**
 * Optimistic update for Kanban board
 * Updates local state immediately, then syncs with server
 */
export function useOptimisticTaskMove(
  tasks: TaskCard[],
  setTasks: (tasks: TaskCard[]) => void,
) {
  const { moveTask } = useMoveTask();

  const handleTaskMove = useCallback(
    async (taskId: string, newStatut: string, newPosition: number) => {
      // Store original tasks for rollback
      const originalTasks = [...tasks];

      // Optimistically update local state
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            statut: newStatut as any,
            position: newPosition,
          };
        }
        return task;
      });
      setTasks(updatedTasks);

      try {
        // Sync with server
        await moveTask(taskId, {
          statut: newStatut as any,
          position: newPosition,
        });
      } catch (error) {
        // Rollback on error
        setTasks(originalTasks);
        throw error;
      }
    },
    [tasks, setTasks, moveTask],
  );

  return { handleTaskMove };
}
