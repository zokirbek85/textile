"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, Plus, Package, Truck, FileText, Factory } from "lucide-react";
import { tollingApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney, formatWeight } from "@/lib/utils";
import { toast } from "sonner";
import { ReceiveRawMaterialModal } from "@/components/tolling/ReceiveRawMaterialModal";
import { CreateDeliveryModal } from "@/components/tolling/CreateDeliveryModal";
import { RecordPaymentModal } from "@/components/tolling/RecordPaymentModal";
import type { TollingRawReceipt, TollingDelivery, TollingInvoice } from "@/types";

type DetailTab = "receipts" | "deliveries" | "invoices";

export default function TollingContractDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>("receipts");
  const [showReceive, setShowReceive] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["tolling-contract", id],
    queryFn: () => tollingApi.getContract(id).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ["tolling-contract-stats", id],
    queryFn: () => tollingApi.getContractStats(id).then((r) => r.data),
  });

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ["tolling-receipts", id],
    queryFn: () => tollingApi.getContractReceipts(id).then((r) => r.data),
    enabled: activeTab === "receipts",
  });

  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ["tolling-deliveries", id],
    queryFn: () => tollingApi.getContractDeliveries(id).then((r) => r.data),
    enabled: activeTab === "deliveries",
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["tolling-contract-invoices", id],
    queryFn: () => tollingApi.getContractInvoices(id).then((r) => r.data),
    enabled: activeTab === "invoices",
  });

  const activateMutation = useMutation({
    mutationFn: () => tollingApi.activateContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolling-contract", id] });
      queryClient.invalidateQueries({ queryKey: ["tolling-contracts"] });
      toast.success(t.tolling.statusActive);
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (receiptId: string) => tollingApi.receiveRawMaterial(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolling-receipts", id] });
      queryClient.invalidateQueries({ queryKey: ["tolling-contract-stats", id] });
      toast.success(t.tolling.received);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Error");
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (deliveryId: string) => tollingApi.completeDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolling-deliveries", id] });
      queryClient.invalidateQueries({ queryKey: ["tolling-contract-invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["tolling-contract-stats", id] });
      queryClient.invalidateQueries({ queryKey: ["tolling-invoices"] });
      toast.success(t.tolling.delivered);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Error");
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-700 dark:bg-green-900/20",
    suspended: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20",
  };

  const RECEIPT_STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    received: "bg-green-100 text-green-700 dark:bg-green-900/20",
    in_production: "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
    completed: "bg-violet-100 text-violet-700 dark:bg-violet-900/20",
  };

  const INVOICE_STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    issued: "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/20",
    partially_paid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/20",
    cancelled: "bg-muted text-muted-foreground",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) return null;

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: "receipts", label: t.tolling.receipts, icon: Package },
    { id: "deliveries", label: t.tolling.deliveries, icon: Truck },
    { id: "invoices", label: t.tolling.invoices, icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/tolling")}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> {t.tolling.contracts}
          </button>
          <h1 className="text-2xl font-bold">{contract.contract_number}</h1>
          <p className="text-muted-foreground mt-0.5">{contract.customer_name}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded font-medium",
                STATUS_COLORS[contract.status]
              )}
            >
              {contract.status_display}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
            </span>
            <span className="text-xs text-muted-foreground">
              {contract.processor_share_pct}% / {contract.customer_share_pct}% /{" "}
              {contract.loss_share_pct}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {contract.status === "draft" && (
            <button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {activateMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t.tolling.activate}
            </button>
          )}
          {activeTab === "receipts" && (
            <button
              onClick={() => setShowReceive(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.tolling.newReceipt}
            </button>
          )}
          {activeTab === "deliveries" && (
            <button
              onClick={() => setShowDelivery(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.tolling.newDelivery}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            title={t.tolling.totalFiberReceived}
            value={`${parseFloat(stats.total_fiber_received_kg).toLocaleString()} kg`}
            icon={Package}
          />
          <KpiCard
            title={t.tolling.totalYarnProduced}
            value={`${parseFloat(stats.total_yarn_produced_kg).toLocaleString()} kg`}
            icon={Factory}
          />
          <KpiCard
            title={t.tolling.customerYarnKg}
            value={`${parseFloat(stats.total_customer_yarn_kg).toLocaleString()} kg`}
            icon={Truck}
          />
          <KpiCard
            title={t.tolling.totalServiceFee}
            value={formatMoney(stats.total_service_fee)}
            icon={FileText}
            variant="success"
          />
          <KpiCard
            title={t.tolling.totalPaid}
            value={formatMoney(stats.total_paid)}
            icon={FileText}
            variant="info"
          />
          <KpiCard
            title={t.tolling.contractBalance}
            value={formatMoney(stats.balance_due)}
            icon={FileText}
            variant={parseFloat(stats.balance_due) > 0 ? "warning" : "success"}
          />
        </div>
      )}

      {/* Contract details card */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{t.tolling.yarnPriceUsd}</p>
          <p className="font-medium">${contract.yarn_price_usd}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.tolling.exchangeRate}</p>
          <p className="font-medium">{parseFloat(contract.exchange_rate).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.tolling.targetYarnProduct}</p>
          <p className="font-medium">{contract.target_yarn_product_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.tolling.paymentTermDays}</p>
          <p className="font-medium">{contract.payment_term_days}d</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Receipts tab */}
      {activeTab === "receipts" && (
        <DataTable<TollingRawReceipt>
          loading={receiptsLoading}
          data={receipts ?? []}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "receipt_number",
              header: t.tolling.receiptNumber,
              className: "font-mono font-medium",
            },
            {
              key: "receipt_date",
              header: t.tolling.receiptDate,
              render: (r) => formatDate(r.receipt_date),
            },
            { key: "fiber_product_name", header: t.tolling.fiberProduct },
            {
              key: "quantity_kg",
              header: t.tolling.quantityKg,
              className: "tabular text-right",
              render: (r) => formatWeight(r.quantity_kg),
            },
            { key: "quality_grade", header: t.tolling.qualityGrade },
            { key: "ttn_number", header: t.tolling.ttnNumber },
            {
              key: "status",
              header: t.tolling.status,
              render: (r) => (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    RECEIPT_STATUS_COLORS[r.status]
                  )}
                >
                  {r.status_display}
                </span>
              ),
            },
            {
              key: "id",
              header: "",
              render: (r) =>
                r.status === "draft" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      receiveMutation.mutate(r.id);
                    }}
                    disabled={receiveMutation.isPending}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium disabled:opacity-60"
                  >
                    {t.tolling.receiveBtn}
                  </button>
                ) : null,
            },
          ]}
        />
      )}

      {/* Deliveries tab */}
      {activeTab === "deliveries" && (
        <DataTable<TollingDelivery>
          loading={deliveriesLoading}
          data={deliveries ?? []}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "delivery_number",
              header: t.tolling.deliveryNumber,
              className: "font-mono font-medium",
            },
            {
              key: "delivery_date",
              header: t.tolling.deliveryDate,
              render: (r) => formatDate(r.delivery_date),
            },
            { key: "batch_code", header: "Batch", className: "font-mono text-xs" },
            {
              key: "quantity_kg",
              header: t.tolling.quantityKg,
              className: "tabular text-right",
              render: (r) => formatWeight(r.quantity_kg),
            },
            {
              key: "status",
              header: t.tolling.status,
              render: (r) => (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    r.status === "delivered"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20"
                      : r.status === "cancelled"
                      ? "bg-muted text-muted-foreground"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20"
                  )}
                >
                  {r.status_display}
                </span>
              ),
            },
            { key: "recipient_name", header: "Recipient" },
            {
              key: "id",
              header: "",
              render: (r) =>
                r.status === "pending" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deliverMutation.mutate(r.id);
                    }}
                    disabled={deliverMutation.isPending}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium disabled:opacity-60"
                  >
                    {t.tolling.deliverBtn}
                  </button>
                ) : null,
            },
          ]}
        />
      )}

      {/* Invoices tab */}
      {activeTab === "invoices" && (
        <DataTable<TollingInvoice>
          loading={invoicesLoading}
          data={invoices ?? []}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "invoice_number",
              header: t.tolling.invoiceNumber,
              className: "font-mono font-medium",
            },
            {
              key: "invoice_date",
              header: t.tolling.invoiceDate,
              render: (r) => formatDate(r.invoice_date),
            },
            { key: "batch_code", header: "Batch", className: "font-mono text-xs" },
            {
              key: "total_amount",
              header: t.tolling.totalAmount,
              className: "tabular text-right font-medium",
              render: (r) => formatMoney(r.total_amount),
            },
            {
              key: "paid_amount",
              header: t.tolling.paidAmount,
              className: "tabular text-right",
              render: (r) => formatMoney(r.paid_amount),
            },
            {
              key: "balance_due",
              header: t.tolling.balanceDue,
              className: "tabular text-right font-bold",
              render: (r) => (
                <span
                  className={
                    parseFloat(r.balance_due) > 0 ? "text-red-500" : "text-green-600"
                  }
                >
                  {formatMoney(r.balance_due)}
                </span>
              ),
            },
            {
              key: "status",
              header: t.tolling.status,
              render: (r) => (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    INVOICE_STATUS_COLORS[r.status]
                  )}
                >
                  {r.status_display}
                </span>
              ),
            },
            {
              key: "id",
              header: "",
              render: (r) =>
                r.status === "issued" ||
                r.status === "partially_paid" ||
                r.status === "overdue" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPayment(r.id);
                    }}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium"
                  >
                    {t.tolling.recordPayment}
                  </button>
                ) : null,
            },
          ]}
        />
      )}

      {showReceive && (
        <ReceiveRawMaterialModal contractId={id} onClose={() => setShowReceive(false)} />
      )}
      {showDelivery && (
        <CreateDeliveryModal contractId={id} onClose={() => setShowDelivery(false)} />
      )}
      {showPayment && (
        <RecordPaymentModal
          invoiceId={showPayment}
          contractId={id}
          onClose={() => setShowPayment(null)}
        />
      )}
    </div>
  );
}
