"use client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsApi } from "@/lib/api";
import { formatWeight, formatNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function AnalyticsPage() {
  const t = useT();
  const { data: machineData = [], isLoading: machineLoading } = useQuery({
    queryKey: ["machine-efficiency"],
    queryFn: () => analyticsApi.machineEfficiency(30).then((r) => r.data as Array<Record<string, unknown>>),
  });

  const { data: costComp = [], isLoading: costLoading } = useQuery({
    queryKey: ["cost-comparison"],
    queryFn: () => analyticsApi.costComparison(10).then((r) => r.data as Array<Record<string, unknown>>),
  });

  const { data: overview } = useQuery({
    queryKey: ["production-overview"],
    queryFn: () => analyticsApi.productionOverview().then((r) => r.data as Record<string, unknown>),
  });

  const machineChartData = machineData.map((m) => ({
    name: (m["machine__code"] as string) ?? "—",
    yarn_kg: m.total_yarn_kg ?? 0,
    waste_kg: m.total_waste_kg ?? 0,
    shifts: m.total_shifts ?? 0,
  }));

  const costCompData = (costComp as Array<Record<string, unknown>>).map((b) => ({
    batch: (b.batch_code as string)?.slice(-6) ?? "",
    cost: b.yarn_cost_per_kg,
    waste: b.waste_pct,
    product: b.product,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.nav.analytics}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Machine efficiency */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t.analytics.machineOutput30}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={machineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="yarn_kg" name={t.analytics.yarnOutputKg} fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="waste_kg" name={t.analytics.wasteKg} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost comparison across batches */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t.analytics.last10BatchesCost}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costCompData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="batch" width={60} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="cost" name={t.analytics.yarnCostKg} fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{t.analytics.machinePerformance}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[t.analytics.colMachine, t.analytics.colShifts, t.analytics.colYarnOutput, t.analytics.colWaste, t.analytics.colAvgDowntime].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {machineLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                : machineData.map((m, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{m["machine__name"] as string}</td>
                      <td className="px-4 py-3 tabular">{m.total_shifts as number}</td>
                      <td className="px-4 py-3 tabular">{formatWeight(m.total_yarn_kg as number)}</td>
                      <td className="px-4 py-3 tabular">{formatWeight(m.total_waste_kg as number)}</td>
                      <td className="px-4 py-3 tabular">{formatNumber(m.avg_downtime_min as number, 0)} min</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
