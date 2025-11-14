"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { ProjectProviderWrapper } from "@/contexts/project-provider-wrapper";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { usePresence } from "@/hooks/use-presence";

function PresenceTracker() {
  usePresence();
  return null;
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ProjectProviderWrapper>
          <NotificationsProvider>
            <TooltipProvider>
              <SidebarProvider>
                <PresenceTracker />
                <AppSidebar />
                <SidebarInset>
                  <AppHeader />
                  <div className="flex-1">{children}</div>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </NotificationsProvider>
        </ProjectProviderWrapper>
      </WorkspaceProvider>
      <Toaster />
    </AuthProvider>
  );
}
