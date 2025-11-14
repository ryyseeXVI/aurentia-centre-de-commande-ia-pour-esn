// @ts-nocheck
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hash, MessageSquare, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";

export interface ChatItem {
  id: string;
  name: string;
  type: "organization" | "project" | "direct" | "group";
  description?: string;
  avatar_url?: string;
  unread_count?: number;
}

export default function ChatPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("channels");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Left Sidebar - Chat List */}
      <Card className="w-full md:w-80 lg:w-96 flex-shrink-0 rounded-none border-y-0 border-l-0 bg-card/50 dark:bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 md:p-4 border-b bg-card">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Messages
              </h2>
              <Button
                variant="default"
                size="icon"
                onClick={() => setNewChatOpen(true)}
                className="h-9 w-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 dark:bg-muted/30 p-1">
                <TabsTrigger
                  value="channels"
                  className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Hash className="h-3 w-3 md:mr-1.5" />
                  <span className="hidden md:inline">Channels</span>
                </TabsTrigger>
                <TabsTrigger
                  value="direct"
                  className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-3 w-3 md:mr-1.5" />
                  <span className="hidden md:inline">Direct</span>
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Users className="h-3 w-3 md:mr-1.5" />
                  <span className="hidden md:inline">Groups</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="channels" className="mt-2 md:mt-4">
                <ChatSidebar
                  type="channels"
                  organizationId={profile.organization_id!}
                  selectedChat={selectedChat}
                  onSelectChat={setSelectedChat}
                />
              </TabsContent>

              <TabsContent value="direct" className="mt-2 md:mt-4">
                <ChatSidebar
                  type="direct"
                  organizationId={profile.organization_id!}
                  selectedChat={selectedChat}
                  onSelectChat={setSelectedChat}
                />
              </TabsContent>

              <TabsContent value="groups" className="mt-2 md:mt-4">
                <ChatSidebar
                  type="groups"
                  organizationId={profile.organization_id!}
                  selectedChat={selectedChat}
                  onSelectChat={setSelectedChat}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 hidden md:flex">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            userId={user.id}
            organizationId={profile.organization_id!}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-accent/5 dark:bg-accent/10">
            <div className="text-center space-y-6 max-w-md px-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
                <MessageSquare className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="text-foreground text-xl font-semibold mb-2">
                  Select a conversation
                </p>
                <p className="text-muted-foreground">
                  Choose from channels, direct messages, or groups to start chatting
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        organizationId={profile.organization_id!}
        onChatCreated={(chat) => {
          setSelectedChat(chat);
          setNewChatOpen(false);
        }}
      />
    </div>
  );
}
