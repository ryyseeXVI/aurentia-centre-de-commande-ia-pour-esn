"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Hash, User, Loader2, Building2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatItem } from "@/app/app/chat/page";
import { toast } from "sonner";

interface ChatSidebarProps {
  type: "channels" | "direct" | "groups";
  organizationId: string;
  selectedChat: ChatItem | null;
  onSelectChat: (chat: ChatItem) => void;
}

export function ChatSidebar({
  type,
  organizationId,
  selectedChat,
  onSelectChat,
}: ChatSidebarProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [type, organizationId, showAllUsers]);

  const fetchItems = async () => {
    try {
      setLoading(true);

      if (type === "channels") {
        const response = await fetch("/api/chat/channels");
        if (!response.ok) {
          throw new Error("Failed to load channels");
        }
        const data = await response.json();
        setItems(
          (data.channels || []).map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            description: ch.description,
            type: "organization" as const,
          }))
        );
      } else if (type === "direct") {
        // Fetch either organization members or all platform users
        const endpoint = showAllUsers
          ? "/api/profiles/all"
          : `/api/organizations/${organizationId}/members`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("Failed to load users");
        }
        const data = await response.json();
        const usersList = showAllUsers ? data.users : data.members;
        setItems(
          (usersList || []).map((member: any) => ({
            id: member.user_id,
            name: `${member.prenom} ${member.nom}`,
            avatar_url: member.avatar_url,
            type: "direct" as const,
          }))
        );
      } else if (type === "groups") {
        const response = await fetch("/api/chat/groups");
        if (!response.ok) {
          throw new Error("Failed to load groups");
        }
        const data = await response.json();
        setItems(
          (data.groups || []).map((group: any) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            type: "group" as const,
          }))
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <p className="font-medium">
            {type === "channels" && "No channels available"}
            {type === "direct" && "No team members found"}
            {type === "groups" && "No groups yet"}
          </p>
          <p className="text-xs">
            {type === "groups" && "Create a group to start chatting"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {type === "direct" && (
        <div className="px-2 pb-2 space-y-1">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={!showAllUsers ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowAllUsers(false)}
              className="flex-1 h-8 text-xs"
            >
              <Building2 className="h-3 w-3 mr-1" />
              My Organization
            </Button>
            <Button
              variant={showAllUsers ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowAllUsers(true)}
              className="flex-1 h-8 text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              All Users
            </Button>
          </div>
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-18rem)] md:h-[calc(100vh-16rem)]">
        <div className="space-y-1 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectChat(item)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              "hover:bg-accent hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "active:scale-[0.98]",
              selectedChat?.id === item.id &&
                "bg-accent shadow-sm border border-border/50 dark:border-border"
            )}
          >
            {type === "channels" ? (
              <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Hash className="h-4 w-4 text-primary" />
              </div>
            ) : (
              <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background dark:ring-border">
                <AvatarImage src={item.avatar_url} />
                <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium">
                  {type === "direct" ? (
                    item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 text-left truncate min-w-0">
              <div className="font-medium truncate leading-tight">
                {item.name}
              </div>
              {item.description && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {item.description}
                </div>
              )}
            </div>
            {item.unread_count && item.unread_count > 0 && (
              <div className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                {item.unread_count > 99 ? "99+" : item.unread_count}
              </div>
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
    </>
  );
}
