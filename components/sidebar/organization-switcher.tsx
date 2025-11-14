"use client";

import { Building2, ChevronsUpDown, ExternalLink, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CreateOrganizationDialog } from "@/components/dialogs/create-organization-dialog";
import { JoinOrganizationDialog } from "@/components/dialogs/join-organization-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useWorkspace } from "@/contexts/workspace-context";

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { organizations, currentOrganization, refreshOrganizations, currentWorkspaceId } = useWorkspace();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false);

  // Check if we're currently viewing an organization dashboard
  // Only true if BOTH the URL has an orgId AND the org exists in user's list
  const isViewingOrganization = Boolean(currentWorkspaceId && currentOrganization);

  const handleOrganizationSwitch = (orgId: string) => {
    // Navigate to the new organization's dashboard
    router.push(`/app/organizations/${orgId}`);
  };

  const handleDialogSuccess = async () => {
    await refreshOrganizations();
  };

  // If no organizations, show a simplified view
  if (!organizations || organizations.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Create Organization</span>
              <span className="truncate text-xs text-muted-foreground">Get started</span>
            </div>
            <Plus className="ml-auto size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>

        <CreateOrganizationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onOrganizationCreated={handleDialogSuccess}
        />
      </SidebarMenu>
    );
  }

  // Use first organization if no current org is selected
  const activeOrg = currentOrganization || organizations[0];

  if (!activeOrg) {
    return null;
  }

  // Get role badge text
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "MANAGER":
        return "Manager";
      case "CONSULTANT":
        return "Consultant";
      case "CLIENT":
        return "Client";
      default:
        return role;
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground relative"
              tooltip={isViewingOrganization ? `Viewing: ${currentOrganization?.name}` : "Select organization"}
            >
              {isViewingOrganization && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeOrg.image ? (
                  <img
                    src={activeOrg.image}
                    alt={activeOrg.name}
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrg.name}</span>
                <span className={`truncate text-xs ${isViewingOrganization ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {isViewingOrganization ? '● Active View' : getRoleBadge(activeOrg.role)}
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => {
              const isCurrentlyViewing = currentWorkspaceId === org.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationSwitch(org.id)}
                  className={`gap-2 p-2 ${isCurrentlyViewing ? 'bg-sidebar-accent' : ''}`}
                >
                  <div className={`flex size-6 items-center justify-center rounded-md border ${isCurrentlyViewing ? 'border-primary bg-primary/10' : 'bg-background'}`}>
                    {org.image ? (
                      <img
                        src={org.image}
                        alt={org.name}
                        className="size-6 rounded-md object-cover"
                      />
                    ) : (
                      <Building2 className={`size-3.5 shrink-0 ${isCurrentlyViewing ? 'text-primary' : ''}`} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className={`text-sm ${isCurrentlyViewing ? 'font-semibold' : ''}`}>
                      {org.name}
                      {isCurrentlyViewing && <span className="ml-2 text-primary">●</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleBadge(org.role)}
                    </span>
                  </div>
                  {index < 9 && (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Create organization
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setJoinDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <UserPlus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Join organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Organization Navigation Button - Contextual based on current view */}
      {activeOrg && (
        <SidebarMenuItem>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 px-2 h-8 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            onClick={() => router.push(`/app/organizations/${activeOrg.id}`)}
          >
            <ExternalLink className="size-3.5" />
            <span>
              {isViewingOrganization
                ? "View Organization Dashboard"
                : `Go to ${activeOrg.name}`}
            </span>
          </Button>
        </SidebarMenuItem>
      )}

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onOrganizationCreated={handleDialogSuccess}
      />

      <JoinOrganizationDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onOrganizationJoined={handleDialogSuccess}
      />
    </SidebarMenu>
  );
}
