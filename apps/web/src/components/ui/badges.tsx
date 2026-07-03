import type { TaskStatus, TaskPriority } from "@/lib/types/task.type";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> =
  {
    TODO: {
      label: "To Do",
      className: "bg-neutral-100 text-neutral-700",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-primary/10 text-primary",
    },
    DONE: {
      label: "Done",
      className: "bg-success/10 text-success",
    },
  };

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className: "bg-neutral-100 text-neutral-600",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-warning/10 text-warning",
  },
  HIGH: {
    label: "High",
    className: "bg-danger/10 text-danger",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`text-caption inline-flex items-center rounded-full px-2 py-0.5 font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`text-caption inline-flex items-center rounded-full px-2 py-0.5 font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
