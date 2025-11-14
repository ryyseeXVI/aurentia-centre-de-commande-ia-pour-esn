// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Hash, Mail, MessagesSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";

export default async function AdminMessagingPage() {
  const supabase = await createClient();

  const [{ count: channelMessagesCount }, { count: directMessagesCount }, { count: channelsCount }] = await Promise.all([
    supabase.from("channel_messages").select("*", { count: "exact", head: true }),
    supabase.from("direct_messages").select("*", { count: "exact", head: true }),
    supabase.from("organization_channels").select("*", { count: "exact", head: true }),
  ]);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Messaging Overview"
        description="Monitor messaging activity, channels, and conversations across the platform"
        icon={MessageSquare}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Active channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" />
              Channel Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelMessagesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total channel messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Direct Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{directMessagesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Private messages</p>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
