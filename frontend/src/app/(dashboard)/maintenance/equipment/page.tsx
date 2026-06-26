"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, CheckCircle, AlertTriangle, XCircle, Clock, Search } from "lucide-react";
import { maintenanceApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { EquipmentStatus } from "@/types";

const STATUS_STYLES: Record<EquipmentStatus, string> = {
  operational: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  maintenance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  breakdown: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  idle: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  decommissioned: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-500",
};

const STATUS_ICONS: Record<EquipmentStatus, typeof CheckCircle> = {
  operational: CheckCircle,
  maintenance: Wrench,
  breakdown: XCircle,
  idle: Clock,
  decommissioned: XCircle,
};

export default function EquipmentPage() {
  const t = useT();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-equipment", search, statusFilter],
    queryFn: () =>
      maintenanceApi
        .listEquipment({ search: search || undefined, status: statusFilter || undefined })
        .then((r) => r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ["maintenance-equipment-detail", selectedId],
    queryFn: () => maintenanceApi.getEquipment(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  });

  const { data: history } = useQuery({
    queryKey: ["maintenance-equipment-history", selectedId],
    queryFn: () => maintenanceApi.getEquipmentHistory(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      maintenanceApi.updateEquipmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-equipment"] });
      qc.invalidateQueries({ queryKey: ["maintenance-equipment-detail", selectedId] });
      setNewStatus("");
    },
  });

  const equipment = data?.results ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Wrench className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">{t.maintenance.equipment}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="pl-8 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
            placeholder={`${t.maintenance.equipmentCode} / ${t.maintenance.manufacturer}…`}
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
          <option value="operational">{t.maintenance.statusOperational}</option>
          <option value="maintenance">{t.maintenance.statusMaintenance}</option>
          <option value="breakdown">{t.maintenance.statusBreakdown}</option>
          <option value="idle">{t.maintenance.statusIdle}</option>
          <option value="decommissioned">{t.maintenance.statusDecommissioned}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Equipment List */}
        <div className="xl:col-span-2 rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colEquipment}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colType}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colStatus}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colNext}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</td>
                </tr>
              ) : !equipment.length ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">{t.maintenance.noEquipment}</td>
                </tr>
              ) : (
                equipment.map((eq) => {
                  const Icon = STATUS_ICONS[eq.status];
                  return (
                    <tr
                      key={eq.id}
                      className={`border-t cursor-pointer hover:bg-muted/40 transition-colors ${selectedId === eq.id ? "bg-muted/60" : ""}`}
                      onClick={() => setSelectedId(eq.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{eq.equipment_code}</p>
                        <p className="text-xs text-muted-foreground">{eq.equipment_name}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{eq.equipment_type_display}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[eq.status]}`}>
                          <Icon className="w-3 h-3" />
                          {eq.status_display}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {eq.is_overdue ? (
                          <span className="text-red-600 text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />{t.maintenance.overdueAlert}
                          </span>
                        ) : eq.next_maintenance_due ? (
                          <span className="text-xs">{eq.next_maintenance_due}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">Select equipment to view details.</p>
          ) : !detail ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div>
                <h2 className="font-semibold">{detail.equipment_code}</h2>
                <p className="text-sm text-muted-foreground">{detail.equipment_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  [t.maintenance.equipmentType, detail.equipment_type_display],
                  [t.maintenance.manufacturer, detail.manufacturer],
                  [t.maintenance.model, detail.model],
                  [t.maintenance.location, detail.location || "—"],
                  [t.maintenance.lastMaintenance, detail.last_maintenance_date ?? "—"],
                  [t.maintenance.operatingHours, detail.total_operating_hours],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-medium">{val}</p>
                  </div>
                ))}
              </div>

              {/* Update Status */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t.maintenance.status}</p>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-2 py-1.5 rounded border bg-background text-sm focus:outline-none"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">Change status…</option>
                    <option value="operational">{t.maintenance.statusOperational}</option>
                    <option value="maintenance">{t.maintenance.statusMaintenance}</option>
                    <option value="breakdown">{t.maintenance.statusBreakdown}</option>
                    <option value="idle">{t.maintenance.statusIdle}</option>
                  </select>
                  <button
                    disabled={!newStatus || updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: detail.id, status: newStatus })}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50"
                  >
                    OK
                  </button>
                </div>
              </div>

              {/* Maintenance History */}
              {history && history.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent Maintenance</p>
                  <div className="space-y-1.5">
                    {history.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="flex justify-between text-xs border-b pb-1">
                        <span>{rec.record_number}</span>
                        <span className="text-muted-foreground">{rec.scheduled_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
