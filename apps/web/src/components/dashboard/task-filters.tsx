"use client";

import type {
  TaskQueryParams,
  TaskStatus,
  TaskPriority,
} from "@/lib/types/task.type";

interface TaskFiltersProps {
  params: TaskQueryParams;
  onChange: (updated: TaskQueryParams) => void;
}

export function TaskFilters({ params, onChange }: TaskFiltersProps) {
  function set<K extends keyof TaskQueryParams>(
    key: K,
    value: TaskQueryParams[K],
  ) {
    // Changing any filter resets to page 1 so you're not stuck on a
    // now-invalid page (e.g. page 3 of results that now only has 1 page).
    onChange({ ...params, [key]: value || undefined, page: 1 });
  }

  const selectClass =
    "text-caption rounded-control border border-neutral-300 bg-white px-2 py-1.5 text-neutral-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status */}
      <select
        value={params.status ?? ""}
        onChange={(e) =>
          set("status", (e.target.value as TaskStatus) || undefined)
        }
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </select>

      {/* Priority */}
      <select
        value={params.priority ?? ""}
        onChange={(e) =>
          set("priority", (e.target.value as TaskPriority) || undefined)
        }
        className={selectClass}
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      {/* Sort by */}
      <select
        value={params.sortBy ?? "dueDate"}
        onChange={(e) =>
          set("sortBy", e.target.value as "dueDate" | "priority")
        }
        className={selectClass}
        aria-label="Sort by"
      >
        <option value="dueDate">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
      </select>

      {/* Sort order */}
      <select
        value={params.sortOrder ?? "asc"}
        onChange={(e) => set("sortOrder", e.target.value as "asc" | "desc")}
        className={selectClass}
        aria-label="Sort order"
      >
        <option value="asc">↑ Asc</option>
        <option value="desc">↓ Desc</option>
      </select>

      {/* Clear filters — only show if any filter is active */}
      {(params.status || params.priority || params.assigneeId) && (
        <button
          onClick={() =>
            onChange({
              sortBy: params.sortBy,
              sortOrder: params.sortOrder,
              page: 1,
            })
          }
          className="text-caption font-medium text-primary hover:text-primary-dark"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
