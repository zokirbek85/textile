"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { maintenanceApi } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function DowntimePage() {
  const t = useT();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveData, setResolveData] = useState({ action_taken: "", production_loss_kg: "0" });
  const [reportModal, setReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    equipment: "",
    downtime_type: "breakdown",
    reason: "",
    problem_description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-downtime", statusFilter],
    queryFn: () =>
      maintenanceApi
        .listDowntime({ status: statusFilter || undefined })
        .then((r) => r.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ["maintenance-downtime-analytics"],
    queryFn: () => maintenanceApi.getDowntimeAnalytics().then((r) => r.data),
  });

  const { data: equipment } = useQuery({
    queryKey: ["maintenance-equipment-all"],
    queryFn: () => maintenanceApi.listEquipment({ page_size: 200 }).then((r) => r.data.results),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof resolveData }) =>
      maintenanceApi.resolveDowntime(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-downtime"] });
      qc.invalidateQueries({ queryKey: ["maintenance-downtime-analytics"] });
      setResolveId(null);
    },
  });

  const reportMut = useMutation({
    mutationFn: (data: typeof reportData) => maintenanceApi.createDowntime(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-downtime"] });
      setReportModal(false);
      setReportData({ equipment: "", downtime_type: "breakdown", reason: "", problem_description: "" });
    },
  });

  const records = data?.results ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold">{t.maintenance.downtime}</h1>
        </div>
        <button
          onClick={() => setReportModal(true)}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
        >
          {t.maintenance.reportDowntime}
        </button>
      </div>

      {/* Analytics Strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: analytics.total_events },
            { label: t.maintenance.totalDowntime, value: `${parseFloat(analytics.total_hours).toFixed(1)} h` },
            { label: t.maintenance.mttr, value: `${parseFloat(analytics.mttr_hours).toFixed(1)} h` },
            { label: "Types", value: Object.keys(analytics.by_type).length },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div>
        <select
          className="px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">{t.maintenance.active}</option>
          <option value="resolved">{t.maintenance.resolved}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.downtimeNumber}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colEquipment}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colReason}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.startTime}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colDuration}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colStatus}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : !records.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{t.maintenance.noDowntime}</td></tr>
            ) : (
              records.map((dt) => (
                <tr key={dt.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{dt.downtime_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{dt.equipment_code}</p>
                    <p className="text-xs text-muted-foreground">{dt.downtime_type_display}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-sm">{dt.reason}</td>
                  <td className="px-4 py-3 text-xs">{new Date(dt.start_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">
                    {dt.duration_hours ? `${parseFloat(dt.duration_hours).toFixed(1)} h` : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3 h-3" /> Ongoing
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      dt.status === "active"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {dt.status_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {dt.status === "active" && (
                      <button
                        onClick={() => setResolveId(dt.id)}
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                      >
                        {t.maintenance.resolve}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Modal */}
      {resolveId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />{t.maintenance.resolve} Downtime
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.actionTaken} *</label>
                <textarea
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none resize-none"
                  rows={3}
                  value={resolveData.action_taken}
                  onChange={(e) => setResolveData((p) => ({ ...p, action_taken: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.productionLoss}</label>
                <input
                  type="number"
                  step="0.001"
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={resolveData.production_loss_kg}
                  onChange={(e) => setResolveData((p) => ({ ...p, production_loss_kg: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setResolveId(null)} className="px-4 py-2 rounded border text-sm hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={() => resolveMut.mutate({ id: resolveId, data: resolveData })}
                disabled={!resolveData.action_taken || resolveMut.isPending}
                className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {resolveMut.isPending ? "Saving…" : t.maintenance.resolved}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />{t.maintenance.reportDowntime}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.colEquipment} *</label>
                <select
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={reportData.equipment}
                  onChange={(e) => setReportData((p) => ({ ...p, equipment: e.target.value }))}
                >
                  <option value="">Select equipment…</option>
                  {equipment?.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.equipment_code} — {eq.equipment_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.downtimeType}</label>
                <select
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={reportData.downtime_type}
                  onChange={(e) => setReportData((p) => ({ ...p, downtime_type: e.target.value }))}
                >
                  <option value="breakdown">Breakdown</option>
                  <option value="planned_maintenance">Planned Maintenance</option>
                  <option value="setup">Setup</option>
                  <option value="material_shortage">Material Shortage</option>
                  <option value="power_outage">Power Outage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.reason} *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={reportData.reason}
                  onChange={(e) => setReportData((p) => ({ ...p, reason: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Problem Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none resize-none"
                  rows={2}
                  value={reportData.problem_description}
                  onChange={(e) => setReportData((p) => ({ ...p, problem_description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setReportModal(false)} className="px-4 py-2 rounded border text-sm hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={() => reportMut.mutate(reportData)}
                disabled={!reportData.equipment || !reportData.reason || reportMut.isPending}
                className="px-4 py-2 rounded bg-amber-500 text-white text-sm hover:bg-amber-600 disabled:opacity-50"
              >
                {reportMut.isPending ? "Saving…" : t.maintenance.reportDowntime}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
