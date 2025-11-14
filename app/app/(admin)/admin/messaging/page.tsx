// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, Hash, Mail } from "lucide-react";

export default async function AdminMessagingPage() {
  const supabase = await createClient();

  const [{ count: channelMessagesCount }, { count: directMessagesCount }, { count: channelsCount }] = await Promise.all([
    supabase.from("channel_messages").select("*", { count: "exact", head: true }),
    supabase.from("direct_messages").select("*", { count: "exact", head: true }),
    supabase.from("organization_channels").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messaging Overview</h1>
        <p className="text-muted-foreground">Monitor messaging activity across the platform</p>
      </div>
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
    </div>
  );
}
