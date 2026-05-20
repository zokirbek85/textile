import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
  className?: string;
}

const VARIANT_STYLES = {
  default: "border-border",
  success: "border-l-4 border-l-green-500",
  warning: "border-l-4 border-l-amber-500",
  danger: "border-l-4 border-l-red-500",
  info: "border-l-4 border-l-blue-500",
};

const ICON_STYLES = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  loading,
  className,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5 animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-24 mb-3" />
        <div className="h-8 bg-muted rounded w-32 mb-2" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow",
        VARIANT_STYLES[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ICON_STYLES[variant])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold tabular">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.value > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trend.value > 0 ? "+" : ""}{trend.value.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
