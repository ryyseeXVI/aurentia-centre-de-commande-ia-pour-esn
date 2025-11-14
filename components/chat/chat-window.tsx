"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, Send, User, Users, Loader2, AlertCircle } from "lucide-react";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import type { ChatItem } from "@/app/app/chat/page";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  chat: ChatItem;
  userId: string;
  organizationId: string;
}

export function ChatWindow({ chat, userId, organizationId }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, loading, sendMessage, sendTyping } = useRealtimeChat({
    chatType: chat.type === "organization" ? "organization" : chat.type,
    chatId: chat.id,
    organizationId,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input on chat change
  useEffect(() => {
    inputRef.current?.focus();
  }, [chat.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const success = await sendMessage(newMessage.trim());
      if (success) {
        setNewMessage("");
        inputRef.current?.focus();
        toast.success("Message sent");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const getChatIcon = () => {
    switch (chat.type) {
      case "organization":
      case "project":
        return (
          <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Hash className="h-5 w-5 text-primary" />
          </div>
        );
      case "group":
        return (
          <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
        );
      case "direct":
        return (
          <Avatar className="h-10 w-10 ring-2 ring-background dark:ring-border">
            <AvatarImage src={chat.avatar_url} />
            <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary font-semibold">
              {chat.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col rounded-none border-y-0 border-r-0 bg-background dark:bg-background">
      {/* Header */}
      <CardHeader className="border-b bg-card/50 dark:bg-card/30 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4">
        <CardTitle className="flex items-center gap-3">
          {getChatIcon()}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg truncate">{chat.name}</div>
            {chat.description && (
              <p className="text-sm text-muted-foreground font-normal truncate mt-0.5">
                {chat.description}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden bg-accent/5 dark:bg-accent/10">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Loading messages...
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-12 md:py-16">
                <div className="text-center space-y-3 max-w-sm">
                  <div className="h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      No messages yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start the conversation with {chat.name}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.sender_id === userId;
                const showAvatar =
                  index === 0 ||
                  messages[index - 1].sender_id !== message.sender_id;
                const showTimestamp =
                  index === messages.length - 1 ||
                  messages[index + 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 animate-in fade-in duration-300",
                      isOwnMessage ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-background dark:ring-border">
                          <AvatarImage
                            src={message.sender.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium">
                            {message.sender.prenom[0]}
                            {message.sender.nom[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 md:h-10 md:w-10" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 max-w-[75%] md:max-w-[65%]",
                        isOwnMessage ? "text-right" : ""
                      )}
                    >
                      {showAvatar && (
                        <div
                          className={cn(
                            "flex items-baseline gap-2 mb-1.5",
                            isOwnMessage ? "flex-row-reverse" : ""
                          )}
                        >
                          <span className="font-semibold text-sm text-foreground">
                            {isOwnMessage
                              ? "You"
                              : `${message.sender.prenom} ${message.sender.nom}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), "p")}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-card dark:bg-card/80 text-card-foreground border border-border/50 dark:border-border"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      {message.edited_at && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          (edited)
                        </p>
                      )}
                      {showTimestamp && !showAvatar && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(message.created_at), "p")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t bg-card/50 dark:bg-card/30 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            placeholder={`Message ${chat.name}`}
            disabled={sending}
            className="flex-1 bg-background dark:bg-background border-border focus-visible:ring-2 focus-visible:ring-primary"
            maxLength={5000}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="shrink-0 h-10 w-10 md:h-10 md:w-16 transition-all duration-200"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Send</span>
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 hidden md:block">
          Press Enter to send • {newMessage.length}/5000
        </p>
      </div>
    </Card>
  );
}
