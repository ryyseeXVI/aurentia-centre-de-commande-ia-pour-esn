// @ts-nocheck
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
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function TaskFormDialog({ task, open, onOpenChange, onSuccess, organizations, projects, milestones, assignees }: any) {
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    statut: "A_FAIRE",
    priorite: "MOYENNE",
    date_debut: "",
    date_fin: "",
    charge_estimee: "",
    tags: [],
    couleur: "#6366f1",
    projet_id: "none",
    milestone_id: "none",
    profile_responsable_id: "none",
    organization_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (task) {
      setFormData({
        nom: task.nom || "",
        description: task.description || "",
        statut: task.statut || "A_FAIRE",
        priorite: task.priorite || "MOYENNE",
        date_debut: task.date_debut || "",
        date_fin: task.date_fin || "",
        charge_estimee: task.charge_estimee?.toString() || "",
        tags: task.tags || [],
        couleur: task.couleur || "#6366f1",
        projet_id: task.projet_id || "none",
        milestone_id: task.milestone_id || "none",
        profile_responsable_id: task.profile_responsable_id || "none",
        organization_id: task.organization_id || "",
      });
      if (task.date_debut) setStartDate(new Date(task.date_debut));
      if (task.date_fin) setDueDate(new Date(task.date_fin));
    } else {
      setFormData({
        nom: "",
        description: "",
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        date_debut: "",
        date_fin: "",
        charge_estimee: "",
        tags: [],
        couleur: "#6366f1",
        projet_id: "none",
        milestone_id: "none",
        profile_responsable_id: "none",
        organization_id: "",
      });
      setStartDate(undefined);
      setDueDate(undefined);
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = task ? `/api/admin/tasks/${task.id}` : "/api/admin/tasks";
      const method = task ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          charge_estimee: formData.charge_estimee ? parseFloat(formData.charge_estimee) : null,
          projet_id: formData.projet_id === "none" ? null : formData.projet_id,
          milestone_id: formData.milestone_id === "none" ? null : formData.milestone_id,
          profile_responsable_id: formData.profile_responsable_id === "none" ? null : formData.profile_responsable_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save task");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const statuses = ["A_FAIRE", "EN_COURS", "EN_REVUE", "TERMINE", "BLOQUE"];
  const priorities = ["BASSE", "MOYENNE", "HAUTE", "CRITIQUE"];
  const filteredMilestones = formData.projet_id && formData.projet_id !== "none" ? milestones.filter((m: any) => m.projet_id === formData.projet_id) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Task Name *</Label>
              <Input id="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-4 gap-4">
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
              <Label htmlFor="charge">Est. Hours</Label>
              <Input id="charge" type="number" step="0.5" min="0" value={formData.charge_estimee} onChange={(e) => setFormData({ ...formData, charge_estimee: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker value={formData.couleur} onChange={(color) => setFormData({ ...formData, couleur: color })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={formData.projet_id} onValueChange={(value) => setFormData({ ...formData, projet_id: value, milestone_id: "none" })}>
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
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={formData.milestone_id} onValueChange={(value) => setFormData({ ...formData, milestone_id: value })} disabled={!formData.projet_id || formData.projet_id === "none"}>
                <SelectTrigger id="milestone">
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Milestone</SelectItem>
                  {filteredMilestones.map((ms: any) => (
                    <SelectItem key={ms.id} value={ms.id}>{ms.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={formData.profile_responsable_id} onValueChange={(value) => setFormData({ ...formData, profile_responsable_id: value })}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Assignee</SelectItem>
                  {assignees.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>{user.prenom} {user.nom}</SelectItem>
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
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !dueDate && "text-muted-foreground")} type="button">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={(date) => { setDueDate(date); setFormData({ ...formData, date_fin: date ? format(date, "yyyy-MM-dd") : "" }); }} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput value={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
