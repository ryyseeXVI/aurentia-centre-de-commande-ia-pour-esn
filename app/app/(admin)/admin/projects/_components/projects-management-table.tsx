// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Folder, Plus, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Clock } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { CSVExportButton } from "@/app/app/(admin)/admin/_components/csv-export-button";
import { FilterDropdown } from "@/app/app/(admin)/admin/_components/filter-dropdown";
import { ProjectFormDialog } from "./project-form-dialog";
import { HealthScoreHistoryDialog } from "./health-score-history-dialog";
import { csvFormatters } from "@/lib/utils/csv-export";

export function ProjectsManagementTable({ initialProjects, organizations, clients, projectManagers }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [historyProject, setHistoryProject] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statuses = ["ACTIF", "TERMINE", "EN_PAUSE", "ANNULE"];
  const statusOptions = statuses.map(s => ({ value: s, label: s.replace(/_/g, " ") }));

  const healthOptions = [
    { value: "VERT", label: "Healthy (Green)" },
    { value: "ORANGE", label: "At Risk (Orange)" },
    { value: "ROUGE", label: "Critical (Red)" },
  ];

  const filteredProjects = useMemo(() => {
    let filtered = initialProjects.filter((project: any) => {
      const matchesSearch = search === "" ||
        project.nom.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || project.statut === statusFilter;
      const matchesOrg = orgFilter === "all" || project.organization_id === orgFilter;
      const matchesHealth = healthFilter === "all" || project.healthScore?.couleur_risque === healthFilter;

      return matchesSearch && matchesStatus && matchesOrg && matchesHealth;
    });

    // Apply sorting
    if (sortColumn === "healthScore") {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = a.healthScore?.score_global ?? -1;
        const scoreB = b.healthScore?.score_global ?? -1;

        // Projects without scores go to the end
        if (scoreA === -1 && scoreB === -1) return 0;
        if (scoreA === -1) return 1;
        if (scoreB === -1) return -1;

        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
    }

    return filtered;
  }, [initialProjects, search, statusFilter, orgFilter, healthFilter, sortColumn, sortDirection]);

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const csvColumns = [
    { key: "nom", label: "Project Name" },
    { key: "description", label: "Description" },
    { key: "statut", label: "Status" },
    { key: "healthScore.score_global", label: "Health Score" },
    { key: "healthScore.couleur_risque", label: "Risk Level" },
    { key: "healthScore.date_analyse", label: "Score Date", format: csvFormatters.date },
    { key: "client.nom", label: "Client" },
    { key: "chef_projet.nom", label: "PM Last Name" },
    { key: "chef_projet.prenom", label: "PM First Name" },
    { key: "date_debut", label: "Start Date", format: csvFormatters.date },
    { key: "date_fin_prevue", label: "End Date", format: csvFormatters.date },
    { key: "budget_initial", label: "Budget", format: csvFormatters.currency },
    { key: "organization.name", label: "Organization" },
    { key: "created_at", label: "Created", format: csvFormatters.date },
  ];

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setShowEditDialog(true);
  };

  const handleDelete = (project: any) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${selectedProject.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete project");
      toast.success("Project deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedProject(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk_delete", project_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete projects");
      const result = await response.json();
      toast.success(`${result.deleted} projects deleted`);
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
    toast.success("Project saved successfully");
    router.refresh();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedProject(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIF": return "default";
      case "TERMINE": return "secondary";
      case "EN_PAUSE": return "outline";
      case "ANNULE": return "destructive";
      default: return "outline";
    }
  };

  const getHealthBadgeStyle = (couleurRisque: string) => {
    switch (couleurRisque) {
      case "VERT":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200";
      case "ORANGE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200";
      case "ROUGE":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border-gray-200";
    }
  };

  const getHealthLabel = (couleurRisque: string) => {
    switch (couleurRisque) {
      case "VERT": return "Healthy";
      case "ORANGE": return "At Risk";
      case "ROUGE": return "Critical";
      default: return "Unknown";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 dark:text-green-400 font-semibold";
    if (score >= 50) return "text-orange-700 dark:text-orange-400 font-semibold";
    return "text-red-700 dark:text-red-400 font-semibold";
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleBulkSelectByHealth = (riskLevel: "VERT" | "ORANGE" | "ROUGE") => {
    const projectsWithRisk = filteredProjects.filter(
      (p: any) => p.healthScore?.couleur_risque === riskLevel
    );
    setSelectedIds(projectsWithRisk.map((p: any) => p.id));
    toast.success(`Selected ${projectsWithRisk.length} ${getHealthLabel(riskLevel).toLowerCase()} projects`);
  };

  const handleViewHistory = (project: any) => {
    setHistoryProject(project);
    setShowHistoryDialog(true);
  };

  if (initialProjects.length === 0) {
    return <EmptyState icon={Folder} title="No projects" description="Create your first project" actionLabel="Add Project" onAction={() => setShowCreateDialog(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search projects..." />
        <div className="flex items-center gap-2">
          <CSVExportButton data={filteredProjects} filename="projects" columns={csvColumns} />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FilterDropdown label="Status" value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
          <FilterDropdown label="Organization" value={orgFilter} onValueChange={setOrgFilter} options={organizations.map((o: any) => ({ value: o.id, label: o.name }))} />
          <FilterDropdown label="Health Status" value={healthFilter} onValueChange={setHealthFilter} options={healthOptions} />
        </div>

        {/* Quick Select by Health Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Quick select:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:border-red-800 dark:text-red-300"
            onClick={() => handleBulkSelectByHealth("ROUGE")}
          >
            <TrendingUp className="mr-2 h-3 w-3" />
            All Critical
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300"
            onClick={() => handleBulkSelectByHealth("ORANGE")}
          >
            <TrendingUp className="mr-2 h-3 w-3" />
            All At Risk
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:border-green-800 dark:text-green-300"
            onClick={() => handleBulkSelectByHealth("VERT")}
          >
            <TrendingUp className="mr-2 h-3 w-3" />
            All Healthy
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsToolbar selectedCount={selectedIds.length} onClearSelection={() => setSelectedIds([])} onDelete={() => setShowBulkDeleteDialog(true)} />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={paginatedProjects.length > 0 && selectedIds.length === paginatedProjects.length} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedProjects.length ? [] : paginatedProjects.map((p: any) => p.id))} />
              </TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort("healthScore")}>
                  Health Score
                  {getSortIcon("healthScore")}
                </Button>
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>PM</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No projects match your filters</TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((project: any) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(project.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(project.id) ? prev.filter(id => id !== project.id) : [...prev, project.id])} />
                  </TableCell>
                  <TableCell className="font-medium">{project.nom}</TableCell>
                  <TableCell>
                    {project.healthScore ? (
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <div className={`text-2xl font-bold ${getScoreColor(project.healthScore.score_global)}`}>
                            {Math.round(project.healthScore.score_global)}
                          </div>
                          <Badge variant="outline" className={`text-xs ${getHealthBadgeStyle(project.healthScore.couleur_risque)}`}>
                            {getHealthLabel(project.healthScore.couleur_risque)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewHistory(project)}
                          title="View health score history"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No score</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{project.client?.nom || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {project.chef_projet ? `${project.chef_projet.prenom} ${project.chef_projet.nom}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(project.statut)}>
                      {project.statut?.replace(/_/g, " ") || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{project.date_debut ? new Date(project.date_debut).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-sm">{project.date_fin_prevue ? new Date(project.date_fin_prevue).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{project.budget_initial ? `€${project.budget_initial.toLocaleString()}` : "-"}</TableCell>
                  <TableCell className="text-sm">{project.organization?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(project)}>
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

      {filteredProjects.length > pageSize && (
        <DataTablePagination currentPage={page} totalPages={Math.ceil(filteredProjects.length / pageSize)} pageSize={pageSize} totalItems={filteredProjects.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <ProjectFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} organizations={organizations} clients={clients} projectManagers={projectManagers} />
      {selectedProject && <ProjectFormDialog project={selectedProject} open={showEditDialog} onOpenChange={setShowEditDialog} onSuccess={handleSuccess} organizations={organizations} clients={clients} projectManagers={projectManagers} />}
      <DeleteConfirmationDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={confirmDelete} title="Delete Project" description="This will delete all associated tasks, milestones, and data." itemName={selectedProject?.nom} isDeleting={isDeleting} />
      <DeleteConfirmationDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog} onConfirm={handleBulkDelete} title="Delete Multiple Projects" description={`Delete ${selectedIds.length} projects?`} isDeleting={isDeleting} />
      {historyProject && (
        <HealthScoreHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          projectId={historyProject.id}
          projectName={historyProject.nom}
        />
      )}
    </div>
  );
}
