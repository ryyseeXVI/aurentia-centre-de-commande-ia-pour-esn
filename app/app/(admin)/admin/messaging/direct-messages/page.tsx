// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminDirectMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("direct_messages")
    .select("*, sender:profiles!direct_messages_sender_id_fkey(prenom, nom), recipient:profiles!direct_messages_recipient_id_fkey(prenom, nom)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Direct Messages</h1>
        <p className="text-muted-foreground">Monitor private messaging activity</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages?.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell>{m.sender ? `${m.sender.prenom} ${m.sender.nom}` : "-"}</TableCell>
                <TableCell>{m.recipient ? `${m.recipient.prenom} ${m.recipient.nom}` : "-"}</TableCell>
                <TableCell className="max-w-xs truncate text-sm">{m.content}</TableCell>
                <TableCell>
                  <Badge variant={m.read_at ? "secondary" : "default"}>{m.read_at ? "Read" : "Unread"}</Badge>
                </TableCell>
                <TableCell className="text-sm">{new Date(m.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
