// @ts-nocheck
"use client";

import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaskCard, TaskColumn } from "@/types/tasks";
import { isTaskOverdue } from "@/utils/task-transformers";

type SortField =
  | "title"
  | "priority"
  | "dueDate"
  | "createdAt"
  | "status"
  | "assignees";
type SortDirection = "asc" | "desc";
type GroupBy = "none" | "status" | "priority" | "assignee";

interface ListViewProps {
  tasks: TaskCard[];
  columns: TaskColumn[];
  onTaskClick: (taskId: string) => void;
  onTaskDeleted?: (taskId: string) => void;
  projectId?: string;
  selectedTasks?: string[];
  onSelectionChange?: (taskIds: string[]) => void;
}

export default function ListView({
  tasks,
  columns,
  onTaskClick,
  onTaskDeleted,
  projectId,
  selectedTasks = [],
  onSelectionChange,
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [visibleColumns, setVisibleColumns] = useState({
    priority: true,
    status: true,
    assignees: true,
    tags: true,
    dueDate: true,
    comments: true,
    attachments: true,
    checklists: true,
  });

  // Priority order for sorting
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          comparison =
            (priorityOrder[a.priority || "medium"] || 0) -
            (priorityOrder[b.priority || "medium"] || 0);
          break;
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else
            comparison =
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "status": {
          const colA = columns.find((c) => c.id === a.columnId);
          const colB = columns.find((c) => c.id === b.columnId);
          comparison = (colA?.name || "").localeCompare(colB?.name || "");
          break;
        }
        case "assignees": {
          const aCount = a.assignees?.length || 0;
          const bCount = b.assignees?.length || 0;
          comparison = aCount - bCount;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [tasks, sortField, sortDirection, columns]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tasks": sortedTasks };
    }

    const groups: Record<string, TaskCard[]> = {};

    sortedTasks.forEach((task) => {
      let groupKey = "Unassigned";

      switch (groupBy) {
        case "status": {
          const column = columns.find((c) => c.id === task.columnId);
          groupKey = column?.name || "Unknown";
          break;
        }
        case "priority":
          groupKey =
            (task.priority || "medium").charAt(0).toUpperCase() +
            (task.priority || "medium").slice(1);
          break;
        case "assignee":
          if (task.assignees && task.assignees.length > 0) {
            groupKey = task.assignees[0].name;
          }
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [sortedTasks, groupBy, columns]);

  // Handle selection
  const toggleTaskSelection = (taskId: string) => {
    if (!onSelectionChange) return;

    const newSelection = selectedTasks.includes(taskId)
      ? selectedTasks.filter((id) => id !== taskId)
      : [...selectedTasks, taskId];

    onSelectionChange(newSelection);
  };

  const toggleAllTasks = () => {
    if (!onSelectionChange) return;

    if (selectedTasks.length === tasks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tasks.map((t) => t.id));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const priorityColors = {
    urgent: "bg-red-100 text-red-700 border-red-300",
    high: "bg-orange-100 text-orange-700 border-orange-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Group by:{" "}
                {groupBy === "none"
                  ? "None"
                  : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setGroupBy("none")}>
                None
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("status")}>
                Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("priority")}>
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("assignee")}>
                Assignee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.priority}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    priority: checked as boolean,
                  })
                }
              >
                Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    status: checked as boolean,
                  })
                }
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.assignees}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    assignees: checked as boolean,
                  })
                }
              >
                Assignees
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.tags}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    tags: checked as boolean,
                  })
                }
              >
                Tags
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.dueDate}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    dueDate: checked as boolean,
                  })
                }
              >
                Due Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.comments}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    comments: checked as boolean,
                  })
                }
              >
                Comments
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.attachments}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    attachments: checked as boolean,
                  })
                }
              >
                Attachments
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.checklists}
                onCheckedChange={(checked) =>
                  setVisibleColumns({
                    ...visibleColumns,
                    checklists: checked as boolean,
                  })
                }
              >
                Checklists
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-sm text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          {selectedTasks.length > 0 && ` (${selectedTasks.length} selected)`}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName}>
            {groupBy !== "none" && (
              <div className="bg-muted/50 px-4 py-2 font-medium text-sm border-b">
                {groupName} ({groupTasks.length})
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  {onSelectionChange && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedTasks.length === tasks.length &&
                          tasks.length > 0
                        }
                        onCheckedChange={toggleAllTasks}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleSort("title")}
                    >
                      Title
                      <SortIcon field="title" />
                    </Button>
                  </TableHead>
                  {visibleColumns.priority && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort("priority")}
                      >
                        Priority
                        <SortIcon field="priority" />
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        <SortIcon field="status" />
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.assignees && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort("assignees")}
                      >
                        Assignees
                        <SortIcon field="assignees" />
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.tags && <TableHead>Tags</TableHead>}
                  {visibleColumns.dueDate && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort("dueDate")}
                      >
                        Due Date
                        <SortIcon field="dueDate" />
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.comments && (
                    <TableHead className="w-20 text-center">Comments</TableHead>
                  )}
                  {visibleColumns.attachments && (
                    <TableHead className="w-20 text-center">Files</TableHead>
                  )}
                  {visibleColumns.checklists && (
                    <TableHead className="w-24 text-center">
                      Checklist
                    </TableHead>
                  )}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupTasks.map((task) => {
                  const column = columns.find((c) => c.id === task.columnId);
                  const isOverdue = isTaskOverdue(task);

                  return (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onTaskClick(task.id)}
                    >
                      {onSelectionChange && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        {task.isFavorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {task.title}
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {task.description}
                          </p>
                        )}
                      </TableCell>
                      {visibleColumns.priority && (
                        <TableCell>
                          {task.priority && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${priorityColors[task.priority]}`}
                            >
                              {task.priority.toUpperCase()}
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          {column && (
                            <Badge variant="outline">
                              {column.color && (
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: column.color }}
                                />
                              )}
                              {column.name}
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.assignees && (
                        <TableCell>
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {task.assignees.slice(0, 3).map((assignee) => (
                                <div
                                  key={assignee.id}
                                  className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium"
                                  title={assignee.name}
                                >
                                  {assignee.name?.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {task.assignees.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{task.assignees.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.tags && (
                        <TableCell>
                          {task.tags && task.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${tag.color}20`,
                                    color: tag.color,
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                              {task.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{task.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : null}
                        </TableCell>
                      )}
                      {visibleColumns.dueDate && (
                        <TableCell>
                          {task.dueDate && (
                            <div
                              className={`flex items-center gap-1 text-xs ${
                                isOverdue ? "text-red-600 font-medium" : ""
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.comments && (
                        <TableCell className="text-center">
                          {task.commentsCount && task.commentsCount > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-xs">
                                {task.commentsCount}
                              </span>
                            </div>
                          ) : null}
                        </TableCell>
                      )}
                      {visibleColumns.attachments && (
                        <TableCell className="text-center">
                          {task.attachmentsCount &&
                          task.attachmentsCount > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              <span className="text-xs">
                                {task.attachmentsCount}
                              </span>
                            </div>
                          ) : null}
                        </TableCell>
                      )}
                      {visibleColumns.checklists && (
                        <TableCell className="text-center">
                          {task.checklistProgress &&
                          task.checklistProgress.total > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-muted-foreground">
                              <CheckSquare className="h-3 w-3" />
                              <span className="text-xs">
                                {task.checklistProgress.completed}/
                                {task.checklistProgress.total}
                              </span>
                            </div>
                          ) : null}
                        </TableCell>
                      )}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onTaskClick(task.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onTaskDeleted(task.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks found</p>
        </div>
      )}
    </div>
  );
}
