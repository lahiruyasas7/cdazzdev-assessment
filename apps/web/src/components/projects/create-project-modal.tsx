"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from "@/lib/validation/project.validation";
import { useCreateProject } from "@/hooks/use-create-project";
import type { Project } from "@/lib/types/project.type";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const createProject = useCreateProject();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  // Focus the first input when modal opens — keyboard accessibility.
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function handleClose() {
    if (createProject.isPending) return; // don't close mid-submission
    reset();
    createProject.reset();
    onClose();
  }

  function onSubmit(values: CreateProjectFormValues) {
    createProject.mutate(values, {
      onSuccess: (project) => {
        reset();
        createProject.reset();
        onSuccess(project);
        onClose();
      },
    });
  }

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      onClick={(e) => {
        // Close when clicking the backdrop, not the modal itself.
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Modal panel */}
      <div className="w-full max-w-md rounded-card bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 id="create-project-title" className="text-h2 text-neutral-900">
            New project
          </h2>
          <button
            onClick={handleClose}
            disabled={createProject.isPending}
            className="rounded-control p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
            aria-label="Close"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Name */}
            <div>
              <label
                htmlFor="project-name"
                className="text-caption block font-medium text-neutral-700"
              >
                Project name <span className="text-danger">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="e.g. Mobile App Redesign"
                {...register("name")}
                ref={(el) => {
                  // Merge react-hook-form's ref with our own focus ref.
                  register("name").ref(el);
                  (
                    firstInputRef as React.MutableRefObject<HTMLInputElement | null>
                  ).current = el;
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="text-body mt-1 w-full rounded-control border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:bg-neutral-50"
                disabled={createProject.isPending}
              />
              {errors.name && (
                <p id="name-error" className="text-caption mt-1 text-danger">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="project-description"
                className="text-caption block font-medium text-neutral-700"
              >
                Description
                <span className="ml-1 font-normal text-neutral-400">
                  (optional)
                </span>
              </label>
              <textarea
                id="project-description"
                rows={3}
                placeholder="What is this project about?"
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "desc-error" : undefined}
                className="text-body mt-1 w-full resize-none rounded-control border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:bg-neutral-50"
                disabled={createProject.isPending}
              />
              {errors.description && (
                <p id="desc-error" className="text-caption mt-1 text-danger">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* API error — shown below the form fields, above the actions */}
            {createProject.isError && (
              <p
                role="alert"
                className="text-caption rounded-control bg-danger/10 px-3 py-2 text-danger"
              >
                {createProject.error.response?.data?.message === "Forbidden"
                  ? "Only Managers and Admins can create projects."
                  : (createProject.error.response?.data?.message ??
                    "Something went wrong. Please try again.")}
              </p>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createProject.isPending}
              className="text-body rounded-control border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createProject.isPending}
              className="text-body rounded-control bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createProject.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating…
                </span>
              ) : (
                "Create project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
