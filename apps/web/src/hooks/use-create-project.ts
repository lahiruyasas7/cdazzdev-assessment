// src/hooks/use-create-project.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/lib/api/axios-client";
import type { CreateProjectFormValues } from "@/lib/validation/project.validation";
import type { Project } from "@/lib/types/project.type";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    AxiosError<{ message: string }>,
    CreateProjectFormValues
  >({
    mutationFn: async (values) => {
      // Send empty description as undefined so the API treats it as
      // omitted rather than storing an empty string.
      const payload = {
        name: values.name,
        ...(values.description ? { description: values.description } : {}),
      };
      const { data } = await apiClient.post<Project>("/projects", payload);
      return data;
    },
    onSuccess: (newProject) => {
      // Append the new project directly to the cached list so the
      // sidebar updates immediately without a full refetch round trip.
      queryClient.setQueryData<Project[]>(["projects"], (old) =>
        old ? [...old, newProject] : [newProject],
      );
      // Still invalidate so the next background refetch gets fresh data
      // including any server-side computed fields (e.g. memberCount).
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
