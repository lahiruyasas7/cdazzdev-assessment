// src/hooks/use-tasks.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios-client";
import type { PaginatedTasks, TaskQueryParams } from "@/lib/types/task.type";

export function useTasks(
  projectId: string | null,
  params: TaskQueryParams = {},
) {
  return useQuery<PaginatedTasks>({
    // Include all params in the query key so React Query refetches
    // automatically whenever any filter or page changes.
    queryKey: ["tasks", projectId, params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.status) search.set("status", params.status);
      if (params.priority) search.set("priority", params.priority);
      if (params.assigneeId) search.set("assigneeId", params.assigneeId);
      if (params.page) search.set("page", String(params.page));
      if (params.limit) search.set("limit", String(params.limit));
      if (params.sortBy) search.set("sortBy", params.sortBy);
      if (params.sortOrder) search.set("sortOrder", params.sortOrder);

      const qs = search.toString();
      const { data } = await apiClient.get<PaginatedTasks>(
        `/projects/${projectId}/tasks${qs ? `?${qs}` : ""}`,
      );
      return data;
    },
    enabled: Boolean(projectId), // don't fire until a project is actually selected
    staleTime: 30 * 1000,
  });
}
