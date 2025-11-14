'use client';

// ProjectContext - Manages current project state and project switcher
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Projet, CategorizedProjets } from '../types';
import { logger } from '@/lib/logger';

interface ProjectContextValue {
  // Current project
  currentProjet: Projet | null;
  setCurrentProjet: (projet: Projet | null) => void;

  // All projects (categorized)
  myProjets: Projet[];
  managedProjets: Projet[];
  otherProjets: Projet[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshProjets: () => Promise<void>;
  switchProject: (projetId: string) => void;
}

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  children: React.ReactNode;
  organizationId: string;
  initialProjetId?: string;
}

export function ProjectProvider({ children, organizationId, initialProjetId }: ProjectProviderProps) {
  const [currentProjet, setCurrentProjet] = useState<Projet | null>(null);
  const [myProjets, setMyProjets] = useState<Projet[]>([]);
  const [managedProjets, setManagedProjets] = useState<Projet[]>([]);
  const [otherProjets, setOtherProjets] = useState<Projet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from API
  const refreshProjets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects?organizationId=${organizationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setMyProjets(result.data.myProjets || []);
      setManagedProjets(result.data.managedProjets || []);
      setOtherProjets(result.data.otherProjets || []);

      // If initialProjetId is set, find and set current project
      if (initialProjetId && !currentProjet) {
        const allProjets = [
          ...result.data.myProjets,
          ...result.data.managedProjets,
          ...result.data.otherProjets,
        ];
        const projet = allProjets.find(p => p.id === initialProjetId);
        if (projet) {
          setCurrentProjet(projet);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('Failed to fetch projects', err, { organizationId });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, initialProjetId, currentProjet]);

  // Switch to a different project
  const switchProject = useCallback((projetId: string) => {
    const allProjets = [...myProjets, ...managedProjets, ...otherProjets];
    const projet = allProjets.find(p => p.id === projetId);

    if (projet) {
      setCurrentProjet(projet);

      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(`current_projet_${organizationId}`, projetId);
      }
    }
  }, [myProjets, managedProjets, otherProjets, organizationId]);

  // Load projects on mount
  useEffect(() => {
    refreshProjets();
  }, [refreshProjets]);

  // Restore current project from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentProjet && !isLoading) {
      const savedProjetId = localStorage.getItem(`current_projet_${organizationId}`);
      if (savedProjetId) {
        switchProject(savedProjetId);
      }
    }
  }, [currentProjet, isLoading, organizationId, switchProject]);

  const value: ProjectContextValue = {
    currentProjet,
    setCurrentProjet,
    myProjets,
    managedProjets,
    otherProjets,
    isLoading,
    error,
    refreshProjets,
    switchProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);

  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }

  return context;
}
