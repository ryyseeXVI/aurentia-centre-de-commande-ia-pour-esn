// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { MessagesManagementTable } from "./_components/messages-management-table";

export default async function AdminMessagesPage() {
  const supabase = await createClient();

  // Get all messages from both tables
  const [{ data: channelMessages }, { data: directMessages }] = await Promise.all([
    supabase.from("channel_messages").select(`
      *,
      sender:profiles!channel_messages_sender_id_fkey(prenom, nom, email)
    `).order("created_at", { ascending: false }).limit(500),
    supabase.from("direct_messages").select(`
      *,
      sender:profiles!direct_messages_sender_id_fkey(prenom, nom, email),
      receiver:profiles!direct_messages_receiver_id_fkey(prenom, nom, email)
    `).order("created_at", { ascending: false }).limit(500),
  ]);

  // Combine and tag messages with their type
  const allMessages = [
    ...(channelMessages || []).map(msg => ({ ...msg, message_type: "channel" })),
    ...(directMessages || []).map(msg => ({ ...msg, message_type: "direct" }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages Moderation</h1>
        <p className="text-muted-foreground">Manage and moderate channel and direct messages</p>
      </div>
      <MessagesManagementTable initialMessages={allMessages} />
    </div>
  );
}
