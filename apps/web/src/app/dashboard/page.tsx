"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectSidebar } from "@/components/dashboard/project-sidebar";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskList } from "@/components/dashboard/task-list";
import { useProjects } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import type { Project } from "@/lib/types/project.type";
import type { TaskQueryParams } from "@/lib/types/task.type";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Selected project driven by URL — survives refresh and is shareable.
  const projectId = searchParams.get("projectId");

  // Task filter state — local, not in URL (URL would work too but adds
  // complexity the brief doesn't ask for).
  const [taskParams, setTaskParams] = useState<TaskQueryParams>({
    sortBy: "dueDate",
    sortOrder: "asc",
    page: 1,
    limit: 20,
  });

  const { data: projects } = useProjects();
  const selectedProject = projects?.find((p) => p.id === projectId) ?? null;

  // Auto-select the first project if none is selected yet and projects
  // have loaded — avoids the user seeing a blank content area on first visit.
  useEffect(() => {
    if (!projectId && projects && projects.length > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("projectId", projects[0].id);
      router.replace(`/dashboard?${params.toString()}`);
    }
  }, [projectId, projects, router, searchParams]);

  const {
    data: tasksData,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useTasks(projectId, taskParams);

  function handleSelectProject(project: Project) {
    const params = new URLSearchParams();
    params.set("projectId", project.id);
    router.push(`/dashboard?${params.toString()}`);
    // Reset filters when switching projects so old filter state from a
    // previous project doesn't confusingly carry over.
    setTaskParams({ sortBy: "dueDate", sortOrder: "asc", page: 1, limit: 20 });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* ── Desktop sidebar (always visible at tablet+) ── */}
      <div className="hidden w-64 shrink-0 border-r border-neutral-200 tablet:block">
        <ProjectSidebar
          selectedProjectId={projectId}
          onSelectProject={handleSelectProject}
        />
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-neutral-900/50 tablet:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-neutral-200 transition-transform duration-200 tablet:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ProjectSidebar
          selectedProjectId={projectId}
          onSelectProject={handleSelectProject}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* ── Main content ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 tablet:px-6">
          {/* Hamburger — only visible on mobile */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-control p-1 text-neutral-500 hover:bg-neutral-100 tablet:hidden"
            aria-label="Open projects sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            {selectedProject ? (
              <>
                <h1 className="text-h2 truncate text-neutral-900">
                  {selectedProject.name}
                </h1>
                {selectedProject.description && (
                  <p className="text-caption truncate text-neutral-500">
                    {selectedProject.description}
                  </p>
                )}
              </>
            ) : (
              <h1 className="text-h2 text-neutral-400">Select a project</h1>
            )}
          </div>
        </header>

        {/* Filters + task list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 tablet:px-6">
          {projectId ? (
            <div className="flex flex-col gap-4">
              <TaskFilters params={taskParams} onChange={setTaskParams} />
              <TaskList
                tasks={tasksData?.data ?? []}
                meta={
                  tasksData?.meta ?? {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 1,
                  }
                }
                isLoading={tasksLoading}
                isError={tasksError}
                onRetry={refetchTasks}
                page={taskParams.page ?? 1}
                onPageChange={(p) =>
                  setTaskParams((prev) => ({ ...prev, page: p }))
                }
              />
            </div>
          ) : (
            /* No-project-selected state */
            <div className="flex h-full flex-col items-center justify-center text-center">
              <svg
                className="mb-4 h-12 w-12 text-neutral-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <p className="text-body font-medium text-neutral-700">
                No project selected
              </p>
              <p className="text-caption mt-1 text-neutral-400">
                Choose a project from the sidebar to view its tasks.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
