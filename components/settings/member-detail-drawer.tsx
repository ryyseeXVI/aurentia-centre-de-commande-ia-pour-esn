"use client";

import {
  Activity,
  Calendar,
  Check,
  Clock,
  Edit2,
  Mail,
  MessageSquare,
  Plus,
  Shield,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface TeamMember {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  role: "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT";
  joinedAt: string;
}

interface Tag {
  id: string;
  tag: string;
  createdAt: string;
}

interface Note {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
}

interface MemberDetailDrawerProps {
  member: TeamMember | null;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  currentUserId?: string;
}

export function MemberDetailDrawer({
  member,
  organizationId,
  isOpen,
  onClose,
  canManage,
  currentUserId,
}: MemberDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [tags, setTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [timelinePage, setTimelinePage] = useState(1);
  const [hasMoreTimeline, setHasMoreTimeline] = useState(false);

  // Fetch tags when drawer opens or tab changes
  useEffect(() => {
    if (isOpen && member && activeTab === "tags") {
      fetchTags();
    }
  }, [isOpen, member, activeTab, fetchTags]);

  // Fetch notes when drawer opens or tab changes
  useEffect(() => {
    if (isOpen && member && activeTab === "notes") {
      fetchNotes();
    }
  }, [isOpen, member, activeTab, fetchNotes]);

  // Fetch timeline when drawer opens or tab changes
  useEffect(() => {
    if (isOpen && member && activeTab === "timeline") {
      fetchTimeline(1);
    }
  }, [isOpen, member, activeTab, fetchTimeline]);

  const fetchTags = async () => {
    if (!member) return;
    setIsLoadingTags(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/tags`,
      );
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setIsLoadingTags(false);
    }
  };

  const fetchNotes = async () => {
    if (!member) return;
    setIsLoadingNotes(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/notes`,
      );
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const fetchTimeline = async (page: number) => {
    if (!member) return;
    setIsLoadingTimeline(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/timeline?limit=20&offset=${(page - 1) * 20}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setTimeline(data.events || []);
        } else {
          setTimeline((prev) => [...prev, ...(data.events || [])]);
        }
        setHasMoreTimeline(data.pagination?.hasMore || false);
        setTimelinePage(page);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast.error("Failed to load timeline");
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const addTag = async () => {
    if (!member || !newTag.trim()) return;
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: newTag.trim() }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add tag");
      }
      const data = await response.json();
      setTags([...tags, data.tag]);
      setNewTag("");
      toast.success("Tag added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add tag");
    }
  };

  const removeTag = async (tagId: string) => {
    if (!member) return;
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/tags?tag_id=${tagId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to remove tag");
      setTags(tags.filter((t) => t.id !== tagId));
      toast.success("Tag removed successfully");
    } catch (_error) {
      toast.error("Failed to remove tag");
    }
  };

  const addNote = async () => {
    if (!member || !newNote.trim()) return;
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: newNote.trim() }),
        },
      );
      if (!response.ok) throw new Error("Failed to add note");
      const data = await response.json();
      setNotes([data.note, ...notes]);
      setNewNote("");
      toast.success("Note added successfully");
    } catch (_error) {
      toast.error("Failed to add note");
    }
  };

  const updateNote = async (noteId: string) => {
    if (!member || !editingNoteText.trim()) return;
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: editingNoteText.trim() }),
        },
      );
      if (!response.ok) throw new Error("Failed to update note");
      const data = await response.json();
      setNotes(notes.map((n) => (n.id === noteId ? data.note : n)));
      setEditingNoteId(null);
      setEditingNoteText("");
      toast.success("Note updated successfully");
    } catch (_error) {
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!member || !confirm("Are you sure you want to delete this note?"))
      return;
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${member.userId}/notes/${noteId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete note");
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Note deleted successfully");
    } catch (_error) {
      toast.error("Failed to delete note");
    }
  };

  if (!member) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            {member.userImage ? (
              <img
                src={member.userImage}
                alt={member.userName}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-medium">
                  {member.userName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div className="flex-1">
              <SheetTitle className="text-2xl">{member.userName}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3" />
                {member.userEmail}
              </SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    member.role === "ADMIN"
                      ? "default"
                      : member.role === "MANAGER"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {member.role === "ADMIN" && (
                    <Shield className="mr-1 h-3 w-3" />
                  )}
                  {member.role}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Activity className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Member Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-base mt-1">{member.userName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base mt-1">{member.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Role
                  </p>
                  <p className="text-base mt-1">{member.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Joined At
                  </p>
                  <p className="text-base mt-1">
                    {new Date(member.joinedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4 mt-4">
            {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Tag</CardTitle>
                  <CardDescription>
                    Add tags to categorize this member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter tag name..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTag();
                      }}
                    />
                    <Button onClick={addTag} disabled={!newTag.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Tags ({tags.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTags ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tags yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="gap-2">
                        {tag.tag}
                        {canManage && (
                          <button
                            onClick={() => removeTag(tag.id)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Note</CardTitle>
                  <CardDescription>
                    Add private notes about this member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Notes ({notes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingNotes ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No notes yet
                  </p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {note.author.image ? (
                                <img
                                  src={note.author.image}
                                  alt={note.author.name}
                                  className="h-6 w-6 rounded-full"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs">
                                    {note.author.name
                                      ?.charAt(0)
                                      .toUpperCase() || "U"}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {note.author.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(note.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {canManage && note.author.id === currentUserId && (
                              <div className="flex gap-1">
                                {editingNoteId === note.id ? (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateNote(note.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingNoteId(note.id);
                                      setEditingNoteText(note.note);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteNote(note.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {editingNoteId === note.id ? (
                            <Textarea
                              value={editingNoteText}
                              onChange={(e) =>
                                setEditingNoteText(e.target.value)
                              }
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">
                              {note.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Recent activity for this member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTimeline && timelinePage === 1 ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No activity yet
                  </p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {timeline.map((event) => (
                        <div
                          key={event.id}
                          className="flex gap-3 pb-4 border-b last:border-0"
                        >
                          <div className="mt-1">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              {event.action}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreTimeline && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => fetchTimeline(timelinePage + 1)}
                        disabled={isLoadingTimeline}
                      >
                        {isLoadingTimeline ? "Loading..." : "Load More"}
                      </Button>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
