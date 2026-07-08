// src/components/dashboard/project-sidebar.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useProjects } from "@/hooks/use-projects";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import type { Project } from "@/lib/types/project.type";

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onClose?: () => void;
}

export function ProjectSidebar({
  selectedProjectId,
  onSelectProject,
  onClose,
}: ProjectSidebarProps) {
  const { user, logout } = useAuth();
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Only ADMIN and MANAGER can create projects — mirrors the API's
  // @Roles(GlobalRole.ADMIN, GlobalRole.MANAGER) guard on POST /projects.
  // Hiding the button from MEMBERs avoids a confusing "Forbidden" error
  // that would otherwise appear on submission.
  const canCreateProject = user?.role === "ADMIN" || user?.role === "MANAGER";

  function handleCreated(project: Project) {
    // Auto-select the newly created project so the user sees it
    // immediately without having to click it in the sidebar.
    onSelectProject(project);
    onClose?.();
  }

  return (
    <>
      <aside className="flex h-full flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <span className="text-h2 font-semibold text-neutral-900">
            TeamSync
          </span>
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
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-caption font-medium uppercase tracking-wide text-neutral-400">
              Projects
            </p>
            {/* Create button — only visible to ADMIN/MANAGER */}
            {canCreateProject && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-control p-1 text-neutral-400 hover:bg-neutral-100 hover:text-primary"
                aria-label="Create new project"
                title="New project"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Loading */}
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

          {/* Error */}
          {isError && (
            <div className="rounded-control bg-danger/10 px-3 py-3">
              <p className="text-caption text-danger">
                Failed to load projects.
              </p>
              <button
                onClick={() => refetch()}
                className="text-caption mt-1 font-medium text-danger underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && projects?.length === 0 && (
            <div className="px-1">
              <p className="text-caption text-neutral-500">No projects yet.</p>
              {canCreateProject && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="text-caption mt-1 font-medium text-primary hover:text-primary-dark"
                >
                  Create your first project →
                </button>
              )}
            </div>
          )}

          {/* Project buttons */}
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
                {project.memberCount} member
                {project.memberCount !== 1 ? "s" : ""} · {project.myRole}
              </span>
            </button>
          ))}
        </div>

        {/* User footer */}
        <div className="border-t border-neutral-200 px-4 py-3">
          <p className="text-caption truncate font-medium text-neutral-700">
            {user?.name}
          </p>
          <p className="text-caption truncate text-neutral-400">
            {user?.email}
          </p>
          <p className="text-caption mt-0.5 text-neutral-400">{user?.role}</p>
          <button
            onClick={logout}
            className="text-caption mt-2 font-medium text-danger hover:text-danger/80"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Modal rendered outside the aside so it's not clipped by overflow:hidden */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreated}
      />
    </>
  );
}
