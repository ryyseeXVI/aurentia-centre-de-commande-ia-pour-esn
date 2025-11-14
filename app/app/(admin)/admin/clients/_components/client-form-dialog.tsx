"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ClientFormDialog({ client, open, onOpenChange, onSuccess, organizations, users }: any) {
  const [formData, setFormData] = useState({
    nom: "",
    contact_principal: "",
    secteur: "",
    contact_user_id: "none",
    organization_id: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom,
        contact_principal: client.contact_principal || "",
        secteur: client.secteur || "",
        contact_user_id: client.contact_user_id || "none",
        organization_id: client.organization_id || "",
      });
    } else {
      setFormData({ nom: "", contact_principal: "", secteur: "", contact_user_id: "none", organization_id: "" });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = client ? `/api/admin/clients/${client.id}` : "/api/admin/clients";
      const method = client ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contact_user_id: formData.contact_user_id === "none" ? null : formData.contact_user_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save client");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Create Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Name *</Label>
            <Input id="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Person</Label>
            <Input id="contact" value={formData.contact_principal} onChange={(e) => setFormData({ ...formData, contact_principal: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secteur">Sector</Label>
            <Input id="secteur" value={formData.secteur} onChange={(e) => setFormData({ ...formData, secteur: e.target.value })} placeholder="e.g., Finance, Healthcare, Tech" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_user">Contact User (Optional)</Label>
            <Select value={formData.contact_user_id} onValueChange={(value) => setFormData({ ...formData, contact_user_id: value })}>
              <SelectTrigger id="contact_user">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No User</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organization *</Label>
            <Select value={formData.organization_id} onValueChange={(value) => setFormData({ ...formData, organization_id: value })} required>
              <SelectTrigger id="organization">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client ? "Save Changes" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
