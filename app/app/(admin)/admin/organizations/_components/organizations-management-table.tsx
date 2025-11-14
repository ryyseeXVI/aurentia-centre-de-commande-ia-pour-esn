"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, Building2 } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { OrganizationFormDialog } from "./organization-form-dialog";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function OrganizationsManagementTable({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const searchLower = search.toLowerCase();
      return org.name.toLowerCase().includes(searchLower) || org.slug.toLowerCase().includes(searchLower);
    });
  }, [organizations, search]);

  const totalPages = Math.ceil(filteredOrganizations.length / pageSize);
  const paginatedOrganizations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrganizations.slice(start, start + pageSize);
  }, [filteredOrganizations, page, pageSize]);

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === paginatedOrganizations.length ? [] : paginatedOrganizations.map((o) => o.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setShowEditDialog(true);
  };

  const handleDelete = (org: Organization) => {
    setSelectedOrg(org);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrg) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete organization");
      toast.success("Organization deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedOrg(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", organization_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete organizations");
      const result = await response.json();
      toast.success(`${result.deleted} organizations deleted`);
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
    toast.success("Organization saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedOrg(null);
  };

  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No organizations found"
        description="Create your first organization to get started"
        actionLabel="Add Organization"
        onAction={() => setShowCreateDialog(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => setShowCreateDialog(true)}
        addLabel="Add Organization"
        placeholder="Search organizations..."
      />

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
                <Checkbox checked={paginatedOrganizations.length > 0 && selectedIds.length === paginatedOrganizations.length} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No organizations match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(org.id)} onCheckedChange={() => toggleSelect(org.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{org.slug}</TableCell>
                  <TableCell className="text-sm">{org.description || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(org)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(org)}>
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

      {filteredOrganizations.length > pageSize && (
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredOrganizations.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <OrganizationFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} />
      {selectedOrg && (
        <OrganizationFormDialog organization={selectedOrg} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} />
      )}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Organization"
        description="This will delete all associated data including projects, consultants, and users."
        itemName={selectedOrg?.name}
        isDeleting={isDeleting}
      />
      <DeleteConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Organizations"
        description={`Delete ${selectedIds.length} organizations and all their data?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
