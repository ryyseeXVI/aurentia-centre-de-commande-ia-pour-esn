"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "../../_components/data-table-pagination";
import { EmptyState } from "../../_components/empty-state";
import { FilterDropdown } from "../../_components/filter-dropdown";
import { CSVExportButton } from "../../_components/csv-export-button";
import { Search, FileText, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  description: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string;
  user?: {
    prenom: string;
    nom: string;
  } | null;
}

interface ActivityLogsManagementTableProps {
  initialLogs: ActivityLog[];
}

/**
 * Activity Logs Management Table
 *
 * Client component with search, filtering, pagination, and export.
 */
export function ActivityLogsManagementTable({
  initialLogs,
}: ActivityLogsManagementTableProps) {
  const [logs] = useState<ActivityLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Get unique actions and resource types for filters
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const uniqueResourceTypes = useMemo(() => {
    const types = new Set(
      logs
        .map((log) => log.resource_type)
        .filter((type): type is string => type !== null)
    );
    return Array.from(types).sort();
  }, [logs]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        search === "" ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        (log.user &&
          `${log.user.prenom} ${log.user.nom}`
            .toLowerCase()
            .includes(search.toLowerCase())) ||
        (log.resource_type &&
          log.resource_type.toLowerCase().includes(search.toLowerCase()));

      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      const matchesResource =
        resourceFilter === "all" || log.resource_type === resourceFilter;

      return matchesSearch && matchesAction && matchesResource;
    });
  }, [logs, search, actionFilter, resourceFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  // CSV export configuration
  const csvColumns = [
    { key: "created_at", label: "Timestamp" },
    { key: "user", label: "User", transform: (log: ActivityLog) =>
      log.user ? `${log.user.prenom} ${log.user.nom}` : "System"
    },
    { key: "action", label: "Action" },
    { key: "description", label: "Description" },
    { key: "resource_type", label: "Resource Type" },
    { key: "resource_id", label: "Resource ID" },
  ];

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("DELETE") || action.includes("REMOVE")) {
      return "destructive";
    }
    if (action.includes("CREATE") || action.includes("ADD")) {
      return "default";
    }
    if (action.includes("UPDATE") || action.includes("EDIT")) {
      return "secondary";
    }
    return "outline";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs by user, action, or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Filters and Export */}
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              label="Action"
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Actions" },
                ...uniqueActions.map((action) => ({
                  value: action,
                  label: action,
                })),
              ]}
              placeholder="Filter by action"
            />

            <FilterDropdown
              label="Resource"
              value={resourceFilter}
              onValueChange={(value) => {
                setResourceFilter(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Resources" },
                ...uniqueResourceTypes.map((type) => ({
                  value: type,
                  label: type,
                })),
              ]}
              placeholder="Filter by resource"
            />

            <CSVExportButton
              data={filteredLogs}
              filename={`activity-logs-${new Date().toISOString().split('T')[0]}`}
              columns={csvColumns}
            />
          </div>
        </div>

        {/* Active Filters Info */}
        {(search || actionFilter !== "all" || resourceFilter !== "all") && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {filteredLogs.length} of {logs.length} logs
            </span>
            {(search || actionFilter !== "all" || resourceFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActionFilter("all");
                  setResourceFilter("all");
                  setPage(1);
                }}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || actionFilter !== "all" || resourceFilter !== "all" ? "No matching logs" : "No activity logs"}
          description={
            search || actionFilter !== "all" || resourceFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Activity logs will appear here as actions are performed"
          }
        />
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timestamp
                    </div>
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-accent/50">
                    <TableCell className="font-mono text-xs">
                      {new Date(log.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {log.user.prenom.charAt(0)}
                              {log.user.nom.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm">
                            {log.user.prenom} {log.user.nom}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground">
                              SYS
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            System
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm truncate" title={log.description}>
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {log.resource_type ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {log.resource_type}
                          </span>
                          {log.resource_id && (
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                              {log.resource_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredLogs.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
