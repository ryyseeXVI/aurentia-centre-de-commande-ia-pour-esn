// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, CheckSquare, Plus } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { TaskFormDialog } from "./task-form-dialog";
import { BulkAssignDialog } from "./bulk-assign-dialog";
import { csvFormatters } from "@/lib/utils/csv-export";

export function TasksManagementTable({ initialTasks, organizations, projects, milestones, assignees }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statuses = ["A_FAIRE", "EN_COURS", "EN_REVUE", "TERMINE", "BLOQUE"];
  const priorities = ["BASSE", "MOYENNE", "HAUTE", "CRITIQUE"];
  const statusOptions = statuses.map(s => ({ value: s, label: s.replace(/_/g, " ") }));
  const priorityOptions = priorities.map(p => ({ value: p, label: p }));

  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task: any) => {
      const matchesSearch = search === "" ||
        task.nom.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || task.statut === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priorite === priorityFilter;
      const matchesProject = projectFilter === "all" || task.projet_id === projectFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [initialTasks, search, statusFilter, priorityFilter, projectFilter]);

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page, pageSize]);

  const csvColumns = [
    { key: "nom", label: "Task Name" },
    { key: "description", label: "Description" },
    { key: "statut", label: "Status" },
    { key: "priorite", label: "Priority" },
    { key: "projet.nom", label: "Project" },
    { key: "milestone.nom", label: "Milestone" },
    { key: "responsable.nom", label: "Assignee Last Name" },
    { key: "responsable.prenom", label: "Assignee First Name" },
    { key: "date_debut", label: "Start Date", format: csvFormatters.date },
    { key: "date_fin", label: "Due Date", format: csvFormatters.date },
    { key: "charge_estimee", label: "Estimated Hours" },
    { key: "tags", label: "Tags", format: csvFormatters.array },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleEdit = (task: any) => {
    setSelectedTask(task);
    setShowEditDialog(true);
  };

  const handleDelete = (task: any) => {
    setSelectedTask(task);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/tasks/${selectedTask.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete task");
      toast.success("Task deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedTask(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", task_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete tasks");
      const result = await response.json();
      toast.success(`${result.deleted} tasks deleted`);
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
    toast.success("Task saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedTask(null);
  };

  const handleBulkAssignSuccess = () => {
    toast.success("Tasks assigned successfully");
    router.refresh();
    setShowBulkAssignDialog(false);
    setSelectedIds([]);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "A_FAIRE": return "outline";
      case "EN_COURS": return "default";
      case "EN_REVUE": return "secondary";
      case "TERMINE": return "secondary";
      case "BLOQUE": return "destructive";
      default: return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "CRITIQUE": return "destructive";
      case "HAUTE": return "default";
      case "MOYENNE": return "secondary";
      case "BASSE": return "outline";
      default: return "outline";
    }
  };

  if (initialTasks.length === 0) {
    return <EmptyState icon={CheckSquare} title="No tasks" description="Create your first task" actionLabel="Add Task" onAction={() => setShowCreateDialog(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search tasks..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredTasks} filename="tasks" columns={csvColumns} />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <FilterDropdown label="Status" value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
        <FilterDropdown label="Priority" value={priorityFilter} onValueChange={setPriorityFilter} options={priorityOptions} />
        <FilterDropdown label="Project" value={projectFilter} onValueChange={setProjectFilter} options={projects.map((p: any) => ({ value: p.id, label: p.nom }))} />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsToolbar selectedCount={selectedIds.length} onClearSelection={() => setSelectedIds([])} onDelete={() => setShowBulkDeleteDialog(true)}>
          <Button variant="outline" size="sm" onClick={() => setShowBulkAssignDialog(true)}>
            Bulk Assign
          </Button>
        </BulkActionsToolbar>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={paginatedTasks.length > 0 && selectedIds.length === paginatedTasks.length} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedTasks.length ? [] : paginatedTasks.map((t: any) => t.id))} />
              </TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No tasks match your filters</TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((task: any) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(task.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id])} />
                  </TableCell>
                  <TableCell className="font-medium">{task.nom}</TableCell>
                  <TableCell className="text-sm">{task.projet?.nom || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {task.responsable ? `${task.responsable.prenom} ${task.responsable.nom}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(task.statut)}>
                      {task.statut?.replace(/_/g, " ") || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(task.priorite)}>
                      {task.priorite || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{task.date_fin ? new Date(task.date_fin).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-wrap gap-1">
                      {task.tags && task.tags.length > 0 ? (
                        task.tags.slice(0, 2).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        "-"
                      )}
                      {task.tags && task.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.couleur ? (
                      <div className="w-6 h-6 rounded border-2" style={{ backgroundColor: task.couleur }} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(task)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(task)}>
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

      {filteredTasks.length > pageSize && (
        <DataTablePagination currentPage={page} totalPages={Math.ceil(filteredTasks.length / pageSize)} pageSize={pageSize} totalItems={filteredTasks.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <TaskFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} organizations={organizations} projects={projects} milestones={milestones} assignees={assignees} />
      {selectedTask && <TaskFormDialog task={selectedTask} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} organizations={organizations} projects={projects} milestones={milestones} assignees={assignees} />}
      <DeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={confirmDelete} title="Delete Task" description="This will permanently delete the task." itemName={selectedTask?.nom} isDeleting={isDeleting} />
      <DeleteConfirmationDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog} onConfirm={handleBulkDelete} title="Delete Multiple Tasks" description={`Delete ${selectedIds.length} tasks?`} isDeleting={isDeleting} />
      <BulkAssignDialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog} onSuccess={handleBulkAssignSuccess} taskIds={selectedIds} assignees={assignees} />
    </div>
  );
}
