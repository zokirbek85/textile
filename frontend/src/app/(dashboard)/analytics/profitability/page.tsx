"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Plus } from "lucide-react";
import { advancedAnalyticsApi } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function ProfitabilityPage() {
  const t = useT();
  const qc = useQueryClient();
  const [days, setDays] = useState(90);
  const [newModal, setNewModal] = useState(false);
  const [newData, setNewData] = useState({
    analysis_date: new Date().toISOString().split("T")[0],
    period_start: "",
    period_end: "",
    revenue_uzs: "",
    cogs_uzs: "",
    overhead_allocated_uzs: "0",
    quantity_kg: "",
    notes: "",
  });

  const { data: summary } = useQuery({
    queryKey: ["analytics-profit-summary", days],
    queryFn: () => advancedAnalyticsApi.getExecutiveSummary(days).then((r) => r.data),
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ["analytics-profitability-list"],
    queryFn: () => advancedAnalyticsApi.listProfitability({ page_size: 20, ordering: "-analysis_date" }).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => advancedAnalyticsApi.createProfitability(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics-profitability-list"] });
      qc.invalidateQueries({ queryKey: ["analytics-profit-summary"] });
      setNewModal(false);
    },
  });

  const m = (s: string | undefined) => s ? (parseFloat(s) / 1_000_000).toFixed(2) : "0.00";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h1 className="text-xl font-bold">{t.advancedAnalytics.profitability}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
          </select>
          <button
            onClick={() => setNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            {t.advancedAnalytics.newAnalysis}
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t.advancedAnalytics.revenue, value: `${m(summary.revenue_uzs)}M UZS` },
            { label: t.advancedAnalytics.cogs, value: `${m(summary.cogs_uzs)}M UZS` },
            { label: t.advancedAnalytics.netProfit, value: `${m(summary.net_profit_uzs)}M UZS` },
            { label: t.advancedAnalytics.netMargin, value: `${parseFloat(summary.avg_net_margin_pct).toFixed(2)}%` },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.colDate}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.colRevenue}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.grossMargin}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.colNetProfit}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.advancedAnalytics.colMargin}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : !list?.results?.length ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{t.advancedAnalytics.noData}</td></tr>
            ) : (
              list.results.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs">{p.analysis_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.order_number ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-xs">{(parseFloat(p.revenue_uzs) / 1_000_000).toFixed(2)}M</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className={parseFloat(p.gross_margin_pct) > 0 ? "text-green-600" : "text-red-600"}>
                      {parseFloat(p.gross_margin_pct).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">{(parseFloat(p.net_profit_uzs) / 1_000_000).toFixed(2)}M</td>
                  <td className="px-4 py-3 text-right font-semibold text-xs">
                    <span className={parseFloat(p.net_margin_pct) > 0 ? "text-green-600" : "text-red-600"}>
                      {parseFloat(p.net_margin_pct).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Analysis Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="font-semibold">{t.advancedAnalytics.newAnalysis}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{t.advancedAnalytics.colDate} *</label>
                  <input type="date" className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                    value={newData.analysis_date} onChange={(e) => setNewData((p) => ({ ...p, analysis_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{t.advancedAnalytics.quantityKg}</label>
                  <input type="number" step="0.001" className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                    value={newData.quantity_kg} onChange={(e) => setNewData((p) => ({ ...p, quantity_kg: e.target.value }))} />
                </div>
              </div>
              {[
                { label: t.advancedAnalytics.revenue + " (UZS) *", key: "revenue_uzs" },
                { label: t.advancedAnalytics.cogs + " (UZS) *", key: "cogs_uzs" },
                { label: t.advancedAnalytics.overhead + " (UZS)", key: "overhead_allocated_uzs" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                    value={newData[key as keyof typeof newData]}
                    onChange={(e) => setNewData((p) => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setNewModal(false)} className="px-4 py-2 rounded border text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={() => createMut.mutate(newData as Record<string, unknown>)}
                disabled={!newData.revenue_uzs || !newData.cogs_uzs || createMut.isPending}
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
