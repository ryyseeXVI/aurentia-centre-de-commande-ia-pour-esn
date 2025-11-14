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
import { ColorPicker } from "@/components/ui/color-picker";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function MilestoneFormDialog({ milestone, open, onOpenChange, onSuccess, organizations, projects }: any) {
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    statut: "A_VENIR",
    priorite: "MOYENNE",
    date_debut: "",
    date_fin: "",
    couleur: "#6366f1",
    projet_id: "none",
    organization_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (milestone) {
      setFormData({
        nom: milestone.nom || "",
        description: milestone.description || "",
        statut: milestone.statut || "A_VENIR",
        priorite: milestone.priorite || "MOYENNE",
        date_debut: milestone.date_debut || "",
        date_fin: milestone.date_fin || "",
        couleur: milestone.couleur || "#6366f1",
        projet_id: milestone.projet_id || "none",
        organization_id: milestone.organization_id || "",
      });
      if (milestone.date_debut) setStartDate(new Date(milestone.date_debut));
      if (milestone.date_fin) setEndDate(new Date(milestone.date_fin));
    } else {
      setFormData({
        nom: "",
        description: "",
        statut: "A_VENIR",
        priorite: "MOYENNE",
        date_debut: "",
        date_fin: "",
        couleur: "#6366f1",
        projet_id: "none",
        organization_id: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [milestone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = milestone ? `/api/admin/milestones/${milestone.id}` : "/api/admin/milestones";
      const method = milestone ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          projet_id: formData.projet_id === "none" ? null : formData.projet_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save milestone");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const statuses = ["A_VENIR", "EN_COURS", "TERMINE", "RETARD"];
  const priorities = ["BASSE", "MOYENNE", "HAUTE", "CRITIQUE"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit Milestone" : "Create Milestone"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Milestone Name *</Label>
            <Input id="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statut">Status *</Label>
              <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })} required>
                <SelectTrigger id="statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorite">Priority *</Label>
              <Select value={formData.priorite} onValueChange={(value) => setFormData({ ...formData, priorite: value })} required>
                <SelectTrigger id="priorite">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker value={formData.couleur} onChange={(color) => setFormData({ ...formData, couleur: color })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Select value={formData.organization_id} onValueChange={(value) => setFormData({ ...formData, organization_id: value })} required>
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
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={formData.projet_id} onValueChange={(value) => setFormData({ ...formData, projet_id: value })}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((proj: any) => (
                    <SelectItem key={proj.id} value={proj.id}>{proj.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")} type="button">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => { setStartDate(date); setFormData({ ...formData, date_debut: date ? format(date, "yyyy-MM-dd") : "" }); }} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")} type="button">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={(date) => { setEndDate(date); setFormData({ ...formData, date_fin: date ? format(date, "yyyy-MM-dd") : "" }); }} disabled={(date) => startDate ? date < startDate : false} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {milestone ? "Save Changes" : "Create Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
