"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Factory, Plus, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Package, Layers, Activity,
} from "lucide-react";
import { productionApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatWeight, formatDate, formatPct, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { ProductionOrder } from "@/types";
import { NewProductionOrderModal } from "@/components/production/NewProductionOrderModal";

const ORDER_STATUS_CLASSES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
      ORDER_STATUS_CLASSES[status] ?? "bg-slate-100 text-slate-600"
    )}>
      {label}
    </span>
  );
}

export default function ProductionOrdersPage() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: dashboard } = useQuery({
    queryKey: ["production-dashboard"],
    queryFn: () => productionApi.getDashboard().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: ordersPage, isLoading } = useQuery({
    queryKey: ["production-orders", statusFilter],
    queryFn: () =>
      productionApi.listOrders({
        page_size: 50,
        ordering: "-planned_start_date",
        ...(statusFilter ? { status: statusFilter } : {}),
      }).then((r) => r.data.results),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => productionApi.approveOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      toast.success(t.production.orderApproved);
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => productionApi.startOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      toast.success(t.production.orderStarted);
    },
  });

  const STATUS_TABS = [
    { key: "", label: "Barchasi" },
    { key: "draft", label: "Qoralama" },
    { key: "approved", label: "Tasdiqlangan" },
    { key: "in_progress", label: "Jarayonda" },
    { key: "completed", label: "Yakunlangan" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.production.ordersTab}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ishlab chiqarish buyurtmalari — Production Orders
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.production.newOrder}
        </button>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={t.production.ordersInProgress}
            value={dashboard.orders_in_progress}
            icon={Activity}
            variant="info"
          />
          <KpiCard
            title={t.production.ordersDelayed}
            value={dashboard.orders_delayed}
            icon={AlertTriangle}
            variant={dashboard.orders_delayed > 0 ? "danger" : "default"}
          />
          <KpiCard
            title={t.production.outputToday}
            value={formatWeight(dashboard.total_output_today_kg)}
            icon={Package}
          />
          <KpiCard
            title={t.production.pendingQC}
            value={dashboard.pending_qc_batches}
            icon={CheckCircle2}
            variant={dashboard.pending_qc_batches > 0 ? "warning" : "default"}
          />
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
              statusFilter === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <DataTable<ProductionOrder>
        loading={isLoading}
        data={ordersPage ?? []}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/production/orders/${r.id}`)}
        columns={[
          {
            key: "order_number",
            header: t.production.colOrder,
            className: "font-mono font-medium",
          },
          {
            key: "order_type",
            header: "Tur",
            render: (r) => (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded font-medium",
                r.order_type === "tolling"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                  : r.order_type === "state"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
              )}>
                {r.order_type_display}
              </span>
            ),
          },
          {
            key: "status",
            header: t.production.colStatus,
            render: (r) => (
              <OrderStatusBadge status={r.status} label={r.status_display} />
            ),
          },
          {
            key: "production_line_name",
            header: t.production.colLine,
          },
          {
            key: "shift_display",
            header: t.production.colShift,
            render: (r) => (
              <span className="text-xs text-muted-foreground">{r.shift_display} · {r.brigade}-brigada</span>
            ),
          },
          {
            key: "planned_start_date",
            header: t.production.colPlanned,
            render: (r) => (
              <span className={cn(r.is_delayed && r.status === "in_progress" ? "text-red-500 font-medium" : "")}>
                {formatDate(r.planned_start_date)}
                {r.is_delayed && r.status === "in_progress" && (
                  <AlertTriangle className="inline w-3 h-3 ml-1" />
                )}
              </span>
            ),
          },
          {
            key: "planned_output_kg",
            header: t.production.colPlanned + " kg",
            className: "tabular text-right",
            render: (r) => formatWeight(r.planned_output_kg),
          },
          {
            key: "completion_rate",
            header: t.production.colCompletion,
            className: "tabular text-right",
            render: (r) =>
              r.status === "in_progress" || r.status === "completed"
                ? formatPct(r.completion_rate)
                : "—",
          },
          {
            key: "supervisor_name",
            header: t.production.colSupervisor,
            render: (r) => (
              <span className="text-sm text-muted-foreground">{r.supervisor_name}</span>
            ),
          },
          {
            key: "id",
            header: "",
            render: (r) => (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {r.status === "draft" && (
                  <button
                    onClick={() => approveMutation.mutate(r.id)}
                    disabled={approveMutation.isPending}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {t.production.approve}
                  </button>
                )}
                {r.status === "approved" && (
                  <button
                    onClick={() => startMutation.mutate(r.id)}
                    disabled={startMutation.isPending}
                    className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                  >
                    {t.production.startProduction}
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ),
          },
        ]}
      />

      {showNew && <NewProductionOrderModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
