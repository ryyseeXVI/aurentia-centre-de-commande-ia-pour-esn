"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface BulkUpdateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: string) => Promise<void>;
  selectedCount: number;
}

export function BulkUpdateRoleDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedCount,
}: BulkUpdateRoleDialogProps) {
  const [role, setRole] = useState<string>("CONSULTANT");
  const [updating, setUpdating] = useState(false);

  const handleConfirm = async () => {
    setUpdating(true);
    try {
      await onConfirm(role);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User Roles</DialogTitle>
          <DialogDescription>
            Change the role for {selectedCount} selected user{selectedCount !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-role">New Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="bulk-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
                <SelectItem value="CONSULTANT">CONSULTANT</SelectItem>
                <SelectItem value="CLIENT">CLIENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This will update the role for all selected users. This action can
              be reversed by editing individual users or performing another bulk
              update.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={updating}>
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {selectedCount} User{selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
