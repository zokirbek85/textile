"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, Play, CheckCircle, Search } from "lucide-react";
import { maintenanceApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { MaintenanceStatus } from "@/types";

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function MaintenanceRecordsPage() {
  const t = useT();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completeModal, setCompleteModal] = useState(false);
  const [completeData, setCompleteData] = useState({
    work_description: "",
    equipment_status_after: "operational",
    test_run_successful: true,
    labor_cost_uzs: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-records", search, statusFilter],
    queryFn: () =>
      maintenanceApi
        .listRecords({ search: search || undefined, status: statusFilter || undefined })
        .then((r) => r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ["maintenance-record-detail", selectedId],
    queryFn: () => maintenanceApi.getRecord(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  });

  const startMut = useMutation({
    mutationFn: (id: string) => maintenanceApi.startMaintenance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-records"] });
      qc.invalidateQueries({ queryKey: ["maintenance-record-detail", selectedId] });
    },
  });

  const completeMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof completeData }) =>
      maintenanceApi.completeMaintenance(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-records"] });
      qc.invalidateQueries({ queryKey: ["maintenance-record-detail", selectedId] });
      setCompleteModal(false);
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => maintenanceApi.approveMaintenance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-records"] });
      qc.invalidateQueries({ queryKey: ["maintenance-record-detail", selectedId] });
    },
  });

  const records = data?.results ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Wrench className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">{t.maintenance.records}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="pl-8 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
            placeholder={`${t.maintenance.colRecord}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t.maintenance.status} — All</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Records List */}
        <div className="xl:col-span-2 rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colRecord}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colEquipment}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colDate}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colStatus}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colCost}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
              ) : !records.length ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{t.maintenance.noRecords}</td></tr>
              ) : (
                records.map((rec) => (
                  <tr
                    key={rec.id}
                    className={`border-t cursor-pointer hover:bg-muted/40 transition-colors ${selectedId === rec.id ? "bg-muted/60" : ""}`}
                    onClick={() => setSelectedId(rec.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{rec.record_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{rec.equipment_code}</p>
                      <p className="text-xs text-muted-foreground">{rec.equipment_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{rec.scheduled_date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]}`}>
                        {rec.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {parseFloat(rec.total_cost_uzs) > 0
                        ? `${(parseFloat(rec.total_cost_uzs) / 1000).toFixed(0)}K UZS`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {!selectedId || !detail ? (
            <p className="text-sm text-muted-foreground">Select a record to view details.</p>
          ) : (
            <>
              <div>
                <h2 className="font-mono font-semibold text-sm">{detail.record_number}</h2>
                <p className="text-sm text-muted-foreground">{detail.equipment_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  [t.maintenance.maintenanceType, detail.maintenance_type_display],
                  [t.maintenance.technician, detail.technician_name],
                  [t.maintenance.scheduledDate, detail.scheduled_date],
                  [t.maintenance.duration, detail.scheduled_duration_hours + " hrs"],
                  [t.maintenance.laborCost, parseFloat(detail.labor_cost_uzs) > 0 ? `${(parseFloat(detail.labor_cost_uzs)/1000).toFixed(0)}K` : "—"],
                  [t.maintenance.partsCost, parseFloat(detail.parts_cost_uzs) > 0 ? `${(parseFloat(detail.parts_cost_uzs)/1000).toFixed(0)}K` : "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-medium">{val}</p>
                  </div>
                ))}
              </div>

              {detail.work_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t.maintenance.workDescription}</p>
                  <p className="text-sm">{detail.work_description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t">
                {detail.status === "scheduled" && (
                  <button
                    onClick={() => startMut.mutate(detail.id)}
                    disabled={startMut.isPending}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-amber-500 text-white text-sm hover:bg-amber-600 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />{t.maintenance.startMaintenance}
                  </button>
                )}
                {detail.status === "in_progress" && (
                  <button
                    onClick={() => setCompleteModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />{t.maintenance.completeMaintenance}
                  </button>
                )}
                {detail.status === "completed" && (
                  <button
                    onClick={() => approveMut.mutate(detail.id)}
                    disabled={approveMut.isPending}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />{t.maintenance.approveMaintenance}
                  </button>
                )}
              </div>

              {/* Part Usages */}
              {detail.part_usages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Parts Used</p>
                  {detail.part_usages.map((pu) => (
                    <div key={pu.id} className="flex justify-between text-xs border-b py-1">
                      <span>{pu.part_code} × {pu.quantity_used}</span>
                      <span className="text-muted-foreground">{(parseFloat(pu.total_cost_uzs)/1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Complete Modal */}
      {completeModal && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="font-semibold">{t.maintenance.completeMaintenance}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.workDescription} *</label>
                <textarea
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none resize-none"
                  rows={3}
                  value={completeData.work_description}
                  onChange={(e) => setCompleteData((p) => ({ ...p, work_description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.status} after *</label>
                <select
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={completeData.equipment_status_after}
                  onChange={(e) => setCompleteData((p) => ({ ...p, equipment_status_after: e.target.value }))}
                >
                  <option value="operational">{t.maintenance.statusOperational}</option>
                  <option value="maintenance">{t.maintenance.statusMaintenance}</option>
                  <option value="breakdown">{t.maintenance.statusBreakdown}</option>
                  <option value="idle">{t.maintenance.statusIdle}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.laborCost} (UZS) *</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                  value={completeData.labor_cost_uzs}
                  onChange={(e) => setCompleteData((p) => ({ ...p, labor_cost_uzs: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={completeData.test_run_successful}
                  onChange={(e) => setCompleteData((p) => ({ ...p, test_run_successful: e.target.checked }))}
                />
                Test run successful
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setCompleteModal(false)} className="px-4 py-2 rounded border text-sm hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={() => completeMut.mutate({ id: detail.id, data: completeData })}
                disabled={!completeData.work_description || !completeData.labor_cost_uzs || completeMut.isPending}
                className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {completeMut.isPending ? "Saving…" : t.maintenance.completeMaintenance}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
