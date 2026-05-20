"use client";
import {
  Factory, Package, TrendingUp, Zap, Warehouse,
  BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { KpiCard } from "@/components/ui/KpiCard";
import { useDashboardOverview, useProductionTrend } from "@/hooks/useDashboard";
import { formatMoney, formatWeight } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useT } from "@/lib/i18n";

const PIE_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

export default function DashboardPage() {
  const t = useT();
  const { data: overview, isLoading } = useDashboardOverview();
  const { data: trend = [] } = useProductionTrend(30);

  const trendChartData = trend.map((p) => ({
    date: format(parseISO(p.date), "dd MMM"),
    fiber: p.fiber_kg,
    yarn: p.yarn_kg,
    waste: p.waste_kg,
  }));

  const costTrend = (overview?.yarn_cost_trend ?? []).map((p) => ({
    week: format(parseISO(p.week), "dd MMM"),
    cost: p.avg_cost,
  }));

  const warehousePieData = (overview?.warehouses ?? []).map((w) => ({
    name: w.name,
    value: w.total_value,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(t.dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t.common.live}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t.dashboard.todayFiber}
          value={formatWeight(overview?.today.fiber_produced_kg)}
          subtitle={t.dashboard.cottonToFiber}
          icon={Factory}
          variant="info"
          loading={isLoading}
        />
        <KpiCard
          title={t.dashboard.todayYarn}
          value={formatWeight(overview?.today.yarn_produced_kg)}
          subtitle={t.dashboard.fiberToYarn}
          icon={Package}
          variant="success"
          loading={isLoading}
        />
        <KpiCard
          title={t.dashboard.avgYarnCost}
          value={overview?.this_month.avg_yarn_cost_per_kg
            ? formatMoney(overview.this_month.avg_yarn_cost_per_kg) + " /kg"
            : "—"}
          subtitle={t.dashboard.thisMonth}
          icon={TrendingUp}
          variant="warning"
          loading={isLoading}
        />
        <KpiCard
          title={t.dashboard.activeBatches}
          value={(overview?.active_batches.cotton ?? 0) + (overview?.active_batches.yarn ?? 0)}
          subtitle={`${t.dashboard.cotton}: ${overview?.active_batches.cotton ?? 0} | ${t.dashboard.yarn}: ${overview?.active_batches.yarn ?? 0}`}
          icon={Zap}
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Production trend */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{t.dashboard.productionTrend}</h2>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="fiberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="yarnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="fiber" name={t.dashboard.fiberKg} stroke="#2563eb" fill="url(#fiberGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="yarn" name={t.dashboard.yarnKg} stroke="#16a34a" fill="url(#yarnGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Warehouse distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t.dashboard.warehouseValue}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={warehousePieData}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {warehousePieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yarn cost trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{t.dashboard.yarnCostTrend}</h2>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => formatMoney(v) + " /kg"}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="cost" name={t.dashboard.avgCostPerKg} fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Current yarn costs table */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t.dashboard.currentYarnCosts}</h2>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))
            ) : (overview?.current_yarn_costs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.dashboard.noYarnBatches}</p>
            ) : (
              (overview?.current_yarn_costs ?? []).map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.yarn_count} · {item.yarn_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular">
                      {item.cost_per_kg ? formatMoney(item.cost_per_kg) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.common.perKg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warehouse balances */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{t.dashboard.warehouseBalances}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))
            : (overview?.warehouses ?? []).map((wh) => (
                <div key={wh.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{wh.name}</span>
                  </div>
                  <p className="text-sm font-bold tabular">{formatWeight(wh.total_kg)}</p>
                  <p className="text-xs text-muted-foreground">{formatMoney(wh.total_value)}</p>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
