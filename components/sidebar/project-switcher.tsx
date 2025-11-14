"use client";

import { Briefcase, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProject } from "@/contexts/project-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { Badge } from "@/components/ui/badge";

export function ProjectSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { currentOrganization } = useWorkspace();
  const {
    currentProjet,
    myProjets,
    managedProjets,
    otherProjets,
    switchProject,
    isLoading,
  } = useProject();

  // Don't show if no organization is selected
  if (!currentOrganization) {
    return null;
  }

  const handleProjectSwitch = (projetId: string) => {
    switchProject(projetId);
    // Navigate to project detail page
    if (currentOrganization) {
      router.push(`/app/organizations/${currentOrganization.id}/projects/${projetId}`);
    }
  };

  const handleCreateProject = () => {
    // TODO: Open create project dialog
    router.push(`/app/projects/new`);
  };

  // Get status badge
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "ACTIF":
        return <Badge variant="default" className="text-xs">Active</Badge>;
      case "EN_COURS":
        return <Badge variant="default" className="text-xs">In Progress</Badge>;
      case "TERMINE":
        return <Badge variant="secondary" className="text-xs">Completed</Badge>;
      case "SUSPENDU":
        return <Badge variant="outline" className="text-xs">Suspended</Badge>;
      case "ANNULE":
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{statut}</Badge>;
    }
  };

  // If no projects at all, show a simplified "Create Project" button
  const totalProjects = myProjets.length + managedProjets.length + otherProjets.length;

  if (!isLoading && totalProjects === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={handleCreateProject}
            className="cursor-pointer"
          >
            <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Create Project</span>
              <span className="truncate text-xs text-muted-foreground">
                Get started
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Use first available project if no current project selected
  const activeProject = currentProjet || myProjets[0] || managedProjets[0] || otherProjets[0];

  if (!activeProject) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg">
                <FolderKanban className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeProject.nom}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {getStatusBadge(activeProject.statut)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* My Projects Section */}
            {myProjets.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  My Projects
                </DropdownMenuLabel>
                {myProjets.map((projet) => (
                  <DropdownMenuItem
                    key={projet.id}
                    onClick={() => handleProjectSwitch(projet.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Briefcase className="size-3.5 shrink-0" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm truncate">{projet.nom}</span>
                      <span className="text-xs text-muted-foreground">
                        {getStatusBadge(projet.statut)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Managed Projects Section */}
            {managedProjets.length > 0 && (
              <>
                {myProjets.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Managed Projects
                </DropdownMenuLabel>
                {managedProjets.map((projet) => (
                  <DropdownMenuItem
                    key={projet.id}
                    onClick={() => handleProjectSwitch(projet.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Briefcase className="size-3.5 shrink-0" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm truncate">{projet.nom}</span>
                      <span className="text-xs text-muted-foreground">
                        {getStatusBadge(projet.statut)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Other Projects Section */}
            {otherProjets.length > 0 && (
              <>
                {(myProjets.length > 0 || managedProjets.length > 0) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Other Projects
                </DropdownMenuLabel>
                {otherProjets.map((projet) => (
                  <DropdownMenuItem
                    key={projet.id}
                    onClick={() => handleProjectSwitch(projet.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Briefcase className="size-3.5 shrink-0" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm truncate">{projet.nom}</span>
                      <span className="text-xs text-muted-foreground">
                        {getStatusBadge(projet.statut)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={handleCreateProject}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Create project
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
