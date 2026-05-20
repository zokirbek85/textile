import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatWeight(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  if (num >= 1000) return `${formatNumber(num / 1000, 2)} t`;
  return `${formatNumber(num, 3)} kg`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy HH:mm");
  } catch {
    return value;
  }
}

export function formatPct(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
}

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const WAREHOUSE_TYPE_COLORS: Record<string, string> = {
  cotton: "bg-amber-100 text-amber-700",
  fiber: "bg-lime-100 text-lime-700",
  wip: "bg-sky-100 text-sky-700",
  yarn: "bg-violet-100 text-violet-700",
  waste: "bg-slate-100 text-slate-600",
  tolling_raw_material: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  tolling_finished_goods: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300",
};
