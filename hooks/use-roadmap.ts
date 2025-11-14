import { useCallback, useEffect, useState } from "react";
import type {
  CreateMilestoneRequest,
  CriticalPathResult,
  Milestone,
  UpdateMilestoneRequest,
} from "@/types/milestones";

export function useRoadmap(organizationId: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [criticalPath, setCriticalPath] = useState<CriticalPathResult | null>(
    null,
  );
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch milestones
  const fetchMilestones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/milestones`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch milestones");
      }

      const result = await response.json();
      setMilestones(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Fetch critical path
  const fetchCriticalPath = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/critical-path`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch critical path");
      }

      const result = await response.json();
      setCriticalPath(result.data);
    } catch (err) {
      console.error("Error fetching critical path:", err);
    }
  }, [organizationId]);

  // Create milestone
  const createMilestone = useCallback(
    async (data: CreateMilestoneRequest) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create milestone");
      }

      const result = await response.json();
      setMilestones((prev) => [...prev, result.data]);
      return result.data;
    },
    [organizationId],
  );

  // Update milestone
  const updateMilestone = useCallback(
    async (milestoneId: string, data: UpdateMilestoneRequest) => {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update milestone");
      }

      const result = await response.json();
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? result.data : m)),
      );
      if (selectedMilestone?.id === milestoneId) {
        setSelectedMilestone(result.data);
      }
      return result.data;
    },
    [selectedMilestone],
  );

  // Delete milestone
  const deleteMilestone = useCallback(
    async (milestoneId: string) => {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete milestone");
      }

      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      if (selectedMilestone?.id === milestoneId) {
        setSelectedMilestone(null);
      }
    },
    [selectedMilestone],
  );

  // Add dependency
  const addDependency = useCallback(
    async (
      milestoneId: string,
      data: {
        dependsOnMilestoneId: string;
        dependencyType: string;
        lagDays?: number;
      },
    ) => {
      const response = await fetch(
        `/api/milestones/${milestoneId}/dependencies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add dependency");
      }

      // Refresh milestones to get updated dependencies
      await fetchMilestones();
    },
    [fetchMilestones],
  );

  // Remove dependency
  const removeDependency = useCallback(
    async (milestoneId: string, dependencyId: string) => {
      const response = await fetch(
        `/api/milestones/${milestoneId}/dependencies?dependencyId=${dependencyId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove dependency");
      }

      // Refresh milestones to get updated dependencies
      await fetchMilestones();
    },
    [fetchMilestones],
  );

  // Link tasks
  const linkTasks = useCallback(
    async (milestoneId: string, taskCardIds: string[], weights?: number[]) => {
      const response = await fetch(`/api/milestones/${milestoneId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskCardIds, weights }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to link tasks");
      }

      // Refresh milestones to get updated task counts
      await fetchMilestones();
    },
    [fetchMilestones],
  );

  // Unlink task
  const unlinkTask = useCallback(
    async (milestoneId: string, taskCardId: string) => {
      const response = await fetch(
        `/api/milestones/${milestoneId}/tasks?taskCardId=${taskCardId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unlink task");
      }

      // Refresh milestones to get updated task counts
      await fetchMilestones();
    },
    [fetchMilestones],
  );

  // Assign user
  const assignUser = useCallback(
    async (
      milestoneId: string,
      data: { userId: string; role?: "owner" | "contributor" | "reviewer" },
    ) => {
      const response = await fetch(
        `/api/milestones/${milestoneId}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign user");
      }

      // Refresh milestones to get updated assignments
      await fetchMilestones();
    },
    [fetchMilestones],
  );

  // Unassign user
  const unassignUser = useCallback(
    async (milestoneId: string, userId: string) => {
      const response = await fetch(
        `/api/milestones/${milestoneId}/assignments?userId=${userId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unassign user");
      }

      // Refresh milestones to get updated assignments
      await fetchMilestones();
    },
    [fetchMilestones],
  );

  // Initial fetch
  useEffect(() => {
    fetchMilestones();
    fetchCriticalPath();
  }, [fetchMilestones, fetchCriticalPath]);

  return {
    milestones,
    criticalPath,
    selectedMilestone,
    setSelectedMilestone,
    isLoading,
    error,
    fetchMilestones,
    fetchCriticalPath,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    addDependency,
    removeDependency,
    linkTasks,
    unlinkTask,
    assignUser,
    unassignUser,
  };
}
