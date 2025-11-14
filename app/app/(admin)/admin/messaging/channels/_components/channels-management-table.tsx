// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Hash } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { csvFormatters } from "@/lib/utils/csv-export";

export function ChannelsManagementTable({ initialChannels }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeOptions = [
    { value: "organization", label: "Organization" },
    { value: "project", label: "Project" },
  ];

  const filteredChannels = useMemo(() => {
    return initialChannels.filter((channel: any) => {
      const matchesSearch = search === "" ||
        channel.name?.toLowerCase().includes(search.toLowerCase()) ||
        channel.description?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || channel.channel_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [initialChannels, search, typeFilter]);

  const paginatedChannels = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, page, pageSize]);

  const csvColumns = [
    { key: "name", label: "Channel Name" },
    { key: "description", label: "Description" },
    { key: "channel_type", label: "Type" },
    { key: "organization.name", label: "Organization" },
    { key: "project.nom", label: "Project" },
    { key: "created_by_user.prenom", label: "Creator First Name" },
    { key: "created_by_user.nom", label: "Creator Last Name" },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleDelete = (channel: any) => {
    setSelectedChannel(channel);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedChannel) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/messaging/channels/${selectedChannel.id}?channel_type=${selectedChannel.channel_type}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete channel");
      toast.success("Channel deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedChannel(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    // Group selected channels by type
    const channelsByType = selectedIds.reduce((acc: any, id: string) => {
      const channel = initialChannels.find((ch: any) => ch.id === id);
      if (channel) {
        const type = channel.channel_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(id);
      }
      return acc;
    }, {});

    setIsDeleting(true);
    try {
      // Delete channels by type
      for (const [channelType, ids] of Object.entries(channelsByType)) {
        const response = await fetch("/api/admin/messaging/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "bulk_delete",
            channel_ids: ids,
            channel_type: channelType,
          }),
        });
        if (!response.ok) throw new Error(`Failed to delete ${channelType} channels`);
      }

      toast.success(`${selectedIds.length} channels deleted`);
      setSelectedIds([]);
      router.refresh();
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (initialChannels.length === 0) {
    return <EmptyState icon={Hash} title="No channels" description="No channels have been created yet" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search channels..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredChannels} filename="channels" columns={csvColumns} />
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
                  checked={paginatedChannels.length > 0 && selectedIds.length === paginatedChannels.length}
                  onCheckedChange={() =>
                    setSelectedIds(
                      selectedIds.length === paginatedChannels.length
                        ? []
                        : paginatedChannels.map((ch: any) => ch.id)
                    )
                  }
                />
              </TableHead>
              <TableHead>Channel Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Organization/Project</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChannels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No channels match your filters
                </TableCell>
              </TableRow>
            ) : (
              paginatedChannels.map((channel: any) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(channel.id)}
                      onCheckedChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(channel.id)
                            ? prev.filter((id) => id !== channel.id)
                            : [...prev, channel.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <Badge variant={channel.channel_type === "organization" ? "default" : "secondary"}>
                      {channel.channel_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {channel.channel_type === "organization"
                      ? channel.organization?.name || "-"
                      : channel.project?.nom || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {channel.created_by_user
                      ? `${channel.created_by_user.prenom} ${channel.created_by_user.nom}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {channel.created_at ? new Date(channel.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(channel)}>
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

      {filteredChannels.length > pageSize && (
        <DataTablePagination
          currentPage={page}
          totalPages={Math.ceil(filteredChannels.length / pageSize)}
          pageSize={pageSize}
          totalItems={filteredChannels.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Channel"
        description="This will permanently delete the channel and all its messages."
        itemName={selectedChannel?.name}
        isDeleting={isDeleting}
      />
      <DeleteConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Channels"
        description={`Delete ${selectedIds.length} channels and all their messages?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
