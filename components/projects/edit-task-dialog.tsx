"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  TaskCard,
  TaskColumn,
  TaskPriority,
  TaskStatus,
} from "@/types/tasks";
import { TaskPriority as TaskPriorityEnum } from "@/types/tasks";
import { columnIdToStatus, statusToColumnId } from "@/utils/task-transformers";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  projectId: string;
  columns: TaskColumn[];
  onTaskUpdated: (task: TaskCard) => void;
  onTaskDeleted?: (taskId: string) => void;
  currentUserId: string;
}

interface TaskDetails extends TaskCard {
  consultant?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
}

export default function EditTaskDialog({
  open,
  onOpenChange,
  taskId,
  projectId,
  columns,
  onTaskUpdated,
  onTaskDeleted,
  currentUserId,
}: EditTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [task, setTask] = useState<TaskDetails | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriorityEnum.MEDIUM);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);

  // Available options
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<any[]>([]);

  const loadTask = useCallback(async () => {
    if (!taskId) return;

    setLoadingData(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }

      const { data } = await response.json();
      setTask(data);

      // Populate form fields
      setTitle(data.nom || "");
      setDescription(data.description || "");
      setColumnId(statusToColumnId(data.statut));
      setPriority((data.priority as TaskPriority) || TaskPriorityEnum.MEDIUM);
      setSelectedTags(data.tags || []);
      setSelectedAssignee(data.consultantResponsableId || "");
      setDueDate(data.dateFinCible ? new Date(data.dateFinCible) : undefined);
      setSelectedMilestones(data.milestones?.map((m: any) => m.id) || []);
    } catch (error) {
      console.error("Error loading task:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoadingData(false);
    }
  }, [taskId]);

  const loadOptions = useCallback(async () => {
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
        setAvailableMilestones(milestonesData.data || milestonesData.milestones || []);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (open && taskId) {
      loadTask();
      loadOptions();
    }
  }, [open, taskId, loadTask, loadOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskId) return;

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

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: title.trim(),
          description: description.trim() || null,
          statut,
          consultantResponsableId: selectedAssignee || null,
          tags: selectedTags,
          dateFinCible: dueDate ? dueDate.toISOString().split("T")[0] : null,
          priority,
          milestoneIds: selectedMilestones,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || "Failed to update task";
        const errorDetails = errorData.details ? JSON.stringify(errorData.details) : "";

        console.error("Task update failed:", {
          status: response.status,
          errorData,
          taskId,
        });

        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const { data } = await response.json();
      onTaskUpdated(data);
      toast.success("Task updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;

    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task deleted successfully");
      onTaskDeleted?.(taskId);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignMe = async () => {
    if (!taskId) return;

    // Validate currentUserId is a valid UUID before proceeding
    if (!currentUserId || currentUserId.trim() === "") {
      toast.error("Cannot assign task: User ID not available");
      return;
    }

    // Basic UUID format validation (8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentUserId)) {
      toast.error("Cannot assign task: Invalid user ID format");
      console.error("Invalid currentUserId format:", currentUserId);
      return;
    }

    setSelectedAssignee(currentUserId);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultantResponsableId: currentUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || "Failed to assign task";
        const errorDetails = errorData.details ? JSON.stringify(errorData.details) : "";

        console.error("Assignment failed:", {
          status: response.status,
          errorData,
          taskId,
          currentUserId,
        });

        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const { data } = await response.json();
      onTaskUpdated(data);
      toast.success("Task assigned to you");
    } catch (error: any) {
      console.error("Error assigning task:", error);
      toast.error(error.message || "Failed to assign task");
      setSelectedAssignee(""); // Revert on error
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const toggleMilestone = (milestoneId: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId],
    );
  };

  if (!open || !taskId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            {loadingData ? "Loading task details..." : "Update task details and track progress"}
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

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
                  rows={4}
                />
              </div>

              {/* Column and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="column">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select value={columnId} onValueChange={setColumnId} required>
                    <SelectTrigger id="column">
                      <SelectValue placeholder="Select status" />
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
                    type="button"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear date
                  </Button>
                )}
              </div>

              <Separator />

              {/* Assignee */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="assignee">Assigned To</Label>
                  {currentUserId && currentUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAssignMe}
                      className="h-8"
                    >
                      <UserPlus className="mr-2 h-3 w-3" />
                      Assign Me
                    </Button>
                  )}
                </div>
                {availableUsers.length > 0 ? (
                  <Select
                    value={selectedAssignee}
                    onValueChange={setSelectedAssignee}
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Loading users...
                  </p>
                )}
                {task?.consultant && selectedAssignee === task.consultantResponsableId && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {task.consultant.prenom?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {task.consultant.prenom} {task.consultant.nom}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.consultant.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="grid gap-2">
                <Label>Tags</Label>
                {availableTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={
                          selectedTags.includes(tag.id) ? "default" : "outline"
                        }
                        className="cursor-pointer hover:scale-105 transition-transform"
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
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tags available
                  </p>
                )}
              </div>

              {/* Milestones */}
              <div className="grid gap-2">
                <Label>Milestones</Label>
                {availableMilestones.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableMilestones.map((milestone) => (
                      <Badge
                        key={milestone.id}
                        variant={
                          selectedMilestones.includes(milestone.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer hover:scale-105 transition-transform"
                        style={
                          selectedMilestones.includes(milestone.id) && milestone.color
                            ? {
                                backgroundColor: milestone.color,
                                borderColor: milestone.color,
                              }
                            : milestone.color
                              ? { color: milestone.color, borderColor: milestone.color }
                              : {}
                        }
                        onClick={() => toggleMilestone(milestone.id)}
                      >
                        {milestone.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No milestones available for this project
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="mr-auto"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || deleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || deleting}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
