import { z } from "zod";

/**
 * Profile update validation schema
 */
export const updateProfileSchema = z.object({
  prenom: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .optional(),
  nom: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .optional(),
  phone: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
      "Invalid phone number format"
    )
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
