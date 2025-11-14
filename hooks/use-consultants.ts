/**
 * Consultant Management Hooks
 *
 * React hooks for CRUD operations on consultants
 */

import { useState, useEffect, useCallback } from "react";
import type {
  Consultant,
  ConsultantFilters,
  CreateConsultantRequest,
  UpdateConsultantRequest,
} from "@/types/consultants";

/**
 * Hook to fetch all consultants for an organization
 */
export function useConsultants(organizationId: string, filters?: ConsultantFilters) {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultants = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.search) params.append("search", filters.search);

      const response = await fetch(
        `/api/organizations/${organizationId}/consultants?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch consultants");
      }

      const data = await response.json();
      setConsultants(data.consultants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setConsultants([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, filters?.role, filters?.search]);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  return {
    consultants,
    isLoading,
    error,
    refetch: fetchConsultants,
  };
}

/**
 * Hook to fetch a single consultant
 */
export function useConsultant(organizationId: string, consultantId: string) {
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultant = useCallback(async () => {
    if (!organizationId || !consultantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/consultants/${consultantId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch consultant");
      }

      const data = await response.json();
      setConsultant(data.consultant);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setConsultant(null);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, consultantId]);

  useEffect(() => {
    fetchConsultant();
  }, [fetchConsultant]);

  return {
    consultant,
    isLoading,
    error,
    refetch: fetchConsultant,
  };
}

/**
 * Hook to create a consultant
 */
export function useCreateConsultant() {
  const [isCreating, setIsCreating] = useState(false);

  const createConsultant = useCallback(
    async (organizationId: string, data: CreateConsultantRequest) => {
      setIsCreating(true);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/consultants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create consultant");
        }

        const result = await response.json();
        return result.consultant;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return { createConsultant, isCreating };
}

/**
 * Hook to update a consultant
 */
export function useUpdateConsultant() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateConsultant = useCallback(
    async (
      organizationId: string,
      consultantId: string,
      data: UpdateConsultantRequest
    ) => {
      setIsUpdating(true);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/consultants/${consultantId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update consultant");
        }

        const result = await response.json();
        return result.consultant;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return { updateConsultant, isUpdating };
}

/**
 * Hook to delete a consultant
 */
export function useDeleteConsultant() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteConsultant = useCallback(
    async (organizationId: string, consultantId: string) => {
      setIsDeleting(true);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/consultants/${consultantId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete consultant");
        }

        return true;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  return { deleteConsultant, isDeleting };
}

/**
 * Hook to update consultant role
 */
export function useUpdateConsultantRole() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRole = useCallback(
    async (organizationId: string, consultantId: string, role: string) => {
      setIsUpdating(true);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/consultants/${consultantId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update role");
        }

        const result = await response.json();
        return result.consultant;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return { updateRole, isUpdating };
}
