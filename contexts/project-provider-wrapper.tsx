'use client';

/**
 * ProjectProviderWrapper
 *
 * This wrapper component integrates ProjectProvider with WorkspaceContext.
 * It automatically provides the current organization ID to ProjectProvider,
 * allowing project data to be organization-scoped.
 */

import React from 'react';
import { ProjectProvider, ProjectContext } from './project-context';
import { useWorkspace } from './workspace-context';
import type { Projet } from '../types';

// Default project context value when no organization is selected
function DefaultProjectProvider({ children }: { children: React.ReactNode }) {
  const value = {
    currentProjet: null as Projet | null,
    setCurrentProjet: () => {},
    myProjets: [] as Projet[],
    managedProjets: [] as Projet[],
    otherProjets: [] as Projet[],
    isLoading: false,
    error: null as string | null,
    refreshProjets: async () => {},
    switchProject: () => {},
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

interface ProjectProviderWrapperProps {
  children: React.ReactNode;
}

export function ProjectProviderWrapper({ children }: ProjectProviderWrapperProps) {
  const { currentOrganization } = useWorkspace();

  // If no organization is selected, use default provider
  // This prevents errors when the user hasn't selected an organization yet
  if (!currentOrganization?.id) {
    return <DefaultProjectProvider>{children}</DefaultProjectProvider>;
  }

  return (
    <ProjectProvider organizationId={currentOrganization.id}>
      {children}
    </ProjectProvider>
  );
}
