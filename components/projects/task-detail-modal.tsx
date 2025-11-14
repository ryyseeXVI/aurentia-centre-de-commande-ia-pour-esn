// @ts-nocheck
"use client";

import { format } from "date-fns";
import {
  Calendar,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Star,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { TaskCard, TaskPriority } from "@/types/tasks";
import { formatFileSize, getPriorityColor } from "@/utils/task-transformers";

interface TaskDetailModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: (task: TaskCard) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export default function TaskDetailModal({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [_saving, setSaving] = useState(false);

  // Edit states
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedPriority, setEditedPriority] = useState<TaskPriority>("medium");

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Checklist state
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId, loadTask]);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setEditedPriority(task.priority);
    }
  }, [task]);

  const loadTask = async () => {
    if (!taskId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error("Failed to load task");

      const { data } = await response.json();
      setTask(data);
    } catch (error) {
      console.error("Error loading task:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!task) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
          priority: editedPriority,
        }),
      });

      if (!response.ok) throw new Error("Failed to update task");

      const { data } = await response.json();
      setTask(data);
      onTaskUpdated?.(data);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!task) return;

    const method = task.isFavorite ? "DELETE" : "POST";
    try {
      const response = await fetch(`/api/tasks/${task.id}/favorite`, {
        method,
      });
      if (!response.ok) throw new Error("Failed to toggle favorite");

      setTask({ ...task, isFavorite: !task.isFavorite });
      toast.success(
        task.isFavorite ? "Removed from favorites" : "Added to favorites",
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");

      onTaskDeleted?.(task.id);
      onOpenChange(false);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      await loadTask(); // Reload to get new comment
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleChecklistItem = async (
    itemId: string,
    isCompleted: boolean,
  ) => {
    try {
      const response = await fetch(`/api/checklist-items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      await loadTask();
    } catch (error) {
      console.error("Error toggling checklist item:", error);
      toast.error("Failed to update checklist item");
    }
  };

  const handleAddChecklist = async () => {
    if (!task || !newChecklistTitle.trim()) return;

    setAddingChecklist(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChecklistTitle }),
      });

      if (!response.ok) throw new Error("Failed to add checklist");

      await loadTask();
      setNewChecklistTitle("");
      toast.success("Checklist added");
    } catch (error) {
      console.error("Error adding checklist:", error);
      toast.error("Failed to add checklist");
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    if (file.size > 10485760) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload file");

      await loadTask();
      toast.success("File uploaded");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : task ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-xl font-semibold mb-2"
                    onBlur={handleSave}
                  />
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                    {task.column && (
                      <Badge variant="secondary">{task.column.name}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                  >
                    <Star
                      className={`h-4 w-4 ${task.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
                    />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments {task.commentsCount ? `(${task.commentsCount})` : ""}
                </TabsTrigger>
                <TabsTrigger value="checklists">
                  Checklists{" "}
                  {task.checklists?.length ? `(${task.checklists.length})` : ""}
                </TabsTrigger>
                <TabsTrigger value="attachments">
                  Files{" "}
                  {task.attachmentsCount ? `(${task.attachmentsCount})` : ""}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={6}
                      onBlur={handleSave}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={editedPriority}
                        onValueChange={(v) => {
                          setEditedPriority(v as TaskPriority);
                          setTimeout(handleSave, 100);
                        }}
                      >
                        <SelectTrigger className="mt-2">
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

                    <div>
                      <Label>Status</Label>
                      <div className="mt-2 p-2 border rounded-md bg-muted/50">
                        {task.column?.name || "Unknown"}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assignees
                    </Label>
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.assignees.map((assignee) => (
                          <div
                            key={assignee.id}
                            className="flex items-center gap-2 px-3 py-2 border rounded-md"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={assignee.image} />
                              <AvatarFallback>
                                {assignee.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No assignees
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </Label>
                    {task.tags && task.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags</p>
                    )}
                  </div>

                  {task.dueDate && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </Label>
                      <p className="text-sm">
                        {format(new Date(task.dueDate), "PPP")}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4 mt-4">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <Button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                  >
                    {submittingComment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Comment
                  </Button>
                </form>

                <Separator />

                <div className="space-y-4">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user?.image} />
                          <AvatarFallback>
                            {comment.user?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), "PPp")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No comments yet
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="checklists" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="New checklist name..."
                  />
                  <Button
                    onClick={handleAddChecklist}
                    disabled={addingChecklist || !newChecklistTitle.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                <div className="space-y-6">
                  {task.checklists && task.checklists.length > 0 ? (
                    task.checklists.map((checklist) => (
                      <div key={checklist.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{checklist.title}</h4>
                          {checklist.progress && (
                            <span className="text-sm text-muted-foreground">
                              {checklist.progress.completed}/
                              {checklist.progress.total}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {checklist.items?.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={item.isCompleted}
                                onCheckedChange={() =>
                                  handleToggleChecklistItem(
                                    item.id,
                                    item.isCompleted,
                                  )
                                }
                              />
                              <span
                                className={
                                  item.isCompleted
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }
                              >
                                {item.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No checklists yet
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 mt-4">
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  {task.attachments && task.attachments.length > 0 ? (
                    task.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.fileSize)} •{" "}
                              {format(new Date(attachment.createdAt), "PPp")}
                            </p>
                          </div>
                        </div>
                        {attachment.publicUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={attachment.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No attachments yet
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Task not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
