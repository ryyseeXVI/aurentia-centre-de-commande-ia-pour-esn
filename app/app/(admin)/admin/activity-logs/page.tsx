// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { Activity } from "lucide-react";
import { ActivityLogsManagementTable } from "./_components/activity-logs-management-table";

/**
 * Admin Activity Logs Page
 *
 * Comprehensive audit trail of all administrative actions across the platform.
 * Features search, filtering, pagination, and CSV export.
 */
export default async function AdminActivityLogsPage() {
  const supabase = await createClient();

  // Fetch all activity logs (no longer limited to 200)
  // Client-side pagination will handle large datasets
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, user:profiles(prenom, nom)")
    .order("created_at", { ascending: false });

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Activity Logs"
        description="Complete audit trail of all administrative actions and system events across the platform"
        icon={Activity}
        badge={{
          label: `${logs?.length || 0} logs`,
          variant: "secondary",
        }}
      />

      <ActivityLogsManagementTable initialLogs={logs || []} />
    </AdminPageContainer>
  );
}
