"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, costingApi } from "@/lib/api";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => dashboardApi.overview().then((r) => r.data),
    refetchInterval: 60_000, // auto-refresh every 60s
    staleTime: 30_000,
  });
}

export function useProductionTrend(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "production-trend", days],
    queryFn: () => dashboardApi.productionTrend(days).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useCurrentYarnCosts() {
  return useQuery({
    queryKey: ["costing", "current-yarn-costs"],
    queryFn: () => costingApi.currentYarnCosts().then((r) => r.data),
    staleTime: 2 * 60_000,
  });
}

export function useCostTrend(stage?: string, days = 90) {
  return useQuery({
    queryKey: ["costing", "trend", stage, days],
    queryFn: () => costingApi.costTrend({ stage, days }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useKpiSummary() {
  return useQuery({
    queryKey: ["costing", "kpi"],
    queryFn: () => costingApi.kpiSummary().then((r) => r.data),
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
  });
}
