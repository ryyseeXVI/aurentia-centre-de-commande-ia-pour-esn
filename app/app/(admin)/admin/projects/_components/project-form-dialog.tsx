"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ProjectFormDialog({ project, open, onOpenChange, onSuccess, organizations, clients, projectManagers }: any) {
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    statut: "ACTIF",
    client_id: "none",
    chef_projet_id: "none",
    date_debut: "",
    date_fin_prevue: "",
    budget_initial: "",
    organization_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (project) {
      setFormData({
        nom: project.nom || "",
        description: project.description || "",
        statut: project.statut || "ACTIF",
        client_id: project.client_id || "none",
        chef_projet_id: project.chef_projet_id || "none",
        date_debut: project.date_debut || "",
        date_fin_prevue: project.date_fin_prevue || "",
        budget_initial: project.budget_initial?.toString() || "",
        organization_id: project.organization_id || "",
      });
      if (project.date_debut) setStartDate(new Date(project.date_debut));
      if (project.date_fin_prevue) setEndDate(new Date(project.date_fin_prevue));
    } else {
      setFormData({
        nom: "",
        description: "",
        statut: "ACTIF",
        client_id: "none",
        chef_projet_id: "none",
        date_debut: "",
        date_fin_prevue: "",
        budget_initial: "",
        organization_id: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [project, open]);

  const handleStartDateSelect = (selectedDate: Date | undefined) => {
    setStartDate(selectedDate);
    setFormData({ ...formData, date_debut: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "" });
  };

  const handleEndDateSelect = (selectedDate: Date | undefined) => {
    setEndDate(selectedDate);
    setFormData({ ...formData, date_fin_prevue: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = project ? `/api/admin/projects/${project.id}` : "/api/admin/projects";
      const method = project ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget_initial: formData.budget_initial ? parseFloat(formData.budget_initial) : null,
          client_id: formData.client_id === "none" ? null : formData.client_id,
          chef_projet_id: formData.chef_projet_id === "none" ? null : formData.chef_projet_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save project");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const statuses = ["ACTIF", "TERMINE", "EN_PAUSE", "ANNULE"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Project Name *</Label>
            <Input id="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Client</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm">Project Manager (Optional)</Label>
              <Select value={formData.chef_projet_id} onValueChange={(value) => setFormData({ ...formData, chef_projet_id: value })}>
                <SelectTrigger id="pm">
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No PM</SelectItem>
                  {projectManagers.map((pm: any) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.prenom} {pm.nom} ({pm.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_debut">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date_debut"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin_prevue">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date_fin_prevue"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_initial">Budget (€)</Label>
            <Input
              id="budget_initial"
              type="number"
              step="0.01"
              min="0"
              value={formData.budget_initial}
              onChange={(e) => setFormData({ ...formData, budget_initial: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
