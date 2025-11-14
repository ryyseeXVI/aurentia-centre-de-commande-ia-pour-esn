/**
 * React Hooks for Milestone Management
 * Provides data fetching and mutations for milestones
 */

import { useCallback, useState } from "react";
import type {
  AddDependencyRequest,
  AssignUserRequest,
  CreateMilestoneRequest,
  LinkTasksRequest,
  Milestone,
  MilestoneListQuery,
  UpdateMilestoneRequest,
} from "@/types/milestones";

// =====================================================
// Fetch Milestones Hook
// =====================================================

/**
 * Hook to fetch milestones for a project
 */
export function useMilestones(
  projectId: string,
  filters?: Partial<MilestoneListQuery>,
) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchMilestones = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.assignedToMe) params.append("assignedToMe", "true");
      if (filters?.startDateFrom)
        params.append("startDateFrom", filters.startDateFrom);
      if (filters?.startDateTo)
        params.append("startDateTo", filters.startDateTo);
      if (filters?.dueDateFrom)
        params.append("dueDateFrom", filters.dueDateFrom);
      if (filters?.dueDateTo) params.append("dueDateTo", filters.dueDateTo);

      const queryString = params.toString();
      const url = `/api/projects/${projectId}/milestones${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch milestones");
      }

      setMilestones(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch milestones";
      setError(message);
      console.error("Error fetching milestones:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  return {
    milestones,
    loading,
    error,
    total,
    fetchMilestones,
    refetch: fetchMilestones,
  };
}

// =====================================================
// Fetch Single Milestone Hook
// =====================================================

/**
 * Hook to fetch a single milestone by ID
 */
export function useMilestone(milestoneId: string | null) {
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestone = useCallback(async () => {
    if (!milestoneId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/milestones/${milestoneId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch milestone");
      }

      setMilestone(result.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch milestone";
      setError(message);
      console.error("Error fetching milestone:", err);
    } finally {
      setLoading(false);
    }
  }, [milestoneId]);

  return {
    milestone,
    loading,
    error,
    fetchMilestone,
    refetch: fetchMilestone,
  };
}

// =====================================================
// Create Milestone Hook
// =====================================================

/**
 * Hook to create a new milestone
 */
export function useCreateMilestone(projectId: string) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMilestone = useCallback(
    async (data: Omit<CreateMilestoneRequest, "organizationId">) => {
      setCreating(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create milestone");
        }

        return result.data as Milestone;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create milestone";
        setError(message);
        console.error("Error creating milestone:", err);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [projectId],
  );

  return {
    createMilestone,
    creating,
    error,
  };
}

// =====================================================
// Update Milestone Hook
// =====================================================

/**
 * Hook to update an existing milestone
 */
export function useUpdateMilestone() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMilestone = useCallback(
    async (milestoneId: string, data: UpdateMilestoneRequest) => {
      setUpdating(true);
      setError(null);

      try {
        const response = await fetch(`/api/milestones/${milestoneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update milestone");
        }

        return result.data as Milestone;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update milestone";
        setError(message);
        console.error("Error updating milestone:", err);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  return {
    updateMilestone,
    updating,
    error,
  };
}

// =====================================================
// Delete Milestone Hook
// =====================================================

/**
 * Hook to delete a milestone
 */
export function useDeleteMilestone() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMilestone = useCallback(async (milestoneId: string) => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete milestone");
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete milestone";
      setError(message);
      console.error("Error deleting milestone:", err);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    deleteMilestone,
    deleting,
    error,
  };
}

// =====================================================
// Manage Dependencies Hook
// =====================================================

/**
 * Hook to manage milestone dependencies
 */
export function useMilestoneDependencies() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDependency = useCallback(
    async (milestoneId: string, data: AddDependencyRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/milestones/${milestoneId}/dependencies`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to add dependency");
        }

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add dependency";
        setError(message);
        console.error("Error adding dependency:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeDependency = useCallback(async (dependencyId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/milestones/dependencies/${dependencyId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove dependency");
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove dependency";
      setError(message);
      console.error("Error removing dependency:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addDependency,
    removeDependency,
    loading,
    error,
  };
}

// =====================================================
// Manage Assignments Hook
// =====================================================

/**
 * Hook to manage milestone team assignments
 */
export function useMilestoneAssignments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignUser = useCallback(
    async (milestoneId: string, data: AssignUserRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/milestones/${milestoneId}/assignments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to assign user");
        }

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to assign user";
        setError(message);
        console.error("Error assigning user:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const unassignUser = useCallback(async (assignmentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/milestones/assignments/${assignmentId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to unassign user");
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unassign user";
      setError(message);
      console.error("Error unassigning user:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    assignUser,
    unassignUser,
    loading,
    error,
  };
}

// =====================================================
// Manage Tasks Hook
// =====================================================

/**
 * Hook to manage milestone task links
 */
export function useMilestoneTasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkTasks = useCallback(
    async (milestoneId: string, data: LinkTasksRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/milestones/${milestoneId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to link tasks");
        }

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link tasks";
        setError(message);
        console.error("Error linking tasks:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const unlinkTask = useCallback(
    async (milestoneId: string, taskCardId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/milestones/${milestoneId}/tasks?taskCardId=${taskCardId}`,
          {
            method: "DELETE",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to unlink task");
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to unlink task";
        setError(message);
        console.error("Error unlinking task:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    linkTasks,
    unlinkTask,
    loading,
    error,
  };
}
