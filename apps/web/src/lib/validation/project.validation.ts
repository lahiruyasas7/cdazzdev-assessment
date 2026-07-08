import { z } from "zod";

// Mirrors apps/api/src/projects/dto/create-project.dto.ts exactly.
// MaxLength values must stay in sync if the API DTO ever changes.
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(150, "Name must be at most 150 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .or(z.literal("")), // treat empty string same as omitted
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
