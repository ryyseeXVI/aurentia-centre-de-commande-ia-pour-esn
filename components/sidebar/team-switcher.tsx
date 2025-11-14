"use client";

import { ChevronsUpDown, Plus, UserPlus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { CreateOrganizationDialog } from "@/components/dialogs/create-organization-dialog";
import { JoinOrganizationDialog } from "@/components/dialogs/join-organization-dialog";
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

export function TeamSwitcher({
  teams,
  currentTeamId,
  onOrganizationCreated,
}: {
  teams: {
    id: string;
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
  currentTeamId?: string;
  onOrganizationCreated?: () => void;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false);

  // Find active team based on currentTeamId or default to first
  const activeTeam = React.useMemo(() => {
    if (currentTeamId) {
      return teams.find((team) => team.id === currentTeamId) || teams[0];
    }
    return teams[0];
  }, [teams, currentTeamId]);

  if (!activeTeam) {
    return null;
  }

  const handleTeamSwitch = (teamId: string) => {
    // Navigate to the same page but in the new workspace
    const pathParts = pathname?.split("/") || [];
    const currentPage = pathParts.slice(3).join("/"); // Get everything after /app/[workspaceId]

    router.push(`/app/${teamId}${currentPage ? `/${currentPage}` : ""}`);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamSwitch(team.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setJoinDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <UserPlus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Join team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onOrganizationCreated={onOrganizationCreated}
      />

      <JoinOrganizationDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onOrganizationJoined={onOrganizationCreated}
      />
    </SidebarMenu>
  );
}
