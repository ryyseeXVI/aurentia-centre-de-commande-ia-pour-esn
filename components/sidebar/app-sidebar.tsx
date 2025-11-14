"use client";

import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Shield,
  User,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { OrganizationSwitcher } from "@/components/sidebar/organization-switcher";
import { ProjectSwitcher } from "@/components/sidebar/project-switcher";
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
    const items = [
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
        title: "Consultants",
        url: "/app/consultants",
        icon: Users,
        isActive: pathname?.startsWith("/app/consultants"),
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

    // Add Admin link for ADMIN users
    if (profile?.role === "ADMIN") {
      items.push({
        title: "Admin",
        url: "/app/admin",
        icon: Shield,
        isActive: pathname === "/app/admin",
      });
    }

    return items;
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
        <OrganizationSwitcher />
        <SidebarSeparator className="mx-0" />
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainConfig} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
