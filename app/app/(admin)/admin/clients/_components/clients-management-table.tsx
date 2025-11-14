// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, Briefcase, Plus } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { ClientFormDialog } from "./client-form-dialog";
import { csvFormatters } from "@/lib/utils/csv-export";

export function ClientsManagementTable({ initialClients, organizations, users }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sectors = Array.from(new Set(initialClients.map((c: any) => c.secteur).filter(Boolean)));
  const sectorOptions = sectors.map(s => ({ value: s, label: s }));

  const filteredClients = useMemo(() => {
    return initialClients.filter((client: any) => {
      const matchesSearch = search === "" ||
        client.nom.toLowerCase().includes(search.toLowerCase()) ||
        client.contact_principal?.toLowerCase().includes(search.toLowerCase()) ||
        client.secteur?.toLowerCase().includes(search.toLowerCase());

      const matchesSector = sectorFilter === "all" || client.secteur === sectorFilter;
      const matchesOrg = orgFilter === "all" || client.organization_id === orgFilter;

      return matchesSearch && matchesSector && matchesOrg;
    });
  }, [initialClients, search, sectorFilter, orgFilter]);

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, page, pageSize]);

  const csvColumns = [
    { key: "nom", label: "Name" },
    { key: "contact_principal", label: "Contact" },
    { key: "secteur", label: "Sector" },
    { key: "organization.name", label: "Organization" },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  const handleDelete = (client: any) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/clients/${selectedClient.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete client");
      toast.success("Client deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedClient(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", client_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete clients");
      const result = await response.json();
      toast.success(`${result.deleted} clients deleted`);
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
    toast.success("Client saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedClient(null);
  };

  if (initialClients.length === 0) {
    return <EmptyState icon={Briefcase} title="No clients" description="Create your first client" actionLabel="Add Client" onAction={() => setShowCreateDialog(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search clients..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredClients} filename="clients" columns={csvColumns} />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FilterDropdown label="Sector" value={sectorFilter} onValueChange={setSectorFilter} options={sectorOptions} />
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
                <Checkbox checked={paginatedClients.length > 0 && selectedIds.length === paginatedClients.length} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedClients.length ? [] : paginatedClients.map((c: any) => c.id))} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No clients match your filters</TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(client.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(client.id) ? prev.filter(id => id !== client.id) : [...prev, client.id])} />
                  </TableCell>
                  <TableCell className="font-medium">{client.nom}</TableCell>
                  <TableCell>{client.contact_principal || "-"}</TableCell>
                  <TableCell>{client.secteur || "-"}</TableCell>
                  <TableCell>{client.organization?.name || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(client)}>
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

      {filteredClients.length > pageSize && (
        <DataTablePagination currentPage={page} totalPages={Math.ceil(filteredClients.length / pageSize)} pageSize={pageSize} totalItems={filteredClients.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <ClientFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} organizations={organizations} users={users} />
      {selectedClient && <ClientFormDialog client={selectedClient} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} organizations={organizations} users={users} />}
      <DeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={confirmDelete} title="Delete Client" description="This will delete all associated data." itemName={selectedClient?.nom} isDeleting={isDeleting} />
      <DeleteConfirmationDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog} onConfirm={handleBulkDelete} title="Delete Multiple Clients" description={`Delete ${selectedIds.length} clients?`} isDeleting={isDeleting} />
    </div>
  );
}
