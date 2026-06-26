"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Plus, TrendingDown } from "lucide-react";
import { advancedAnalyticsApi } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function CostAnalysisPage() {
  const t = useT();
  const qc = useQueryClient();
  const [days, setDays] = useState(30);
  const [newModal, setNewModal] = useState(false);
  const [newCost, setNewCost] = useState({
    production_order: "",
    production_batch: "",
    cost_date: new Date().toISOString().split("T")[0],
    raw_material_cost_uzs: "",
    labor_cost_uzs: "",
    overhead_cost_uzs: "",
    energy_cost_uzs: "",
    maintenance_cost_uzs: "0",
    waste_cost_uzs: "0",
    quantity_kg: "",
    notes: "",
  });

  const { data: breakdown } = useQuery({
    queryKey: ["analytics-cost-breakdown", days],
    queryFn: () => advancedAnalyticsApi.getCostBreakdown(days).then((r) => r.data),
  });

  const { data: costs, isLoading } = useQuery({
    queryKey: ["analytics-actual-costs"],
    queryFn: () => advancedAnalyticsApi.listActualCosts({ page_size: 20, ordering: "-cost_date" }).then((r) => r.data),
  });

  const { data: stdCosts } = useQuery({
    queryKey: ["analytics-standard-costs"],
    queryFn: () => advancedAnalyticsApi.listStandardCosts().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => advancedAnalyticsApi.createActualCost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics-actual-costs"] });
      qc.invalidateQueries({ queryKey: ["analytics-cost-breakdown"] });
      setNewModal(false);
    },
  });

  const breakdownItems = breakdown
    ? Object.entries(breakdown.breakdown).map(([k, v]) => ({ key: k, ...v }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">{t.advancedAnalytics.costAnalysis}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => setNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            {t.advancedAnalytics.newActualCost}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {breakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Cost", value: `${(parseFloat(breakdown.total_cost_uzs) / 1_000_000).toFixed(2)}M UZS` },
            { label: t.advancedAnalytics.costPerKg, value: `${parseFloat(breakdown.avg_cost_per_kg).toFixed(0)} UZS` },
            { label: t.advancedAnalytics.quantityKg, value: `${parseFloat(breakdown.total_qty_kg).toFixed(0)} kg` },
            { label: "Records", value: String(breakdown.record_count) },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown chart */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">{t.advancedAnalytics.costBreakdown}</h2>
          {breakdownItems.length > 0 ? (
            <div className="space-y-2">
              {breakdownItems.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{item.key.replace("_", " ")}</span>
                    <span className="font-medium">{item.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.advancedAnalytics.noData}</p>
          )}
        </div>

        {/* Standard costs */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">{t.advancedAnalytics.standardCosts}</h2>
          {stdCosts?.results && stdCosts.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-3 font-medium">{t.advancedAnalytics.colProduct}</th>
                    <th className="pb-2 pr-3 font-medium">{t.advancedAnalytics.colPeriod}</th>
                    <th className="pb-2 font-medium text-right">{t.advancedAnalytics.colStdCost}</th>
                  </tr>
                </thead>
                <tbody>
                  {stdCosts.results.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-accent/30">
                      <td className="py-2 pr-3">
                        <p className="font-medium text-xs">{s.product_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.product_code}</p>
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {s.cost_period_start} – {s.cost_period_end}
                      </td>
                      <td className="py-2 text-right font-semibold text-xs">
                        {parseFloat(s.total_standard_cost_per_kg).toFixed(0)} UZS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.advancedAnalytics.noData}</p>
          )}
        </div>
      </div>

      {/* Actual costs table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">{t.advancedAnalytics.actualCosts}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.colDate}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order / Batch</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.quantityKg}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total (UZS)</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.costPerKg}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : !costs?.results?.length ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{t.advancedAnalytics.noData}</td></tr>
            ) : (
              costs.results.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs">{c.cost_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.order_number ?? c.batch_number ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-xs">{parseFloat(c.quantity_kg).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-xs">{(parseFloat(c.total_cost_uzs) / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-3 text-right font-semibold text-xs">{parseFloat(c.cost_per_kg).toFixed(0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Actual Cost Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h2 className="font-semibold">{t.advancedAnalytics.newActualCost}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t.advancedAnalytics.rawMaterialCost + " (UZS)", key: "raw_material_cost_uzs" },
                { label: t.advancedAnalytics.laborCost + " (UZS)", key: "labor_cost_uzs" },
                { label: t.advancedAnalytics.overheadCost + " (UZS)", key: "overhead_cost_uzs" },
                { label: t.advancedAnalytics.energyCost + " (UZS)", key: "energy_cost_uzs" },
                { label: t.advancedAnalytics.maintenanceCost + " (UZS)", key: "maintenance_cost_uzs" },
                { label: t.advancedAnalytics.wasteCost + " (UZS)", key: "waste_cost_uzs" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input
                    type="number" step="0.01"
                    className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                    value={newCost[key as keyof typeof newCost]}
                    onChange={(e) => setNewCost((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.advancedAnalytics.quantityKg} *</label>
                <input
                  type="number" step="0.001"
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={newCost.quantity_kg}
                  onChange={(e) => setNewCost((p) => ({ ...p, quantity_kg: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.advancedAnalytics.colDate} *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={newCost.cost_date}
                  onChange={(e) => setNewCost((p) => ({ ...p, cost_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setNewModal(false)} className="px-4 py-2 rounded border text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={() => createMut.mutate(newCost as Record<string, unknown>)}
                disabled={!newCost.quantity_kg || createMut.isPending}
                className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
              >
                {createMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
