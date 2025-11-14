"use client";

import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Shield,
  User,
  Users,
  Database,
  UserCog,
  Briefcase,
  UserCheck,
  FolderKanban,
  CheckSquare,
  Target,
  MessagesSquare,
  Activity,
  Bell,
} from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { OrganizationSwitcher } from "@/components/sidebar/organization-switcher";
import { ProjectSwitcher } from "@/components/sidebar/project-switcher";
import NotificationsDropdown from "@/components/navbar/notifications-dropdown";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  // Navigation configuration for ESN application
  const navMainConfig = React.useMemo(() => {
    const platformItems = [
      {
        title: "Dashboard",
        url: "/app",
        icon: LayoutDashboard,
        isActive: pathname === "/app",
      },
      {
        title: "Client Organizations",
        url: "/app/organizations",
        icon: Building2,
        isActive: pathname?.startsWith("/app/organizations"),
      },
      {
        title: "Analytics",
        url: "/app/analytics",
        icon: BarChart3,
        isActive: pathname?.startsWith("/app/analytics"),
      },
      {
        title: "Team Chat",
        url: "/app/chat",
        icon: MessageSquare,
        isActive: pathname === "/app/chat",
      },
      {
        title: "Profile",
        url: "/app/profile",
        icon: User,
        isActive: pathname === "/app/profile",
      },
    ];

    return platformItems;
  }, [pathname]);

  // Backoffice navigation for ADMIN users
  const backofficeConfig = React.useMemo(() => {
    if (profile?.role !== "ADMIN") return null;

    return [
      {
        title: "Admin Dashboard",
        url: "/app/admin",
        icon: LayoutDashboard,
        isActive: pathname === "/app/admin",
      },
      {
        title: "Entity Management",
        url: "/app/admin/users",
        icon: Database,
        isActive: pathname?.startsWith("/app/admin/users") ||
          pathname?.startsWith("/app/admin/organizations") ||
          pathname?.startsWith("/app/admin/consultants") ||
          pathname?.startsWith("/app/admin/clients"),
        items: [
          {
            title: "Users",
            url: "/app/admin/users",
          },
          {
            title: "Organizations",
            url: "/app/admin/organizations",
          },
          {
            title: "Consultants",
            url: "/app/admin/consultants",
          },
          {
            title: "Clients",
            url: "/app/admin/clients",
          },
        ],
      },
      {
        title: "Project Management",
        url: "/app/admin/projects",
        icon: FolderKanban,
        isActive: pathname?.startsWith("/app/admin/projects") ||
          pathname?.startsWith("/app/admin/tasks") ||
          pathname?.startsWith("/app/admin/milestones"),
        items: [
          {
            title: "Projects",
            url: "/app/admin/projects",
          },
          {
            title: "Tasks",
            url: "/app/admin/tasks",
          },
          {
            title: "Milestones",
            url: "/app/admin/milestones",
          },
        ],
      },
      {
        title: "Messaging",
        url: "/app/admin/messaging",
        icon: MessagesSquare,
        isActive: pathname?.startsWith("/app/admin/messaging"),
        items: [
          {
            title: "Overview",
            url: "/app/admin/messaging",
          },
          {
            title: "Channels",
            url: "/app/admin/messaging/channels",
          },
          {
            title: "Direct Messages",
            url: "/app/admin/messaging/direct-messages",
          },
        ],
      },
      {
        title: "System",
        url: "/app/admin/activity-logs",
        icon: Shield,
        isActive: pathname?.startsWith("/app/admin/activity-logs") ||
          pathname?.startsWith("/app/admin/notifications"),
        items: [
          {
            title: "Activity Logs",
            url: "/app/admin/activity-logs",
          },
          {
            title: "Notifications",
            url: "/app/admin/notifications",
          },
        ],
      },
    ];
  }, [pathname, profile]);

  // Format user data for NavUser
  const userData = {
    name: profile?.prenom && profile?.nom
      ? `${profile.prenom} ${profile.nom}`
      : user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    avatar: profile?.avatar_url || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex-1">
            <OrganizationSwitcher />
          </div>
          <NotificationsDropdown />
        </div>
        <SidebarSeparator className="mx-0" />
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainConfig} groupLabel="Platform" />
        {backofficeConfig && (
          <>
            <SidebarSeparator className="my-2" />
            <NavMain items={backofficeConfig} groupLabel="Backoffice" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
