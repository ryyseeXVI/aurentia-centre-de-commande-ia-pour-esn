"use client";

import { useParams } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  website: string | null;
  role: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceContextType {
  organizations: Organization[];
  currentWorkspaceId: string | null;
  currentOrganization: Organization | null;
  loading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract workspace ID from URL params
  const currentWorkspaceId = (params?.orgId as string) || null;

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } else {
        // Only log error for non-authentication issues
        if (response.status !== 401) {
          console.error("Failed to fetch organizations:", response.status);
        }
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrganizations = async () => {
    setLoading(true);
    await fetchOrganizations();
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  const currentOrganization = currentWorkspaceId
    ? organizations.find((org) => org.id === currentWorkspaceId) || null
    : null;

  const value: WorkspaceContextType = {
    organizations,
    currentWorkspaceId,
    currentOrganization,
    loading,
    refreshOrganizations,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
