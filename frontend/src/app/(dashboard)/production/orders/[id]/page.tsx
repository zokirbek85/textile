"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Package, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Layers, Activity, Loader2,
} from "lucide-react";
import { productionApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { formatWeight, formatDate, formatPct, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { ProductionBatch } from "@/types";

const BATCH_STATUS_CLASSES: Record<string, string> = {
  in_production: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  qc_pending: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  qc_passed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  qc_failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  in_stock: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  shipped: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function BatchStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
      BATCH_STATUS_CLASSES[status] ?? "bg-slate-100 text-slate-600"
    )}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function ProductionOrderDetailPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"details" | "batches">("details");

  const { data: order, isLoading } = useQuery({
    queryKey: ["production-order", id],
    queryFn: () => productionApi.getOrder(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["production-order-batches", id],
    queryFn: () => productionApi.getOrderBatches(id).then((r) => r.data),
    enabled: !!id && activeTab === "batches",
  });

  const completeMutation = useMutation({
    mutationFn: () => productionApi.completeOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-order", id] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success(t.production.orderCompleted);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Xatolik yuz berdi");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => productionApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-order", id] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success(t.production.orderCancelled);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Buyurtma topilmadi.
      </div>
    );
  }

  const completionNum = parseFloat(order.completion_rate);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/production/orders")}
            className="mt-1 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{order.order_number}</h1>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded font-medium",
                order.order_type === "tolling"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-emerald-100 text-emerald-700"
              )}>
                {order.order_type_display}
              </span>
              <StatusBadge status={order.status} label={order.status_display} />
              {order.is_delayed && order.status === "in_progress" && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3 h-3" /> Kechikmoqda
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {order.production_line_name} · {order.shift_display} · {order.brigade}-brigada
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {order.status === "in_progress" && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {completeMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              {t.production.completeOrder}
            </button>
          )}
          {order.status !== "completed" && order.status !== "cancelled" && (
            <button
              onClick={() => {
                if (confirm("Buyurtmani bekor qilasizmi?")) cancelMutation.mutate();
              }}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-destructive text-destructive rounded-lg hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              {t.production.cancelOrder}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(order.status === "in_progress" || order.status === "completed") && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Bajarilishi / Completion</span>
            <span className="text-sm font-bold text-primary">{formatPct(order.completion_rate)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completionNum >= 100 ? "bg-green-500" : completionNum >= 50 ? "bg-amber-500" : "bg-blue-500"
              )}
              style={{ width: `${Math.min(completionNum, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              Haqiqiy: {formatWeight(order.actual_output_kg)}
            </span>
            <span className="text-xs text-muted-foreground">
              Rejalashtirilgan: {formatWeight(order.planned_output_kg)}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {([
          { key: "details", label: "Ma'lumotlar" },
          { key: "batches", label: `Partiyalar (${order.batch_count})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Order Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-0">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Buyurtma ma'lumotlari
            </h3>
            <InfoRow label="Kiruvchi mahsulot" value={order.input_product_name} />
            <InfoRow label="Chiquvchi mahsulot" value={order.output_product_name} />
            <InfoRow label="Kirish miqdori" value={formatWeight(order.input_quantity_kg)} />
            <InfoRow label="Rejalashtirilgan chiqish" value={formatWeight(order.planned_output_kg)} />
            <InfoRow label="Haqiqiy chiqish" value={formatWeight(order.actual_output_kg)} />
            <InfoRow label="Chiqindi foizi" value={formatPct(order.waste_percentage)} />
            {order.yarn_count && (
              <InfoRow label="Ip nomeri" value={
                <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-medium">
                  {order.yarn_count}
                </span>
              } />
            )}
            {order.tolling_contract_number && (
              <InfoRow label="Davalliq shartnomasi" value={order.tolling_contract_number} />
            )}
          </div>

          {/* Right: Schedule Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-0">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Jadval / Schedule
            </h3>
            <InfoRow label="Liniya" value={order.production_line_name} />
            <InfoRow label="Smena" value={order.shift_display} />
            <InfoRow label="Brigada" value={`${order.brigade}-brigada`} />
            <InfoRow label="Mas'ul" value={order.supervisor_name} />
            <InfoRow label="Boshlanish (reja)" value={formatDate(order.planned_start_date)} />
            <InfoRow label="Tugash (reja)" value={formatDate(order.planned_end_date)} />
            {order.actual_start_date && (
              <InfoRow label="Haqiqiy boshlanish" value={formatDate(order.actual_start_date)} />
            )}
            {order.actual_end_date && (
              <InfoRow label="Haqiqiy tugash" value={formatDate(order.actual_end_date)} />
            )}
            {order.approved_by_name && (
              <InfoRow label="Tasdiqlagan" value={order.approved_by_name} />
            )}
          </div>

          {order.notes && (
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Izoh
              </h3>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "batches" && (
        <DataTable<ProductionBatch>
          loading={batchesLoading}
          data={batches ?? []}
          rowKey={(r) => r.id}
          emptyText="Hali partiyalar yo'q"
          columns={[
            {
              key: "batch_number",
              header: "Partiya",
              className: "font-mono font-medium",
            },
            {
              key: "status",
              header: "Holat",
              render: (r) => (
                <BatchStatusBadge status={r.status} label={r.status_display} />
              ),
            },
            {
              key: "quantity_kg",
              header: "Miqdor",
              className: "tabular text-right",
              render: (r) => formatWeight(r.quantity_kg),
            },
            {
              key: "production_date",
              header: "Sana",
              render: (r) => formatDate(r.production_date),
            },
            {
              key: "shift_display",
              header: "Smena",
            },
            {
              key: "machine_number",
              header: "Mashina",
              render: (r) => r.machine_number || "—",
            },
            {
              key: "yarn_count_actual",
              header: "Ne (haqiqiy)",
              render: (r) =>
                r.yarn_count_actual ? (
                  <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                    {r.yarn_count_actual}
                  </span>
                ) : (
                  "—"
                ),
            },
            {
              key: "warehouse_location",
              header: "Joylashuv",
              render: (r) => r.warehouse_location || "—",
            },
          ]}
        />
      )}
    </div>
  );
}
