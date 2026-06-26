"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Search } from "lucide-react";
import { qualityApi } from "@/lib/api";
import { useT } from "@/lib/i18n";

type StatusFilter = "" | "open" | "investigating" | "resolved" | "closed";
type SeverityFilter = "" | "critical" | "major" | "minor";

export default function QualityDefectsPage() {
  const t = useT();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("");
  const [search, setSearch] = useState("");
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [resolveData, setResolveData] = useState({ disposition: "reprocess", root_cause: "", corrective_action: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["quality-defects", statusFilter, severityFilter, search],
    queryFn: () =>
      qualityApi.listDefects({
        status: statusFilter || undefined,
        "defect_type__severity": severityFilter || undefined,
        search: search || undefined,
        page_size: 50,
      }).then((r) => r.data.results),
  });

  const resolveMut = useMutation({
    mutationFn: (id: string) => qualityApi.resolveDefect(id, resolveData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quality-defects"] });
      setResolveModal(null);
      setResolveData({ disposition: "reprocess", root_cause: "", corrective_action: "" });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">{t.quality.defects}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search defect # or description…"
            className="pl-9 pr-3 py-2 text-sm border rounded-lg bg-background w-52 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          <option value="open">{t.quality.defectOpen}</option>
          <option value="investigating">{t.quality.defectInvestigating}</option>
          <option value="resolved">{t.quality.defectResolved2}</option>
          <option value="closed">{t.quality.defectClosed}</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{t.quality.noDefects}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {[t.quality.colDefect, t.quality.colBatch, t.quality.colType, t.quality.colSeverity,
                    t.quality.colQty, "% of Batch", t.quality.detectedDate, t.quality.detectedBy,
                    t.quality.colStatus, ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-accent transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{d.defect_number}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.batch_number}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium">{d.defect_type_code}</div>
                      <div className="text-muted-foreground">{d.defect_type_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={d.defect_severity} />
                    </td>
                    <td className="px-4 py-3 text-xs">{parseFloat(d.quantity_affected_kg).toFixed(1)} kg</td>
                    <td className="px-4 py-3 text-xs">{parseFloat(d.percentage_of_batch).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(d.detected_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{d.detected_by_name}</td>
                    <td className="px-4 py-3">
                      <DefectStatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3">
                      {(d.status === "open" || d.status === "investigating") && (
                        <button
                          onClick={() => setResolveModal(d.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {t.quality.resolveDefect}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="font-semibold text-lg">{t.quality.resolveDefect}</h3>
            <div>
              <label className="text-sm font-medium">{t.quality.disposition}</label>
              <select
                value={resolveData.disposition}
                onChange={(e) => setResolveData((p) => ({ ...p, disposition: e.target.value }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="use_as_is">Use As-Is</option>
                <option value="reprocess">Reprocess</option>
                <option value="downgrade">Downgrade</option>
                <option value="scrap">Scrap</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t.quality.rootCause}</label>
              <textarea
                value={resolveData.root_cause}
                onChange={(e) => setResolveData((p) => ({ ...p, root_cause: e.target.value }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={2}
                placeholder="Describe root cause…"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.quality.correctiveAction}</label>
              <textarea
                value={resolveData.corrective_action}
                onChange={(e) => setResolveData((p) => ({ ...p, corrective_action: e.target.value }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={2}
                placeholder="Corrective action taken…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setResolveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
              <button
                onClick={() => resolveMut.mutate(resolveModal)}
                disabled={!resolveData.root_cause.trim() || !resolveData.corrective_action.trim() || resolveMut.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60"
              >
                {resolveMut.isPending ? "Saving…" : t.quality.resolveDefect}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    major: "bg-orange-100 text-orange-800",
    minor: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[severity] ?? "bg-gray-100 text-gray-800"}`}>
      {severity}
    </span>
  );
}

function DefectStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-red-100 text-red-800",
    investigating: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
