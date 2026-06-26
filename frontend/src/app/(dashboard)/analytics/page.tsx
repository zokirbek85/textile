"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Zap, TrendingUp, DollarSign, Target, BarChart2,
  CheckCircle, AlertTriangle, ChevronRight, Factory,
} from "lucide-react";
import { advancedAnalyticsApi, analyticsApi } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { useT } from "@/lib/i18n";

export default function AnalyticsPage() {
  const t = useT();
  const router = useRouter();

  const { data: exec } = useQuery({
    queryKey: ["analytics-executive-dashboard"],
    queryFn: () => advancedAnalyticsApi.getExecutiveDashboard(30).then((r) => r.data),
  });

  const { data: kpiDash } = useQuery({
    queryKey: ["analytics-kpi-dashboard"],
    queryFn: () => advancedAnalyticsApi.getKPIDashboard(30).then((r) => r.data),
  });

  const { data: profSummary } = useQuery({
    queryKey: ["analytics-profitability-summary"],
    queryFn: () => advancedAnalyticsApi.getExecutiveSummary(30).then((r) => r.data),
  });

  const modules = [
    { key: "costAnalysis", href: "/analytics/cost", icon: DollarSign, color: "bg-blue-500", desc: "Standard vs actual cost breakdown" },
    { key: "profitability", href: "/analytics/profitability", icon: TrendingUp, color: "bg-green-500", desc: "Revenue, margin and profitability trend" },
    { key: "kpiDashboard", href: "/analytics/kpi", icon: Target, color: "bg-purple-500", desc: "Line efficiency, OEE and quality KPIs" },
    { key: "forecasting", href: "/analytics/forecasting", icon: BarChart2, color: "bg-orange-500", desc: "Production demand forecasting" },
  ] as const;

  const kpiTrend = exec?.kpi_trend ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Zap className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">{t.advancedAnalytics.title}</h1>
      </div>

      {/* Executive KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title={t.advancedAnalytics.totalOutput}
          value={exec ? `${(parseFloat(exec.production.total_output_kg) / 1000).toFixed(1)} t` : "—"}
          subtitle={`${exec?.production.shift_count ?? 0} shifts`}
          icon={Factory}
          variant="info"
        />
        <KpiCard
          title={t.advancedAnalytics.avgEfficiency}
          value={kpiDash ? `${parseFloat(kpiDash.summary.avg_efficiency_pct).toFixed(1)}%` : "—"}
          subtitle={`OEE: ${kpiDash ? parseFloat(kpiDash.summary.avg_oee_pct).toFixed(1) : "—"}%`}
          icon={Target}
          variant="success"
        />
        <KpiCard
          title={t.advancedAnalytics.passRate}
          value={exec ? `${exec.quality.pass_rate_pct.toFixed(1)}%` : "—"}
          subtitle={`${exec?.quality.passed ?? 0} / ${exec?.quality.total_tests ?? 0} tests`}
          icon={CheckCircle}
          variant="success"
        />
        <KpiCard
          title={t.advancedAnalytics.avgNetMargin}
          value={profSummary ? `${parseFloat(profSummary.avg_net_margin_pct).toFixed(1)}%` : "—"}
          subtitle={profSummary ? `${(parseFloat(profSummary.revenue_uzs) / 1_000_000).toFixed(0)}M UZS revenue` : "No data"}
          icon={TrendingUp}
          variant={profSummary && parseFloat(profSummary.avg_net_margin_pct) > 0 ? "success" : "warning"}
        />
      </div>

      {/* Module quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((m) => (
          <button
            key={m.href}
            onClick={() => router.push(m.href)}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
          >
            <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${m.color} shrink-0`}>
              <m.icon className="w-5 h-5 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{t.advancedAnalytics[m.key]}</div>
              <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI by Line */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">{t.advancedAnalytics.kpiDashboard}</h2>
          {kpiDash && kpiDash.by_line.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t.advancedAnalytics.colLine}</th>
                    <th className="pb-2 pr-4 font-medium text-right">{t.advancedAnalytics.colEfficiency}</th>
                    <th className="pb-2 pr-4 font-medium text-right">{t.advancedAnalytics.colOEE}</th>
                    <th className="pb-2 font-medium text-right">Output (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiDash.by_line.map((l) => (
                    <tr key={l.production_line__code} className="border-b last:border-0 hover:bg-accent/30">
                      <td className="py-2 pr-4">
                        <p className="font-medium">{l.production_line__name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{l.production_line__code}</p>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className={`text-xs font-semibold ${parseFloat(String(l.avg_efficiency)) >= 80 ? "text-green-600" : "text-amber-600"}`}>
                          {parseFloat(String(l.avg_efficiency)).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-xs text-muted-foreground">
                        {l.avg_oee != null ? `${parseFloat(String(l.avg_oee)).toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-2 text-right text-xs">{parseFloat(String(l.total_output)).toFixed(0)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.advancedAnalytics.noData}</p>
          )}
        </div>

        {/* Executive summary */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">{t.advancedAnalytics.executiveDashboard} (30 days)</h2>
          {exec ? (
            <div className="space-y-3">
              {[
                { label: "Production Output", value: `${(parseFloat(exec.production.total_output_kg) / 1000).toFixed(2)} t` },
                { label: "Waste", value: `${(parseFloat(exec.production.total_waste_kg) / 1000).toFixed(2)} t` },
                { label: "Quality Pass Rate", value: `${exec.quality.pass_rate_pct.toFixed(1)}%` },
                { label: "Avg OEE", value: exec.oee.avg_oee_pct ? `${parseFloat(exec.oee.avg_oee_pct).toFixed(1)}%` : "—" },
                { label: "Active Downtime Events", value: String(exec.downtime.active_events) },
                { label: "Revenue", value: `${(parseFloat(exec.profitability.revenue_uzs) / 1_000_000).toFixed(1)}M UZS` },
                { label: "Net Profit", value: `${(parseFloat(exec.profitability.net_profit_uzs) / 1_000_000).toFixed(1)}M UZS` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.advancedAnalytics.noData}</p>
          )}
        </div>
      </div>

      {/* KPI Trend mini-table */}
      {kpiTrend.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Weekly KPI Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Week</th>
                  <th className="pb-2 pr-4 font-medium text-right">Efficiency %</th>
                  <th className="pb-2 pr-4 font-medium text-right">Quality %</th>
                  <th className="pb-2 font-medium text-right">Output (kg)</th>
                </tr>
              </thead>
              <tbody>
                {kpiTrend.map((w) => (
                  <tr key={w.week} className="border-b last:border-0 hover:bg-accent/30">
                    <td className="py-2 pr-4 text-xs">{new Date(w.week).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-right text-xs">{parseFloat(String(w.avg_eff)).toFixed(1)}%</td>
                    <td className="py-2 pr-4 text-right text-xs">{parseFloat(String(w.avg_quality)).toFixed(1)}%</td>
                    <td className="py-2 text-right text-xs">{parseFloat(String(w.total_output)).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
