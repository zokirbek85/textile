"use client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Layers, DollarSign } from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { costingApi } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatMoney, formatWeight, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const EXPENSE_COLORS: Record<string, string> = {
  raw_material: "#2563eb", electricity: "#d97706", gas: "#ef4444",
  water: "#06b6d4", salary: "#7c3aed", amortization: "#64748b",
  repair: "#f59e0b", logistics: "#10b981", laboratory: "#8b5cf6",
  overhead: "#6366f1", taxes: "#ec4899", other: "#94a3b8",
};

export default function CostingPage() {
  const t = useT();
  const { data: yarnCosts, isLoading: yarnLoading } = useQuery({
    queryKey: ["current-yarn-costs"],
    queryFn: () => costingApi.currentYarnCosts().then((r) => r.data),
  });

  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: ["cost-trend-yarn"],
    queryFn: () =>
      costingApi.costTrend({ stage: "fiber_to_yarn", days: 90 }).then((r) => r.data),
  });

  const { data: fiberTrend = [] } = useQuery({
    queryKey: ["cost-trend-fiber"],
    queryFn: () =>
      costingApi.costTrend({ stage: "cotton_to_fiber", days: 90 }).then((r) => r.data),
  });

  const { data: expenseBreakdown } = useQuery({
    queryKey: ["expense-breakdown"],
    queryFn: () =>
      costingApi.expenseBreakdown({ stage: "fiber_to_yarn" }).then((r) => r.data),
  });

  const { data: kpi } = useQuery({
    queryKey: ["kpi-summary"],
    queryFn: () => costingApi.kpiSummary().then((r) => r.data),
  });

  const trendData = trend.map((p) => ({
    week: new Date(p.week).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "short" }),
    yarn_cost: p.avg_cost,
    batches: p.batches,
  }));

  const fiberTrendData = fiberTrend.map((p) => ({
    week: new Date(p.week).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "short" }),
    fiber_cost: p.avg_cost,
  }));

  const expensePieData = expenseBreakdown
    ? Object.entries(expenseBreakdown).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.costing.title}</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t.costing.avgYarnCostMonth}
          value={kpi?.yarn?.avg_yarn_cost
            ? formatMoney(kpi.yarn.avg_yarn_cost) + " /kg"
            : "—"}
          icon={DollarSign}
          variant="warning"
        />
        <KpiCard
          title={t.costing.avgFiberCostMonth}
          value={kpi?.fiber?.avg_fiber_cost
            ? formatMoney(kpi.fiber.avg_fiber_cost) + " /kg"
            : "—"}
          icon={Layers}
          variant="info"
        />
        <KpiCard
          title={t.costing.yarnProducedMonth}
          value={formatWeight(kpi?.yarn?.total_yarn_kg ?? 0)}
          subtitle={`${kpi?.yarn_batches_completed ?? 0} ${t.common.batches}`}
        />
        <KpiCard
          title={t.costing.avgWastePct}
          value={kpi?.yarn?.avg_waste_pct
            ? `${parseFloat(kpi.yarn.avg_waste_pct).toFixed(1)}%`
            : "—"}
          icon={TrendingUp}
          variant={parseFloat(kpi?.yarn?.avg_waste_pct ?? "0") > 10 ? "danger" : "success"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yarn cost trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t.costing.yarnCostTrend90}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="yarn_cost" name={t.costing.yarnCostKg} stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown pie */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t.costing.expenseBreakdown}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expensePieData} dataKey="value" nameKey="name" outerRadius={75} innerRadius={40}>
                {expensePieData.map((entry, i) => (
                  <Cell key={i} fill={EXPENSE_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current yarn costs table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{t.costing.currentYarnCostsByProduct}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {yarnLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))
            : (yarnCosts ?? []).map((item) => (
                <div
                  key={item.product_id}
                  className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-sm font-semibold">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">{item.yarn_count} · {item.yarn_type}</p>
                  <p className="text-xl font-bold tabular mt-2">
                    {item.cost_per_kg ? formatMoney(item.cost_per_kg) : t.common.noData}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.snapshot_date
                      ? `${t.common.updated} ${formatDate(item.snapshot_date)}`
                      : "—"}
                  </p>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
