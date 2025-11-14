"use client";

import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { logger } from "@/lib/logger";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrganizationCreated?: () => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onOrganizationCreated,
}: CreateOrganizationDialogProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || undefined,
          description: formData.description || undefined,
          website: formData.website || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      toast.success("Organization created successfully");
      logger.info("Organization created", { organizationId: data.organization?.id, name: formData.name });

      // Reset form
      setFormData({
        name: "",
        slug: "",
        description: "",
        website: "",
      });

      // Close dialog
      onOpenChange(false);

      // Notify parent to refresh
      if (onOrganizationCreated) {
        onOrganizationCreated();
      }
    } catch (error: unknown) {
      logger.error("Error creating organization", error);
      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    // Reset form when closing
    setFormData({
      name: "",
      slug: "",
      description: "",
      website: "",
    });
    onOpenChange(false);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it hasn't been manually edited
      slug:
        prev.slug === "" || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Set up a new organization for your team
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="organization-name"
                placeholder="My Team Organization"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={creating}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Choose a name that represents your team or company
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-slug">Organization URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  app/
                </span>
                <Input
                  id="organization-slug"
                  placeholder="my-team"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  disabled={creating}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-description">Description</Label>
              <Textarea
                id="organization-description"
                placeholder="What is this organization for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={creating}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-website">Website (optional)</Label>
              <Input
                id="organization-website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                disabled={creating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !formData.name.trim()}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
