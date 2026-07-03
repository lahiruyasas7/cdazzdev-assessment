// src/components/dashboard/project-sidebar.tsx
"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useProjects } from "@/hooks/use-projects";
import type { Project } from "@/lib/types/project.type";

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onClose?: () => void; // for mobile drawer
}

export function ProjectSidebar({
  selectedProjectId,
  onSelectProject,
  onClose,
}: ProjectSidebarProps) {
  const { user, logout } = useAuth();
  const { data: projects, isLoading, isError, refetch } = useProjects();

  return (
    <aside className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
        <span className="text-h2 font-semibold text-neutral-900">TeamSync</span>
        {/* Close button visible only on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-control p-1 text-neutral-500 hover:bg-neutral-100 tablet:hidden"
            aria-label="Close sidebar"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-caption mb-2 px-1 font-medium uppercase tracking-wide text-neutral-400">
          Projects
        </p>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-control bg-neutral-100"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-control bg-danger/10 px-3 py-3">
            <p className="text-caption text-danger">Failed to load projects.</p>
            <button
              onClick={() => refetch()}
              className="text-caption mt-1 font-medium text-danger underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && projects?.length === 0 && (
          <p className="text-caption px-1 text-neutral-500">
            You don't belong to any projects yet.
          </p>
        )}

        {/* Project list */}
        {projects?.map((project) => (
          <button
            key={project.id}
            onClick={() => {
              onSelectProject(project);
              onClose?.();
            }}
            className={`text-body mb-1 w-full rounded-control px-3 py-2 text-left transition-colors ${
              selectedProjectId === project.id
                ? "bg-primary/10 font-medium text-primary"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <span className="block truncate">{project.name}</span>
            <span className="text-caption text-neutral-400">
              {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}{" "}
              · {project.myRole}
            </span>
          </button>
        ))}
      </div>

      {/* User footer */}
      <div className="border-t border-neutral-200 px-4 py-3">
        <p className="text-caption truncate font-medium text-neutral-700">
          {user?.name}
        </p>
        <p className="text-caption truncate text-neutral-400">{user?.email}</p>
        <button
          onClick={logout}
          className="text-caption mt-2 font-medium text-danger hover:text-danger/80"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
