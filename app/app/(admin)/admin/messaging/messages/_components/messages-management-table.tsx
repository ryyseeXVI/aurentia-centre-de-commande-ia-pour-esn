// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, MessageSquare } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { csvFormatters } from "@/lib/utils/csv-export";

export function MessagesManagementTable({ initialMessages }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeOptions = [
    { value: "channel", label: "Channel Message" },
    { value: "direct", label: "Direct Message" },
  ];

  const filteredMessages = useMemo(() => {
    return initialMessages.filter((message: any) => {
      const matchesSearch = search === "" ||
        message.content?.toLowerCase().includes(search.toLowerCase()) ||
        message.sender?.prenom?.toLowerCase().includes(search.toLowerCase()) ||
        message.sender?.nom?.toLowerCase().includes(search.toLowerCase()) ||
        message.sender?.email?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || message.message_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [initialMessages, search, typeFilter]);

  const paginatedMessages = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMessages.slice(start, start + pageSize);
  }, [filteredMessages, page, pageSize]);

  const csvColumns = [
    { key: "sender.prenom", label: "Sender First Name" },
    { key: "sender.nom", label: "Sender Last Name" },
    { key: "sender.email", label: "Sender Email" },
    { key: "receiver.prenom", label: "Receiver First Name" },
    { key: "receiver.nom", label: "Receiver Last Name" },
    { key: "receiver.email", label: "Receiver Email" },
    { key: "content", label: "Content" },
    { key: "message_type", label: "Type" },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleDelete = (message: any) => {
    setSelectedMessage(message);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedMessage) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/messaging/messages/${selectedMessage.id}?message_type=${selectedMessage.message_type}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete message");
      toast.success("Message deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedMessage(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    // Group selected messages by type
    const messagesByType = selectedIds.reduce((acc: any, id: string) => {
      const message = initialMessages.find((msg: any) => msg.id === id);
      if (message) {
        const type = message.message_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(id);
      }
      return acc;
    }, {});

    setIsDeleting(true);
    try {
      // Delete messages by type
      for (const [messageType, ids] of Object.entries(messagesByType)) {
        const response = await fetch("/api/admin/messaging/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "bulk_delete",
            message_ids: ids,
            message_type: messageType,
          }),
        });
        if (!response.ok) throw new Error(`Failed to delete ${messageType} messages`);
      }

      toast.success(`${selectedIds.length} messages deleted`);
      setSelectedIds([]);
      router.refresh();
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (initialMessages.length === 0) {
    return <EmptyState icon={MessageSquare} title="No messages" description="No messages have been sent yet" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search messages..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredMessages} filename="messages" columns={csvColumns} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FilterDropdown label="Type" value={typeFilter} onValueChange={setTypeFilter} options={typeOptions} />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onDelete={() => setShowBulkDeleteDialog(true)}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedMessages.length > 0 && selectedIds.length === paginatedMessages.length}
                  onCheckedChange={() =>
                    setSelectedIds(
                      selectedIds.length === paginatedMessages.length
                        ? []
                        : paginatedMessages.map((msg: any) => msg.id)
                    )
                  }
                />
              </TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No messages match your filters
                </TableCell>
              </TableRow>
            ) : (
              paginatedMessages.map((message: any) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(message.id)}
                      onCheckedChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(message.id)
                            ? prev.filter((id) => id !== message.id)
                            : [...prev, message.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {message.sender
                      ? `${message.sender.prenom} ${message.sender.nom}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {message.message_type === "direct" && message.receiver
                      ? `${message.receiver.prenom} ${message.receiver.nom}`
                      : message.message_type === "channel"
                      ? "Channel"
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium max-w-md truncate">
                    {message.content || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={message.message_type === "channel" ? "default" : "secondary"}>
                      {message.message_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {message.created_at ? new Date(message.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(message)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredMessages.length > pageSize && (
        <DataTablePagination
          currentPage={page}
          totalPages={Math.ceil(filteredMessages.length / pageSize)}
          pageSize={pageSize}
          totalItems={filteredMessages.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Message"
        description="This will permanently delete the message."
        itemName={selectedMessage?.content?.substring(0, 50)}
        isDeleting={isDeleting}
      />
      <DeleteConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Messages"
        description={`Delete ${selectedIds.length} messages?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
