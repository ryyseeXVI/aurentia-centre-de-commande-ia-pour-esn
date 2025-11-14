// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Bell, Plus } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { NotificationFormDialog } from "./notification-form-dialog";
import { csvFormatters } from "@/lib/utils/csv-export";

export function NotificationsManagementTable({ initialNotifications, organizations, users }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const types = ["INFO", "SUCCESS", "WARNING", "ERROR", "TASK_ASSIGNED", "TASK_COMPLETED", "PROJECT_UPDATE", "MILESTONE_REACHED", "SYSTEM"];
  const typeOptions = types.map(t => ({ value: t, label: t.replace(/_/g, " ") }));
  const readOptions = [
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
  ];

  const filteredNotifications = useMemo(() => {
    return initialNotifications.filter((notification: any) => {
      const matchesSearch = search === "" ||
        notification.title.toLowerCase().includes(search.toLowerCase()) ||
        notification.message?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || notification.type === typeFilter;
      const matchesRead = readFilter === "all" ||
        (readFilter === "read" && notification.read_at) ||
        (readFilter === "unread" && !notification.read_at);
      const matchesOrg = orgFilter === "all" || notification.organization_id === orgFilter;

      return matchesSearch && matchesType && matchesRead && matchesOrg;
    });
  }, [initialNotifications, search, typeFilter, readFilter, orgFilter]);

  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, page, pageSize]);

  const csvColumns = [
    { key: "user.prenom", label: "First Name" },
    { key: "user.nom", label: "Last Name" },
    { key: "user.email", label: "Email" },
    { key: "type", label: "Type" },
    { key: "title", label: "Title" },
    { key: "message", label: "Message" },
    { key: "organization.name", label: "Organization" },
    { key: "read_at", label: "Read At", format: csvFormatters.date },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleEdit = (notification: any) => {
    setSelectedNotification(notification);
    setShowEditDialog(true);
  };

  const handleDelete = (notification: any) => {
    setSelectedNotification(notification);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedNotification) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/notifications/${selectedNotification.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete notification");
      toast.success("Notification deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedNotification(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", notification_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete notifications");
      const result = await response.json();
      toast.success(`${result.deleted} notifications deleted`);
      setSelectedIds([]);
      router.refresh();
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    toast.success("Notification saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedNotification(null);
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "SUCCESS": return "default";
      case "INFO": return "outline";
      case "WARNING": return "secondary";
      case "ERROR": return "destructive";
      default: return "outline";
    }
  };

  if (initialNotifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications" description="Create your first notification or broadcast" actionLabel="Add Notification" onAction={() => setShowCreateDialog(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search notifications..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredNotifications} filename="notifications" columns={csvColumns} />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Notification
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <FilterDropdown label="Type" value={typeFilter} onValueChange={setTypeFilter} options={typeOptions} />
        <FilterDropdown label="Status" value={readFilter} onValueChange={setReadFilter} options={readOptions} />
        <FilterDropdown label="Organization" value={orgFilter} onValueChange={setOrgFilter} options={organizations.map((o: any) => ({ value: o.id, label: o.name }))} />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsToolbar selectedCount={selectedIds.length} onClearSelection={() => setSelectedIds([])} onDelete={() => setShowBulkDeleteDialog(true)} />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={paginatedNotifications.length > 0 && selectedIds.length === paginatedNotifications.length} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedNotifications.length ? [] : paginatedNotifications.map((n: any) => n.id))} />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No notifications match your filters</TableCell>
              </TableRow>
            ) : (
              paginatedNotifications.map((notification: any) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(notification.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(notification.id) ? prev.filter(id => id !== notification.id) : [...prev, notification.id])} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {notification.user ? `${notification.user.prenom} ${notification.user.nom}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(notification.type)}>
                      {notification.type?.replace(/_/g, " ") || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">{notification.title}</TableCell>
                  <TableCell className="text-sm max-w-md truncate">{notification.message || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={notification.read_at ? "secondary" : "default"}>
                      {notification.read_at ? "Read" : "Unread"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{notification.created_at ? new Date(notification.created_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(notification)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(notification)}>
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

      {filteredNotifications.length > pageSize && (
        <DataTablePagination currentPage={page} totalPages={Math.ceil(filteredNotifications.length / pageSize)} pageSize={pageSize} totalItems={filteredNotifications.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <NotificationFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} organizations={organizations} users={users} />
      {selectedNotification && <NotificationFormDialog notification={selectedNotification} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} organizations={organizations} users={users} />}
      <DeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={confirmDelete} title="Delete Notification" description="This will permanently delete the notification." itemName={selectedNotification?.title} isDeleting={isDeleting} />
      <DeleteConfirmationDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog} onConfirm={handleBulkDelete} title="Delete Multiple Notifications" description={`Delete ${selectedIds.length} notifications?`} isDeleting={isDeleting} />
    </div>
  );
}
