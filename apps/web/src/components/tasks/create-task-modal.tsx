// src/components/tasks/create-task-modal.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskSchema,
  type CreateTaskFormValues,
} from "@/lib/validation/task.validation";
import { useCreateTask } from "@/hooks/use-create-task";

interface CreateTaskModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const labelClass = "text-caption block font-medium text-neutral-700";
const inputClass =
  "text-body mt-1 w-full rounded-control border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:bg-neutral-50";
const errorClass = "text-caption mt-1 text-danger";

export function CreateTaskModal({
  isOpen,
  projectId,
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const createTask = useCreateTask(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "",
      dueDate: "",
    },
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function handleClose() {
    if (createTask.isPending) return;
    reset();
    createTask.reset();
    onClose();
  }

  function onSubmit(values: CreateTaskFormValues) {
    createTask.mutate(values, {
      onSuccess: () => {
        reset();
        createTask.reset();
        onSuccess();
        onClose();
      },
    });
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-card bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 id="create-task-title" className="text-h2 text-neutral-900">
            New task
          </h2>
          <button
            onClick={handleClose}
            disabled={createTask.isPending}
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
            {/* Title */}
            <div>
              <label htmlFor="task-title" className={labelClass}>
                Title <span className="text-danger">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                autoFocus
                placeholder="e.g. Implement password reset flow"
                {...register("title")}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                className={inputClass}
                disabled={createTask.isPending}
              />
              {errors.title && (
                <p id="title-error" className={errorClass}>
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description" className={labelClass}>
                Description
                <span className="ml-1 font-normal text-neutral-400">
                  (optional)
                </span>
              </label>
              <textarea
                id="task-description"
                rows={3}
                placeholder="What needs to be done?"
                {...register("description")}
                className={`${inputClass} resize-none`}
                disabled={createTask.isPending}
              />
              {errors.description && (
                <p className={errorClass}>{errors.description.message}</p>
              )}
            </div>

            {/* Status + Priority — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="task-status"
                  {...register("status")}
                  className={inputClass}
                  disabled={createTask.isPending}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-priority" className={labelClass}>
                  Priority
                </label>
                <select
                  id="task-priority"
                  {...register("priority")}
                  className={inputClass}
                  disabled={createTask.isPending}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label htmlFor="task-due-date" className={labelClass}>
                Due date
                <span className="ml-1 font-normal text-neutral-400">
                  (optional)
                </span>
              </label>
              <input
                id="task-due-date"
                type="date"
                {...register("dueDate")}
                className={inputClass}
                disabled={createTask.isPending}
              />
              {errors.dueDate && (
                <p className={errorClass}>{errors.dueDate.message}</p>
              )}
            </div>

            {/* Assignee ID */}
            <div>
              <label htmlFor="task-assignee" className={labelClass}>
                Assignee ID
                <span className="ml-1 font-normal text-neutral-400">
                  (optional — must be a project member)
                </span>
              </label>
              <input
                id="task-assignee"
                type="text"
                placeholder="Paste a user UUID to assign"
                {...register("assigneeId")}
                aria-invalid={Boolean(errors.assigneeId)}
                aria-describedby={
                  errors.assigneeId ? "assignee-error" : undefined
                }
                className={inputClass}
                disabled={createTask.isPending}
              />
              {errors.assigneeId && (
                <p id="assignee-error" className={errorClass}>
                  {errors.assigneeId.message}
                </p>
              )}
              {/* Honest note about why this is a raw UUID field */}
              <p className="text-caption mt-1 text-neutral-400">
                A member-picker dropdown requires a GET /projects/:id/members
                endpoint not in the brief&apos;s API surface — noted as a known
                gap.
              </p>
            </div>

            {/* API error */}
            {createTask.isError && (
              <p
                role="alert"
                className="text-caption rounded-control bg-danger/10 px-3 py-2 text-danger"
              >
                {createTask.error.response?.data?.message === "Forbidden"
                  ? "Only project managers and admins can create tasks."
                  : (createTask.error.response?.data?.message ??
                    "Something went wrong. Please try again.")}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createTask.isPending}
              className="text-body rounded-control border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createTask.isPending}
              className="text-body rounded-control bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createTask.isPending ? (
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
                "Create task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
