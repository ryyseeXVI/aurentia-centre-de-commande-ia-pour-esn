"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  TaskCard,
  TaskColumn,
  TaskPriority,
} from "@/types/tasks";
import { TaskPriority as TaskPriorityEnum } from "@/types/tasks";
import { columnIdToStatus } from "@/utils/task-transformers";

interface EnhancedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columns: TaskColumn[];
  preselectedColumnId?: string;
  onTaskCreated: (task: TaskCard) => void;
}

export default function EnhancedTaskDialog({
  open,
  onOpenChange,
  projectId,
  columns,
  preselectedColumnId,
  onTaskCreated,
}: EnhancedTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(
    preselectedColumnId || columns[0]?.id || "",
  );
  const [priority, setPriority] = useState<TaskPriority>(TaskPriorityEnum.MEDIUM);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Available options
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<any[]>([]);

  const loadOptions = useCallback(async () => {
    setLoadingData(true);
    try {
      // Load tags, project members, and milestones in parallel
      const [tagsRes, membersRes, milestonesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tags`),
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/projects/${projectId}/milestones`),
      ]);

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData.data || []);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setAvailableUsers(membersData.data || []);
      }

      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        setAvailableMilestones(milestonesData.data || []);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    } finally {
      setLoadingData(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open && projectId) {
      loadOptions();
    }
  }, [open, projectId, loadOptions]);

  useEffect(() => {
    if (preselectedColumnId && preselectedColumnId !== columnId && open) {
      setColumnId(preselectedColumnId);
    }
  }, [preselectedColumnId, open, columnId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!columnId) {
      toast.error("Please select a column");
      return;
    }

    setLoading(true);

    try {
      // Convert columnId to statut
      const statut = columnIdToStatus(columnId);

      // Convert tag IDs to tag names
      const tagNames = selectedTags.length > 0
        ? selectedTags.map((tagId) => {
            const tag = availableTags.find((t) => t.id === tagId);
            return tag?.name || tagId;
          })
        : undefined;

      // Use first assignee as consultant responsable (API only supports single assignment)
      const consultantResponsableId = selectedAssignees.length > 0
        ? selectedAssignees[0]
        : undefined;

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: title.trim(),
          description: description.trim() || undefined,
          statut,
          consultantResponsableId,
          tags: tagNames,
          dateFinCible: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
          milestoneId: selectedMilestone || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      const { data } = await response.json();
      onTaskCreated(data);

      // Reset form
      setTitle("");
      setDescription("");
      setPriority(TaskPriorityEnum.MEDIUM);
      setSelectedTags([]);
      setSelectedAssignees([]);
      setSelectedMilestone("");
      setDueDate(undefined);
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your board. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Column and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="column">
                  Column <span className="text-destructive">*</span>
                </Label>
                <Select value={columnId} onValueChange={setColumnId} required>
                  <SelectTrigger id="column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TaskPriority)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDueDate(undefined)}
                  className="w-fit"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear date
                </Button>
              )}
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label>Tags</Label>
              {loadingData ? (
                <div className="text-sm text-muted-foreground">
                  Loading tags...
                </div>
              ) : availableTags.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={
                          selectedTags.includes(tag.id) ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        style={
                          selectedTags.includes(tag.id)
                            ? {
                                backgroundColor: tag.color,
                                borderColor: tag.color,
                              }
                            : { color: tag.color, borderColor: tag.color }
                        }
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tags available
                </p>
              )}
            </div>

            {/* Milestone */}
            <div className="grid gap-2">
              <Label>Milestone (Optional)</Label>
              {loadingData ? (
                <div className="text-sm text-muted-foreground">
                  Loading milestones...
                </div>
              ) : (
                <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No milestone</SelectItem>
                    {availableMilestones.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Assignees */}
            <div className="grid gap-2">
              <Label>Assignees</Label>
              {loadingData ? (
                <div className="text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedAssignees.includes(user.id)}
                        onCheckedChange={() => toggleAssignee(user.id)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {user.name}{" "}
                        <span className="text-muted-foreground">
                          ({user.email})
                        </span>
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
