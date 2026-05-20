"use client";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const t = useT();
  const statusLabels: Record<string, string> = {
    draft: t.common.statusDraft,
    in_progress: t.common.statusInProgress,
    completed: t.common.statusCompleted,
    cancelled: t.common.statusCancelled,
    active: t.common.statusActive,
    inactive: t.common.statusInactive,
  };

  const cls = STATUS_CLASSES[status] ?? "bg-slate-100 text-slate-600";
  const displayLabel = label ?? statusLabels[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        cls,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
