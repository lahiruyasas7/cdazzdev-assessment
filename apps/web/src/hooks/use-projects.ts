// src/hooks/use-projects.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios-client";
import type { Project } from "@/lib/types/project.type";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await apiClient.get<Project[]>("/projects");
      return data;
    },
    staleTime: 60 * 1000,
  });
}
