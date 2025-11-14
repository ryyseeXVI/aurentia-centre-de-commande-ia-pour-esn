"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ConsultantFormDialog({ consultant, open, onOpenChange, onSuccess, organizations, managers, users }: any) {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    role: "none",
    statut: "DISPONIBLE",
    date_embauche: "",
    taux_journalier_cout: "",
    taux_journalier_vente: "",
    manager_id: "none",
    user_id: "none",
    organization_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (consultant) {
      setFormData({
        nom: consultant.nom || "",
        prenom: consultant.prenom || "",
        email: consultant.email || "",
        role: consultant.role || "none",
        statut: consultant.statut || "DISPONIBLE",
        date_embauche: consultant.date_embauche || "",
        taux_journalier_cout: consultant.taux_journalier_cout?.toString() || "",
        taux_journalier_vente: consultant.taux_journalier_vente?.toString() || "",
        manager_id: consultant.manager_id || "none",
        user_id: consultant.user_id || "none",
        organization_id: consultant.organization_id || "",
      });
      if (consultant.date_embauche) {
        setDate(new Date(consultant.date_embauche));
      }
    } else {
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        role: "none",
        statut: "DISPONIBLE",
        date_embauche: "",
        taux_journalier_cout: "",
        taux_journalier_vente: "",
        manager_id: "none",
        user_id: "none",
        organization_id: "",
      });
      setDate(undefined);
    }
  }, [consultant, open]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setFormData({
      ...formData,
      date_embauche: selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = consultant ? `/api/admin/consultants/${consultant.id}` : "/api/admin/consultants";
      const method = consultant ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: formData.role === "none" ? null : formData.role,
          taux_journalier_cout: formData.taux_journalier_cout ? parseFloat(formData.taux_journalier_cout) : null,
          taux_journalier_vente: formData.taux_journalier_vente ? parseFloat(formData.taux_journalier_vente) : null,
          manager_id: formData.manager_id === "none" ? null : formData.manager_id,
          user_id: formData.user_id === "none" ? null : formData.user_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save consultant");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const consultantRoles = ["JUNIOR", "CONFIRME", "SENIOR", "EXPERT", "LEAD"];
  const statuses = ["DISPONIBLE", "EN_MISSION", "INTERCONTRAT", "CONGE", "FORMATION"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{consultant ? "Edit Consultant" : "Create Consultant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">First Name *</Label>
              <Input id="prenom" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Last Name *</Label>
              <Input id="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Role</SelectItem>
                  {consultantRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">Status *</Label>
              <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })} required>
                <SelectTrigger id="statut">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_embauche">Hire Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date_embauche"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taux_journalier_cout">Daily Rate (Cost) €</Label>
              <Input
                id="taux_journalier_cout"
                type="number"
                step="0.01"
                min="0"
                value={formData.taux_journalier_cout}
                onChange={(e) => setFormData({ ...formData, taux_journalier_cout: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taux_journalier_vente">Daily Rate (Sell) €</Label>
              <Input
                id="taux_journalier_vente"
                type="number"
                step="0.01"
                min="0"
                value={formData.taux_journalier_vente}
                onChange={(e) => setFormData({ ...formData, taux_journalier_vente: e.target.value })}
                placeholder="0.00"
              />
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="manager">Manager (Optional)</Label>
            <Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value })}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {managers.map((manager: any) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.prenom} {manager.nom} ({manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user">Link to User Account (Optional)</Label>
            <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
              <SelectTrigger id="user">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {consultant ? "Save Changes" : "Create Consultant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
