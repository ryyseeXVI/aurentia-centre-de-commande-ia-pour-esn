"use client";

/**
 * Milestone Form Component
 * Form for creating and editing milestones
 */

import { useState } from "react";
import type {
  CreateMilestoneRequest,
  Milestone,
  UpdateMilestoneRequest,
} from "@/types/milestones";

interface MilestoneFormProps {
  milestone?: Milestone; // If provided, form is in edit mode
  onSubmit: (
    data:
      | Omit<CreateMilestoneRequest, "organizationId">
      | UpdateMilestoneRequest,
  ) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function MilestoneForm({
  milestone,
  onSubmit,
  onCancel,
  submitLabel = milestone ? "Update Milestone" : "Create Milestone",
}: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    name: milestone?.name || "",
    description: milestone?.description || "",
    startDate: milestone?.startDate?.split("T")[0] || "",
    dueDate: milestone?.dueDate?.split("T")[0] || "",
    status: milestone?.status || "not_started",
    priority: milestone?.priority || "medium",
    color: milestone?.color || "#3B82F6",
    progressMode: milestone?.progressMode || "auto",
    progressPercentage: milestone?.progressPercentage || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 255) {
      newErrors.name = "Name must be less than 255 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const due = new Date(formData.dueDate);
      if (start > due) {
        newErrors.dueDate = "Due date must be after start date";
      }
    }

    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = "Must be a valid hex color (e.g., #3B82F6)";
    }

    if (
      formData.progressMode === "manual" &&
      (formData.progressPercentage < 0 || formData.progressPercentage > 100)
    ) {
      newErrors.progressPercentage = "Must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(formData as any);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., Launch MVP"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Optional description..."
        />
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.startDate && (
            <p className="text-sm text-destructive mt-1">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
            Due Date *
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.dueDate && (
            <p className="text-sm text-destructive mt-1">{errors.dueDate}</p>
          )}
        </div>
      </div>

      {/* Status and Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="at_risk">At Risk</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Color */}
      <div>
        <label htmlFor="color" className="block text-sm font-medium mb-1">
          Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="h-10 w-20 border rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={formData.color}
            onChange={handleChange}
            name="color"
            className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
            placeholder="#3B82F6"
          />
        </div>
        {errors.color && (
          <p className="text-sm text-destructive mt-1">{errors.color}</p>
        )}
      </div>

      {/* Progress Mode and Percentage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="progressMode"
            className="block text-sm font-medium mb-1"
          >
            Progress Mode
          </label>
          <select
            id="progressMode"
            name="progressMode"
            value={formData.progressMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="auto">Auto (from tasks)</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {formData.progressMode === "manual" && (
          <div>
            <label
              htmlFor="progressPercentage"
              className="block text-sm font-medium mb-1"
            >
              Progress %
            </label>
            <input
              type="number"
              id="progressPercentage"
              name="progressPercentage"
              value={formData.progressPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.progressPercentage && (
              <p className="text-sm text-destructive mt-1">
                {errors.progressPercentage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
