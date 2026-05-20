"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import { reportsApi, downloadBlob } from "@/lib/api";
import { toast } from "sonner";
import { useT, type Translations } from "@/lib/i18n";

type ReportEndpoint = "yarnCost" | "fiberCost" | "warehouseBalance" | "wasteAnalysis";

interface ReportDef {
  id: string;
  titleKey: keyof Translations["reports"];
  descKey: keyof Translations["reports"];
  endpoint: ReportEndpoint;
  hasDates: boolean;
}

const REPORT_DEFS: ReportDef[] = [
  { id: "yarn-cost", titleKey: "yarnCostTitle", descKey: "yarnCostDesc", endpoint: "yarnCost", hasDates: true },
  { id: "fiber-cost", titleKey: "fiberCostTitle", descKey: "fiberCostDesc", endpoint: "fiberCost", hasDates: true },
  { id: "warehouse-balance", titleKey: "warehouseBalanceTitle", descKey: "warehouseBalanceDesc", endpoint: "warehouseBalance", hasDates: false },
  { id: "waste-analysis", titleKey: "wasteAnalysisTitle", descKey: "wasteAnalysisDesc", endpoint: "wasteAnalysis", hasDates: true },
];

function ReportCard({ def }: { def: ReportDef }) {
  const t = useT();
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const title = t.reports[def.titleKey];
  const description = t.reports[def.descKey];

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const params = def.hasDates
        ? { start_date: startDate, end_date: endDate, format: "excel" }
        : { format: "excel" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (reportsApi[def.endpoint] as (p: any) => Promise<{ data: Blob }>)(params);
      return res.data as Blob;
    },
    onSuccess: (blob) => {
      downloadBlob(blob, `${def.id}_${today}.xlsx`);
      toast.success(`${title} ${t.reports.downloaded}`);
    },
    onError: () => toast.error(t.reports.downloadFailed),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {def.hasDates && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">{t.reports.from}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded-md bg-background"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">{t.reports.to}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded-md bg-background"
            />
          </div>
        </div>
      )}

      <button
        onClick={() => downloadMutation.mutate()}
        disabled={downloadMutation.isPending}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {downloadMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        {downloadMutation.isPending ? t.reports.generating : t.reports.downloadExcel}
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const t = useT();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t.nav.reports}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.reports.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_DEFS.map((def) => (
          <ReportCard key={def.id} def={def} />
        ))}
      </div>

      {/* Power BI info */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="text-sm font-semibold mb-1">{t.reports.powerBiTitle}</h2>
        <p className="text-xs text-muted-foreground">{t.reports.powerBiDesc}</p>
        <p className="text-xs font-mono text-muted-foreground mt-2">
          GET /api/v1/reports/yarn-cost/?format=json&amp;start_date=YYYY-MM-DD&amp;end_date=YYYY-MM-DD
        </p>
      </div>
    </div>
  );
}
