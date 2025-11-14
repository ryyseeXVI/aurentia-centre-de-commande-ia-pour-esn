// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Flag, Plus } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { MilestoneFormDialog } from "./milestone-form-dialog";
import { csvFormatters } from "@/lib/utils/csv-export";

export function MilestonesManagementTable({ initialMilestones, organizations, projects }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statuses = ["A_VENIR", "EN_COURS", "TERMINE", "RETARD"];
  const statusOptions = statuses.map(s => ({ value: s, label: s.replace(/_/g, " ") }));

  const filteredMilestones = useMemo(() => {
    return initialMilestones.filter((milestone: any) => {
      const matchesSearch = search === "" ||
        milestone.nom.toLowerCase().includes(search.toLowerCase()) ||
        milestone.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || milestone.statut === statusFilter;
      const matchesProject = projectFilter === "all" || milestone.projet_id === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [initialMilestones, search, statusFilter, projectFilter]);

  const paginatedMilestones = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMilestones.slice(start, start + pageSize);
  }, [filteredMilestones, page, pageSize]);

  const csvColumns = [
    { key: "nom", label: "Milestone Name" },
    { key: "description", label: "Description" },
    { key: "statut", label: "Status" },
    { key: "priorite", label: "Priority" },
    { key: "projet.nom", label: "Project" },
    { key: "date_debut", label: "Start Date", format: csvFormatters.date },
    { key: "date_fin", label: "End Date", format: csvFormatters.date },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleEdit = (milestone: any) => {
    setSelectedMilestone(milestone);
    setShowEditDialog(true);
  };

  const handleDelete = (milestone: any) => {
    setSelectedMilestone(milestone);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedMilestone) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/milestones/${selectedMilestone.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete milestone");
      toast.success("Milestone deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedMilestone(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", milestone_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete milestones");
      const result = await response.json();
      toast.success(`${result.deleted} milestones deleted`);
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
    toast.success("Milestone saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedMilestone(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "A_VENIR": return "outline";
      case "EN_COURS": return "default";
      case "TERMINE": return "secondary";
      case "RETARD": return "destructive";
      default: return "outline";
    }
  };

  if (initialMilestones.length === 0) {
    return <EmptyState icon={Flag} title="No milestones" description="Create your first milestone" actionLabel="Add Milestone" onAction={() => setShowCreateDialog(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search milestones..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredMilestones} filename="milestones" columns={csvColumns} />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FilterDropdown label="Status" value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
        <FilterDropdown label="Project" value={projectFilter} onValueChange={setProjectFilter} options={projects.map((p: any) => ({ value: p.id, label: p.nom }))} />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsToolbar selectedCount={selectedIds.length} onClearSelection={() => setSelectedIds([])} onDelete={() => setShowBulkDeleteDialog(true)} />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={paginatedMilestones.length > 0 && selectedIds.length === paginatedMilestones.length} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedMilestones.length ? [] : paginatedMilestones.map((m: any) => m.id))} />
              </TableHead>
              <TableHead>Milestone Name</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMilestones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No milestones match your filters</TableCell>
              </TableRow>
            ) : (
              paginatedMilestones.map((milestone: any) => (
                <TableRow key={milestone.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(milestone.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(milestone.id) ? prev.filter(id => id !== milestone.id) : [...prev, milestone.id])} />
                  </TableCell>
                  <TableCell className="font-medium">{milestone.nom}</TableCell>
                  <TableCell className="text-sm">{milestone.projet?.nom || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(milestone.statut)}>
                      {milestone.statut?.replace(/_/g, " ") || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{milestone.priorite || "-"}</TableCell>
                  <TableCell className="text-sm">{milestone.date_debut ? new Date(milestone.date_debut).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-sm">{milestone.date_fin ? new Date(milestone.date_fin).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    {milestone.couleur ? (
                      <div className="w-6 h-6 rounded border-2" style={{ backgroundColor: milestone.couleur }} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(milestone)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(milestone)}>
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

      {filteredMilestones.length > pageSize && (
        <DataTablePagination currentPage={page} totalPages={Math.ceil(filteredMilestones.length / pageSize)} pageSize={pageSize} totalItems={filteredMilestones.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <MilestoneFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} organizations={organizations} projects={projects} />
      {selectedMilestone && <MilestoneFormDialog milestone={selectedMilestone} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} organizations={organizations} projects={projects} />}
      <DeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={confirmDelete} title="Delete Milestone" description="This will permanently delete the milestone." itemName={selectedMilestone?.nom} isDeleting={isDeleting} />
      <DeleteConfirmationDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog} onConfirm={handleBulkDelete} title="Delete Multiple Milestones" description={`Delete ${selectedIds.length} milestones?`} isDeleting={isDeleting} />
    </div>
  );
}
