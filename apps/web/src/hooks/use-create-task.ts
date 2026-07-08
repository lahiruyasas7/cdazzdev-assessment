// src/hooks/use-create-task.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/axios-client';
import type { CreateTaskFormValues } from '@/lib/validation/task.validation';
import type { Task } from '@/lib/types/task.type';

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Task, AxiosError<{ message: string }>, CreateTaskFormValues>({
    mutationFn: async (values) => {
      // Build the payload — only include fields that have real values.
      // Sending undefined fields explicitly would cause the API's
      // ValidationPipe to potentially reject them as unknown keys
      // (since whitelist:true strips unknowns, and forbidNonWhitelisted
      // would error if we sent null for a field expecting a UUID).
      const payload: Record<string, unknown> = {
        title: values.title,
        status: values.status,
        priority: values.priority,
      };

      if (values.description) payload.description = values.description;
      if (values.assigneeId) payload.assigneeId = values.assigneeId;
      if (values.dueDate) {
        // Date input returns YYYY-MM-DD — convert to full ISO 8601
        // so the API's @IsDate() decorator accepts it.
        payload.dueDate = new Date(values.dueDate).toISOString();
      }

      const { data } = await apiClient.post<Task>(
        `/projects/${projectId}/tasks`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all task queries for this project so every page/filter
      // combination refetches. We don't do an optimistic append here
      // because tasks have pagination — prepending to page 1 while the
      // user is on page 2 would produce a confusing duplicate-looking result.
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}
