"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Send, BarChart3, Loader2 } from "lucide-react";
import { productionApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatWeight, formatDate, formatPct, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { ProductionShiftReport } from "@/types";
import { NewShiftReportModal } from "@/components/production/NewShiftReportModal";

const REPORT_STATUS_CLASSES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function ReportStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
      REPORT_STATUS_CLASSES[status] ?? "bg-slate-100 text-slate-600"
    )}>
      {label}
    </span>
  );
}

export default function ShiftReportsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: reportsPage, isLoading } = useQuery({
    queryKey: ["shift-reports", statusFilter],
    queryFn: () =>
      productionApi.listShiftReports({
        page_size: 50,
        ordering: "-shift_date",
        ...(statusFilter ? { status: statusFilter } : {}),
      }).then((r) => r.data.results),
  });

  const { data: analytics } = useQuery({
    queryKey: ["shift-analytics"],
    queryFn: () => productionApi.getShiftAnalytics().then((r) => r.data),
    enabled: showAnalytics,
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => productionApi.submitShiftReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-reports"] });
      toast.success(t.production.reportSubmitted);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Xatolik");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => productionApi.approveShiftReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-reports"] });
      toast.success(t.production.reportApproved);
    },
  });

  const STATUS_TABS = [
    { key: "", label: "Barchasi" },
    { key: "draft", label: "Qoralama" },
    { key: "submitted", label: "Topshirilgan" },
    { key: "approved", label: "Tasdiqlangan" },
  ];

  // Summary stats from loaded data
  const approvedReports = (reportsPage ?? []).filter((r) => r.status === "approved");
  const avgConversion =
    approvedReports.length > 0
      ? approvedReports.reduce((s, r) => s + parseFloat(r.conversion_rate), 0) / approvedReports.length
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.production.shiftReportsTab}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Smena xisobotlari — Shift Production Reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors",
              showAnalytics
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" /> {t.production.brigadeAnalytics}
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t.production.newShiftReport}
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Jami xisobotlar"
          value={(reportsPage ?? []).length}
          icon={CheckCircle2}
        />
        <KpiCard
          title="Tasdiqlangan"
          value={approvedReports.length}
          icon={CheckCircle2}
          variant="success"
        />
        <KpiCard
          title="Kutilayotgan tasdiq"
          value={(reportsPage ?? []).filter((r) => r.status === "submitted").length}
          icon={Send}
          variant="warning"
        />
        <KpiCard
          title={t.production.avgConversion}
          value={`${avgConversion.toFixed(1)}%`}
          icon={BarChart3}
          variant="info"
        />
      </div>

      {/* Brigade analytics panel */}
      {showAnalytics && analytics && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            {t.production.brigadeAnalytics} (so'nggi 30 kun)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.map((b) => (
              <div key={b.brigade} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-primary">{b.brigade}-brigada</div>
                <div className="text-2xl font-bold mt-1">
                  {b.avg_conversion ? `${b.avg_conversion.toFixed(1)}%` : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">o'rtacha konversiya</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {b.report_count} xisobot
                </div>
                {b.total_output && (
                  <div className="text-xs font-medium mt-1">
                    {formatWeight(b.total_output)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              statusFilter === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable<ProductionShiftReport>
        loading={isLoading}
        data={reportsPage ?? []}
        rowKey={(r) => r.id}
        emptyText="Smena xisobotlari topilmadi"
        columns={[
          {
            key: "report_number",
            header: t.production.colReport,
            className: "font-mono font-medium",
          },
          {
            key: "production_line_name",
            header: t.production.colLine,
          },
          {
            key: "shift_date",
            header: t.production.colDate,
            render: (r) => formatDate(r.shift_date),
          },
          {
            key: "shift_display",
            header: t.production.colShift,
            render: (r) => (
              <span className="text-xs text-muted-foreground">
                {r.shift_display} · {r.brigade}-brigada
              </span>
            ),
          },
          {
            key: "total_output_kg",
            header: t.production.colOutputKg,
            className: "tabular text-right",
            render: (r) => formatWeight(r.total_output_kg),
          },
          {
            key: "conversion_rate",
            header: t.production.colConversion,
            className: "tabular text-right",
            render: (r) => (
              <span className={cn(
                "font-medium",
                parseFloat(r.conversion_rate) < 85 ? "text-red-500" : "text-green-600"
              )}>
                {formatPct(r.conversion_rate)}
              </span>
            ),
          },
          {
            key: "oee_availability",
            header: t.production.colOEE,
            className: "tabular text-right",
            render: (r) => formatPct(r.oee_availability),
          },
          {
            key: "downtime_hours",
            header: t.production.colDowntime,
            className: "tabular text-right",
            render: (r) => `${r.downtime_hours}h`,
          },
          {
            key: "supervisor_name",
            header: t.production.colSupervisor,
            render: (r) => (
              <span className="text-sm text-muted-foreground">{r.supervisor_name}</span>
            ),
          },
          {
            key: "status",
            header: t.production.colStatus,
            render: (r) => (
              <ReportStatusBadge status={r.status} label={r.status_display} />
            ),
          },
          {
            key: "id",
            header: "",
            render: (r) => (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {r.status === "draft" && (
                  <button
                    onClick={() => submitMutation.mutate(r.id)}
                    disabled={submitMutation.isPending}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {submitMutation.isPending
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : t.production.submitReport}
                  </button>
                )}
                {r.status === "submitted" && (
                  <button
                    onClick={() => approveMutation.mutate(r.id)}
                    disabled={approveMutation.isPending}
                    className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    {approveMutation.isPending
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : t.production.approveReport}
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      {showNew && <NewShiftReportModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
