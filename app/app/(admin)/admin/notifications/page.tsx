// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Manage and broadcast system notifications</p>
      </div>
      <NotificationsManagementTable
        initialNotifications={notifications || []}
        organizations={organizations || []}
        users={users || []}
      />
    </div>
  );
}
