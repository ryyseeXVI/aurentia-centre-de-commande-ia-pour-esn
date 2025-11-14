"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function NotificationFormDialog({ notification, open, onOpenChange, onSuccess, organizations, users }: any) {
  const [formData, setFormData] = useState({
    type: "INFO",
    title: "",
    message: "",
    link: "",
    organization_id: "",
    recipient_type: "SPECIFIC_USERS",
    role: "",
    user_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);

  useEffect(() => {
    if (notification) {
      setFormData({
        type: notification.type || "INFO",
        title: notification.title || "",
        message: notification.message || "",
        link: notification.link || "",
        organization_id: notification.organization_id || "",
        recipient_type: "SPECIFIC_USERS",
        role: "",
        user_ids: notification.user_id ? [notification.user_id] : [],
      });
      setIsBroadcast(false);
    } else {
      setFormData({
        type: "INFO",
        title: "",
        message: "",
        link: "",
        organization_id: "",
        recipient_type: "SPECIFIC_USERS",
        role: "",
        user_ids: [],
      });
      setIsBroadcast(false);
    }
  }, [notification, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (notification) {
        // Update existing notification
        const url = `/api/admin/notifications/${notification.id}`;
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            title: formData.title,
            message: formData.message,
            link: formData.link || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update notification");
        }

        onSuccess();
      } else {
        // Create new notification or broadcast
        if (isBroadcast) {
          // Broadcast to multiple users
          const response = await fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "broadcast",
              organization_id: formData.organization_id,
              type: formData.type,
              title: formData.title,
              message: formData.message,
              link: formData.link || null,
              recipient_type: formData.recipient_type,
              role: formData.recipient_type === "ROLE" ? formData.role : null,
              user_ids: formData.recipient_type === "SPECIFIC_USERS" ? formData.user_ids : null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to broadcast notification");
          }

          const result = await response.json();
          toast.success(`Broadcast sent to ${result.count} users`);
        } else {
          // Single notification
          if (formData.user_ids.length === 0) {
            throw new Error("Please select a user");
          }

          const response = await fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: formData.user_ids[0],
              organization_id: formData.organization_id,
              type: formData.type,
              title: formData.title,
              message: formData.message,
              link: formData.link || null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create notification");
          }
        }

        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const notificationTypes = ["INFO", "SUCCESS", "WARNING", "ERROR", "TASK_ASSIGNED", "TASK_COMPLETED", "PROJECT_UPDATE", "MILESTONE_REACHED", "SYSTEM"];
  const roles = ["ADMIN", "MANAGER", "CONSULTANT", "CLIENT"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notification ? "Edit Notification" : "Create Notification"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!notification && (
            <div className="space-y-2">
              <Label>Mode</Label>
              <RadioGroup value={isBroadcast ? "broadcast" : "single"} onValueChange={(value) => setIsBroadcast(value === "broadcast")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="font-normal cursor-pointer">Single Notification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="broadcast" id="broadcast" />
                  <Label htmlFor="broadcast" className="font-normal cursor-pointer">Broadcast to Multiple Users</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="organization">Organization *</Label>
            <Select value={formData.organization_id} onValueChange={(value) => setFormData({ ...formData, organization_id: value })} required disabled={!!notification}>
              <SelectTrigger id="organization">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })} required>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required maxLength={1000} rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (Optional)</Label>
            <Input id="link" type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://example.com" />
          </div>

          {!notification && (
            <>
              {isBroadcast ? (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <Label>Recipients</Label>
                  <RadioGroup value={formData.recipient_type} onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ALL" id="all" />
                      <Label htmlFor="all" className="font-normal cursor-pointer">All Users in Organization</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ROLE" id="role" />
                      <Label htmlFor="role" className="font-normal cursor-pointer">Users by Role</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SPECIFIC_USERS" id="specific" />
                      <Label htmlFor="specific" className="font-normal cursor-pointer">Specific Users</Label>
                    </div>
                  </RadioGroup>

                  {formData.recipient_type === "ROLE" && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Select Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.recipient_type === "SPECIFIC_USERS" && (
                    <div className="space-y-2">
                      <Label>Select Users *</Label>
                      <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                        {users.map((user: any) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={formData.user_ids.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, user_ids: [...formData.user_ids, user.id] });
                                } else {
                                  setFormData({ ...formData, user_ids: formData.user_ids.filter(id => id !== user.id) });
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`user-${user.id}`} className="font-normal cursor-pointer">
                              {user.prenom} {user.nom} ({user.email})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="user">Select User *</Label>
                  <Select value={formData.user_ids[0] || ""} onValueChange={(value) => setFormData({ ...formData, user_ids: [value] })} required>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.prenom} {user.nom} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {notification ? "Save Changes" : isBroadcast ? "Broadcast" : "Create Notification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
