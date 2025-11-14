"use client";

import { Loader2, UserPlus } from "lucide-react";
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

interface JoinTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamJoined?: () => void;
}

export function JoinTeamDialog({
  open,
  onOpenChange,
  onTeamJoined,
}: JoinTeamDialogProps) {
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Join code is required");
      return;
    }

    setJoining(true);

    try {
      const response = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // User is already a member
          toast.info(
            data.error || "You are already a member of this workspace",
          );
        } else {
          throw new Error(data.error || "Failed to join workspace");
        }
      } else {
        toast.success(
          data.message ||
            `Successfully joined ${data.organization?.name || "workspace"}`,
        );
      }

      // Reset form
      setCode("");

      // Close dialog
      onOpenChange(false);

      // Notify parent to refresh
      if (onTeamJoined) {
        onTeamJoined();
      }
    } catch (error: any) {
      console.error("Error joining workspace:", error);
      toast.error(error.message || "Failed to join workspace");
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    // Reset form when closing
    setCode("");
    onOpenChange(false);
  };

  const handleCodeChange = (value: string) => {
    // Convert to uppercase and remove spaces
    setCode(value.toUpperCase().replace(/\s/g, ""));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Join a Team</DialogTitle>
              <DialogDescription>
                Enter a join code to become a member of an existing workspace
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">
                Join Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="join-code"
                placeholder="ABCD1234"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={joining}
                required
                autoFocus
                maxLength={8}
                className="font-mono text-lg tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                Ask a workspace admin for the 8-character join code
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium mb-1">
                How to get a join code:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ask a workspace owner or admin to generate a join code</li>
                <li>They can find it in the workspace settings</li>
                <li>The code is case-insensitive</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={joining}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={joining || !code.trim()}>
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Workspace"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
