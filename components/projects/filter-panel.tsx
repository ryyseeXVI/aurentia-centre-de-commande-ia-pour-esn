"use client";
// @ts-nocheck

import { Calendar, Filter, Star, Tag, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  TaskColumn,
} from "@/types/tasks";
import { TaskPriority } from "@/types/tasks";

interface FilterPanelProps {
  projectId: string;
  columns: TaskColumn[];
  onFilterChange: (filters: any) => void;
  activeFilters?: any;
  filters?: any;
}

export default function FilterPanel({
  projectId,
  columns,
  onFilterChange,
  activeFilters,
  filters,
}: FilterPanelProps) {
  // Use either activeFilters or filters prop for backward compatibility
  const currentFilters = activeFilters || filters || {};
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadFilterOptions = useCallback(async () => {
    setLoadingData(true);
    try {
      const [tagsRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tags`),
        fetch(`/api/projects/${projectId}/members`),
      ]);

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData.data || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    } finally {
      setLoadingData(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open && projectId) {
      loadFilterOptions();
    }
  }, [open, projectId, loadFilterOptions]);

  const updateFilter = (key: string, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  const toggleArrayFilter = (
    key: "priorities" | "columns" | "tags" | "assignees" | "creators",
    value: string,
  ) => {
    const currentArray = (currentFilters[key] || []) as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (currentFilters.favorites) count++;
    if (currentFilters.assignedToMe) count++;
    if (currentFilters.createdByMe) count++;
    if (currentFilters.archived) count++;
    if (currentFilters.overdue) count++;
    if (currentFilters.priorities?.length) count++;
    if (currentFilters.columns?.length) count++;
    if (currentFilters.tags?.length) count++;
    if (currentFilters.assignees?.length) count++;
    if (currentFilters.hasAttachments !== undefined) count++;
    if (currentFilters.hasComments !== undefined) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Tasks</SheetTitle>
          <SheetDescription>Filter and organize your tasks</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Filters */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Filters</h4>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favorites"
                  checked={currentFilters.favorites || false}
                  onCheckedChange={(checked) =>
                    updateFilter("favorites", checked || undefined)
                  }
                />
                <label
                  htmlFor="favorites"
                  className="text-sm cursor-pointer flex-1"
                >
                  <Star className="inline h-4 w-4 mr-2" />
                  My favorites
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignedToMe"
                  checked={currentFilters.assignedToMe || false}
                  onCheckedChange={(checked) =>
                    updateFilter("assignedToMe", checked || undefined)
                  }
                />
                <label
                  htmlFor="assignedToMe"
                  className="text-sm cursor-pointer flex-1"
                >
                  <User className="inline h-4 w-4 mr-2" />
                  Assigned to me
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createdByMe"
                  checked={currentFilters.createdByMe || false}
                  onCheckedChange={(checked) =>
                    updateFilter("createdByMe", checked || undefined)
                  }
                />
                <label
                  htmlFor="createdByMe"
                  className="text-sm cursor-pointer flex-1"
                >
                  Created by me
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overdue"
                  checked={currentFilters.overdue || false}
                  onCheckedChange={(checked) =>
                    updateFilter("overdue", checked || undefined)
                  }
                />
                <label
                  htmlFor="overdue"
                  className="text-sm cursor-pointer flex-1"
                >
                  <Calendar className="inline h-4 w-4 mr-2 text-red-600" />
                  Overdue
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archived"
                  checked={currentFilters.archived || false}
                  onCheckedChange={(checked) =>
                    updateFilter("archived", checked || undefined)
                  }
                />
                <label
                  htmlFor="archived"
                  className="text-sm cursor-pointer flex-1"
                >
                  Show archived
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Priority Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Priority</h4>
            <div className="space-y-2">
              {([TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW] as TaskPriority[]).map(
                (priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={
                        currentFilters.priorities?.includes(priority) || false
                      }
                      onCheckedChange={() =>
                        toggleArrayFilter("priorities", priority)
                      }
                    />
                    <label
                      htmlFor={`priority-${priority}`}
                      className="text-sm cursor-pointer flex-1 capitalize"
                    >
                      {priority}
                    </label>
                  </div>
                ),
              )}
            </div>
          </div>

          <Separator />

          {/* Status/Column Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Status</h4>
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={
                      currentFilters.columns?.includes(column.id) || false
                    }
                    onCheckedChange={() =>
                      toggleArrayFilter("columns", column.id)
                    }
                  />
                  <label
                    htmlFor={`column-${column.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {column.color && (
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: column.color }}
                      />
                    )}
                    {column.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h4>
            {loadingData ? (
              <div className="text-sm text-muted-foreground">
                Loading tags...
              </div>
            ) : tags.length > 0 ? (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={currentFilters.tags?.includes(tag.id) || false}
                      onCheckedChange={() => toggleArrayFilter("tags", tag.id)}
                    />
                    <label
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      <Badge
                        variant="outline"
                        style={{ color: tag.color, borderColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags available</p>
            )}
          </div>

          <Separator />

          {/* Assignees Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignees
            </h4>
            {loadingData ? (
              <div className="text-sm text-muted-foreground">
                Loading users...
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assignee-${user.id}`}
                      checked={
                        currentFilters.assignees?.includes(user.id) || false
                      }
                      onCheckedChange={() =>
                        toggleArrayFilter("assignees", user.id)
                      }
                    />
                    <label
                      htmlFor={`assignee-${user.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {user.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No users available
              </p>
            )}
          </div>

          <Separator />

          {/* Additional Filters */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Additional</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasComments"
                  checked={currentFilters.hasComments || false}
                  onCheckedChange={(checked) =>
                    updateFilter("hasComments", checked || undefined)
                  }
                />
                <label
                  htmlFor="hasComments"
                  className="text-sm cursor-pointer flex-1"
                >
                  Has comments
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasAttachments"
                  checked={currentFilters.hasAttachments || false}
                  onCheckedChange={(checked) =>
                    updateFilter("hasAttachments", checked || undefined)
                  }
                />
                <label
                  htmlFor="hasAttachments"
                  className="text-sm cursor-pointer flex-1"
                >
                  Has attachments
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearAllFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
