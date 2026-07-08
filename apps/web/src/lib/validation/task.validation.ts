import { z } from "zod";

// Mirrors apps/api/src/tasks/dto/create-task.dto.ts exactly.
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Title must be at most 200 characters"),

  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .or(z.literal("")),

  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),

  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),

  // assigneeId must be a valid UUID or empty/omitted.
  // We use a refined check rather than z.string().uuid() so that an
  // empty string (the "Unassigned" select option value) cleanly maps
  // to undefined rather than throwing a UUID validation error.
  assigneeId: z
    .string()
    .uuid("Invalid assignee")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // dueDate as a string (date input gives us YYYY-MM-DD) — we send
  // it as an ISO string to the API, or omit if empty.
  dueDate: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
