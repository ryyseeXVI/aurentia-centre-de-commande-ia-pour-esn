// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { NotificationsManagementTable } from "./_components/notifications-management-table";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const [{ data: notifications }, { data: organizations }, { data: users }] = await Promise.all([
    supabase.from("notification").select(`
      *,
      user:profiles!notification_user_id_fkey(id, prenom, nom, email),
      organization:organizations(name)
    `).order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("profiles").select("id, prenom, nom, email").order("prenom, nom"),
  ]);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Notifications"
        description="Manage and broadcast system-wide notifications to users and organizations"
        icon={Bell}
        badge={{
          label: `${notifications?.length || 0} notifications`,
          variant: "secondary"
        }}
      />

      <NotificationsManagementTable
        initialNotifications={notifications || []}
        organizations={organizations || []}
        users={users || []}
      />
    </AdminPageContainer>
  );
}
