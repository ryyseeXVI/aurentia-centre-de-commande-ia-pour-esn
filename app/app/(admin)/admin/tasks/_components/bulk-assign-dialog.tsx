"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function BulkAssignDialog({ open, onOpenChange, onSuccess, taskIds, assignees }: any) {
  const [assigneeId, setAssigneeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!assigneeId) {
      toast.error("Please select an assignee");
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk_assign",
          task_ids: taskIds,
          profile_responsable_id: assigneeId,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign tasks");

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {taskIds.length} Tasks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignee">Select Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select an assignee" />
              </SelectTrigger>
              <SelectContent>
                {assignees.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={assigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={assigning}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
