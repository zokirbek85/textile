"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Wrench, AlertTriangle, Package, TrendingUp, ChevronRight, Clock } from "lucide-react";
import { maintenanceApi } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { useT } from "@/lib/i18n";

export default function MaintenancePage() {
  const t = useT();
  const router = useRouter();

  const { data: oeeDash } = useQuery({
    queryKey: ["maintenance-oee-dashboard"],
    queryFn: () => maintenanceApi.getOEEDashboard().then((r) => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["maintenance-upcoming"],
    queryFn: () => maintenanceApi.getUpcoming(14).then((r) => r.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ["maintenance-low-stock"],
    queryFn: () => maintenanceApi.getLowStock().then((r) => r.data),
  });

  const { data: activeDowntime } = useQuery({
    queryKey: ["maintenance-downtime-active"],
    queryFn: () => maintenanceApi.listDowntime({ status: "active" }).then((r) => r.data.results),
  });

  const { data: costSummary } = useQuery({
    queryKey: ["maintenance-cost-summary"],
    queryFn: () => maintenanceApi.getCostSummary().then((r) => r.data),
  });

  const modules = [
    {
      label: t.maintenance.equipment,
      icon: Wrench,
      href: "/maintenance/equipment",
      desc: "Equipment registry, status, and history",
      color: "bg-blue-500",
    },
    {
      label: t.maintenance.records,
      icon: TrendingUp,
      href: "/maintenance/records",
      desc: "Maintenance records, preventive and corrective",
      color: "bg-green-500",
    },
    {
      label: t.maintenance.downtime,
      icon: Clock,
      href: "/maintenance/downtime",
      desc: "Equipment downtime events and analytics",
      color: "bg-amber-500",
    },
    {
      label: t.maintenance.spareParts,
      icon: Package,
      href: "/maintenance/spare-parts",
      desc: "Spare parts inventory and stock levels",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t.maintenance.title}</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title={t.maintenance.avgOEE}
          value={oeeDash ? `${parseFloat(oeeDash.avg_oee).toFixed(1)}%` : "—"}
          icon={TrendingUp}
          variant="info"
          subtitle={`Availability ${oeeDash ? parseFloat(oeeDash.avg_availability).toFixed(1) : "—"}%`}
        />
        <KpiCard
          title={t.maintenance.activeDowntime}
          value={activeDowntime?.length ?? "—"}
          icon={AlertTriangle}
          variant={activeDowntime && activeDowntime.length > 0 ? "danger" : "success"}
          subtitle={t.maintenance.downtime}
        />
        <KpiCard
          title={t.maintenance.lowStockAlert}
          value={lowStock?.length ?? "—"}
          icon={Package}
          variant={lowStock && lowStock.length > 0 ? "warning" : "success"}
          subtitle={t.maintenance.spareParts}
        />
        <KpiCard
          title={t.maintenance.maintenanceCost}
          value={costSummary ? `${(parseFloat(costSummary.grand_total) / 1_000_000).toFixed(1)}M` : "—"}
          icon={Wrench}
          variant="default"
          subtitle="UZS (all time)"
        />
      </div>

      {/* Module Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <button
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="rounded-xl border bg-card p-5 text-left hover:shadow-md transition-shadow flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mod.color}`}>
              <mod.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{mod.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground self-end" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* OEE by Equipment */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">{t.maintenance.oeeTitle}</h2>
          {!oeeDash?.by_equipment?.length ? (
            <p className="text-sm text-muted-foreground">{t.maintenance.noEquipment}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-1.5 font-medium">{t.maintenance.colEquipment}</th>
                  <th className="text-right py-1.5 font-medium">{t.maintenance.oee}</th>
                </tr>
              </thead>
              <tbody>
                {oeeDash.by_equipment.slice(0, 8).map((row) => {
                  const oee = parseFloat(row.latest_oee);
                  return (
                    <tr key={row.equipment_code} className="border-b last:border-0">
                      <td className="py-1.5">
                        <p className="font-medium">{row.equipment_code}</p>
                        <p className="text-xs text-muted-foreground">{row.equipment_name}</p>
                      </td>
                      <td className="text-right py-1.5">
                        <span
                          className={`font-bold ${
                            oee >= 85 ? "text-green-600" : oee >= 65 ? "text-amber-500" : "text-red-500"
                          }`}
                        >
                          {oee.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming Maintenance */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">{t.maintenance.upcomingMaintenance}</h2>
          {!upcoming?.length ? (
            <p className="text-sm text-muted-foreground">{t.maintenance.noRecords}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 6).map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1"
                  onClick={() => router.push(`/maintenance/equipment`)}
                >
                  <div>
                    <p className="text-sm font-medium">{eq.equipment_code}</p>
                    <p className="text-xs text-muted-foreground">{eq.equipment_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${eq.is_overdue ? "text-red-600" : "text-amber-500"}`}>
                      {eq.is_overdue ? t.maintenance.overdueAlert : eq.next_maintenance_due ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Downtime */}
      {activeDowntime && activeDowntime.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-sm text-red-700 dark:text-red-400">{t.maintenance.activeDowntime}</h2>
          </div>
          <div className="space-y-2">
            {activeDowntime.map((dt) => (
              <div key={dt.id} className="flex justify-between text-sm">
                <span className="font-medium">{dt.equipment_code} — {dt.reason}</span>
                <span className="text-red-600 text-xs">{new Date(dt.start_time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
