// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { ChannelsManagementTable } from "./_components/channels-management-table";

export default async function AdminChannelsPage() {
  const supabase = await createClient();

  // Get all channels from both tables
  const [{ data: orgChannels }, { data: projectChannels }] = await Promise.all([
    supabase.from("organization_channels").select(`
      *,
      organization:organizations(name),
      created_by_user:profiles!organization_channels_created_by_fkey(prenom, nom, email)
    `).order("created_at", { ascending: false }),
    supabase.from("project_channels").select(`
      *,
      project:projet(nom),
      created_by_user:profiles!project_channels_created_by_fkey(prenom, nom, email)
    `).order("created_at", { ascending: false }),
  ]);

  // Combine and tag channels with their type
  const allChannels = [
    ...(orgChannels || []).map(ch => ({ ...ch, channel_type: "organization" })),
    ...(projectChannels || []).map(ch => ({ ...ch, channel_type: "project" }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Channels Moderation</h1>
        <p className="text-muted-foreground">Manage and moderate organization and project channels</p>
      </div>
      <ChannelsManagementTable initialChannels={allChannels} />
    </div>
  );
}
