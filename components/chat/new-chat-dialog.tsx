"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Users, Loader2 } from "lucide-react";
import type { ChatItem } from "@/app/app/chat/page";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onChatCreated: (chat: ChatItem) => void;
}

interface User {
  id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
}

export function NewChatDialog({
  open,
  onOpenChange,
  organizationId,
  onChatCreated,
}: NewChatDialogProps) {
  const [activeTab, setActiveTab] = useState("direct");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Group chat state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );

  // Load users when dialog opens
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/members`
      );
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      const data = await response.json();
      setUsers(
        data.members?.map((m: any) => ({
          id: m.user_id,
          prenom: m.prenom,
          nom: m.nom,
          avatar_url: m.avatar_url,
        })) || []
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      loadUsers();
    } else {
      // Reset state
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers(new Set());
    }
    onOpenChange(newOpen);
  };

  const handleSelectUser = (user: User) => {
    // For direct messages, immediately create chat
    onChatCreated({
      id: user.id,
      name: `${user.prenom} ${user.nom}`,
      type: "direct",
      avatar_url: user.avatar_url || undefined,
    });
    onOpenChange(false);
  };

  const handleToggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) return;

    try {
      setCreating(true);
      const response = await fetch("/api/chat/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          memberIds: Array.from(selectedMembers),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create group");
      }

      const { group } = await response.json();
      onChatCreated({
        id: group.id,
        name: group.name,
        type: "group",
        description: group.description,
      });
      toast.success("Group created successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-background dark:bg-background border-border dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Start a conversation</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send a direct message or create a group chat
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 dark:bg-muted/30">
            <TabsTrigger value="direct" className="data-[state=active]:bg-background dark:data-[state=active]:bg-background">
              <MessageSquare className="h-4 w-4 mr-2" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="data-[state=active]:bg-background dark:data-[state=active]:bg-background">
              <Users className="h-4 w-4 mr-2" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4 mt-4">
            <Label className="text-sm font-medium text-foreground">Select a person to message</Label>
            <ScrollArea className="h-[300px] border border-border dark:border-border rounded-lg bg-card/50 dark:bg-card/30 p-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2.5",
                        "hover:bg-accent hover:shadow-sm transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "active:scale-[0.98]"
                      )}
                    >
                      <Avatar className="h-9 w-9 ring-2 ring-background dark:ring-border">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium">
                          {user.prenom[0]}
                          {user.nom[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {user.prenom} {user.nom}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="group" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-sm font-medium text-foreground">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                maxLength={100}
                className="bg-background dark:bg-background border-border focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-description" className="text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                rows={2}
                className="bg-background dark:bg-background border-border focus-visible:ring-2 focus-visible:ring-primary resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Add Members <span className="text-destructive">*</span>
              </Label>
              <ScrollArea className="h-[180px] border border-border dark:border-border rounded-lg bg-card/50 dark:bg-card/30 p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Loading users...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          "hover:bg-accent cursor-pointer"
                        )}
                        onClick={() => handleToggleMember(user.id)}
                      >
                        <Checkbox
                          checked={selectedMembers.has(user.id)}
                          onCheckedChange={() => handleToggleMember(user.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="h-8 w-8 ring-2 ring-background dark:ring-border">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium">
                            {user.prenom[0]}
                            {user.nom[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {user.prenom} {user.nom}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1.5">
                {selectedMembers.size} member(s) selected
              </p>
            </div>

            <Button
              onClick={handleCreateGroup}
              disabled={
                creating || !groupName.trim() || selectedMembers.size === 0
              }
              className="w-full transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
