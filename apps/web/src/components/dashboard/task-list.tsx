"use client";

import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/ui/badges";
import type { Task, PaginationMeta } from "@/lib/types/task.type";

interface TaskListProps {
  tasks: Task[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  onPageChange: (page: number) => void;
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  const now = new Date();
  const isOverdue = d < now;
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return isOverdue ? `⚠ ${formatted}` : formatted;
}

function isDueDateOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// Skeleton row shown while loading — matches real row height so the
// layout doesn't jump when data arrives.
function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-100">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 animate-pulse rounded bg-neutral-100"
            style={{ width: `${60 + i * 10}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function TaskList({
  tasks,
  meta,
  isLoading,
  isError,
  onRetry,
  page,
  onPageChange,
}: TaskListProps) {
  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-neutral-200 bg-white py-16 text-center">
        <p className="text-body text-neutral-600">Failed to load tasks.</p>
        <button
          onClick={onRetry}
          className="text-body mt-3 rounded-control bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state — only shown when not loading and genuinely no results
  if (!isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-neutral-200 bg-white py-16 text-center">
        <svg
          className="mb-4 h-10 w-10 text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-body font-medium text-neutral-700">No tasks found</p>
        <p className="text-caption mt-1 text-neutral-400">
          Try adjusting your filters, or create a new task.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-neutral-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-caption px-4 py-3 text-left font-medium text-neutral-500">
                Task
              </th>
              <th className="text-caption px-4 py-3 text-left font-medium text-neutral-500">
                Status
              </th>
              <th className="text-caption px-4 py-3 text-left font-medium text-neutral-500">
                Priority
              </th>
              <th className="text-caption px-4 py-3 text-left font-medium text-neutral-500">
                Assignee
              </th>
              <th className="text-caption px-4 py-3 text-left font-medium text-neutral-500">
                Due
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              : tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-body font-medium text-neutral-900 hover:text-primary"
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="text-caption mt-0.5 line-clamp-1 text-neutral-400">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-caption text-neutral-700">
                        {task.assignee?.name ?? (
                          <span className="text-neutral-400">Unassigned</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-caption ${
                          isDueDateOverdue(task.dueDate)
                            ? "font-medium text-danger"
                            : "text-neutral-700"
                        }`}
                      >
                        {formatDueDate(task.dueDate)}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — only render if there's actually more than one page */}
      {!isLoading && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-caption text-neutral-500">
            {meta.total} task{meta.total !== 1 ? "s" : ""}
            {" · "}page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="text-caption rounded-control border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="text-caption rounded-control border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
