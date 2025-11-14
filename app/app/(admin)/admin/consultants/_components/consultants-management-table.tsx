// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Briefcase, Plus } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { ConsultantFormDialog } from "./consultant-form-dialog";
import { csvFormatters } from "@/lib/utils/csv-export";

export function ConsultantsManagementTable({ initialConsultants, organizations, managers, users }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statuses = ["DISPONIBLE", "EN_MISSION", "INTERCONTRAT", "CONGE", "FORMATION"];
  const statusOptions = statuses.map(s => ({ value: s, label: s.replace(/_/g, " ") }));

  const filteredConsultants = useMemo(() => {
    return initialConsultants.filter((consultant: any) => {
      const matchesSearch = search === "" ||
        consultant.nom.toLowerCase().includes(search.toLowerCase()) ||
        consultant.prenom.toLowerCase().includes(search.toLowerCase()) ||
        consultant.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || consultant.statut === statusFilter;
      const matchesOrg = orgFilter === "all" || consultant.organization_id === orgFilter;

      return matchesSearch && matchesStatus && matchesOrg;
    });
  }, [initialConsultants, search, statusFilter, orgFilter]);

  const paginatedConsultants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredConsultants.slice(start, start + pageSize);
  }, [filteredConsultants, page, pageSize]);

  const csvColumns = [
    { key: "nom", label: "Last Name" },
    { key: "prenom", label: "First Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "statut", label: "Status" },
    { key: "taux_journalier_cout", label: "Daily Rate (Cost)", format: csvFormatters.currency },
    { key: "taux_journalier_vente", label: "Daily Rate (Sell)", format: csvFormatters.currency },
    { key: "date_embauche", label: "Hire Date", format: csvFormatters.date },
    { key: "organization.name", label: "Organization" },
    { key: "manager.nom", label: "Manager Last Name" },
    { key: "manager.prenom", label: "Manager First Name" },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleEdit = (consultant: any) => {
    setSelectedConsultant(consultant);
    setShowEditDialog(true);
  };

  const handleDelete = (consultant: any) => {
    setSelectedConsultant(consultant);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedConsultant) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/consultants/${selectedConsultant.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete consultant");
      toast.success("Consultant deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedConsultant(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", consultant_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete consultants");
      const result = await response.json();
      toast.success(`${result.deleted} consultants deleted`);
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
    toast.success("Consultant saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedConsultant(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "EN_MISSION": return "default";
      case "DISPONIBLE": return "secondary";
      case "INTERCONTRAT": return "outline";
      case "CONGE": return "destructive";
      case "FORMATION": return "secondary";
      default: return "outline";
    }
  };

  if (initialConsultants.length === 0) {
    return <EmptyState icon={Briefcase} title="No consultants" description="Create your first consultant" actionLabel="Add Consultant" onAction={() => setShowCreateDialog(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search consultants..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredConsultants} filename="consultants" columns={csvColumns} />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Consultant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FilterDropdown label="Status" value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
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
                <Checkbox checked={paginatedConsultants.length > 0 && selectedIds.length === paginatedConsultants.length} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedConsultants.length ? [] : paginatedConsultants.map((c: any) => c.id))} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Daily Rate (Cost)</TableHead>
              <TableHead>Daily Rate (Sell)</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedConsultants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No consultants match your filters</TableCell>
              </TableRow>
            ) : (
              paginatedConsultants.map((consultant: any) => (
                <TableRow key={consultant.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(consultant.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(consultant.id) ? prev.filter(id => id !== consultant.id) : [...prev, consultant.id])} />
                  </TableCell>
                  <TableCell className="font-medium">{consultant.prenom} {consultant.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{consultant.email}</TableCell>
                  <TableCell className="text-sm">{consultant.role || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(consultant.statut)}>
                      {consultant.statut?.replace(/_/g, " ") || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{consultant.taux_journalier_cout ? `€${consultant.taux_journalier_cout}` : "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{consultant.taux_journalier_vente ? `€${consultant.taux_journalier_vente}` : "-"}</TableCell>
                  <TableCell className="text-sm">
                    {consultant.manager ? `${consultant.manager.prenom} ${consultant.manager.nom}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm">{consultant.organization?.name || "-"}</TableCell>
                  <TableCell className="text-sm">{consultant.date_embauche ? new Date(consultant.date_embauche).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(consultant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(consultant)}>
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

      {filteredConsultants.length > pageSize && (
        <DataTablePagination currentPage={page} totalPages={Math.ceil(filteredConsultants.length / pageSize)} pageSize={pageSize} totalItems={filteredConsultants.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <ConsultantFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} organizations={organizations} managers={managers} users={users} />
      {selectedConsultant && <ConsultantFormDialog consultant={selectedConsultant} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} organizations={organizations} managers={managers} users={users} />}
      <DeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={confirmDelete} title="Delete Consultant" description="This will delete all associated data." itemName={selectedConsultant ? `${selectedConsultant.prenom} ${selectedConsultant.nom}` : ""} isDeleting={isDeleting} />
      <DeleteConfirmationDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog} onConfirm={handleBulkDelete} title="Delete Multiple Consultants" description={`Delete ${selectedIds.length} consultants?`} isDeleting={isDeleting} />
    </div>
  );
}
