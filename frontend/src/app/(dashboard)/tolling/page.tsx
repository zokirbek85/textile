"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight } from "lucide-react";
import { tollingApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney } from "@/lib/utils";
import { CreateContractModal } from "@/components/tolling/CreateContractModal";
import type { TollingContract, TollingInvoice } from "@/types";

export default function TollingPage() {
  const t = useT();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"contracts" | "invoices">("contracts");
  const [showCreateContract, setShowCreateContract] = useState(false);

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["tolling-contracts"],
    queryFn: () => tollingApi.listContracts({ page_size: 100 }).then((r) => r.data.results),
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["tolling-invoices"],
    queryFn: () => tollingApi.listInvoices({ page_size: 100 }).then((r) => r.data.results),
    enabled: activeTab === "invoices",
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-700 dark:bg-green-900/20",
    suspended: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20",
  };

  const INVOICE_STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    issued: "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/20",
    partially_paid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/20",
    cancelled: "bg-muted text-muted-foreground",
  };

  const tabs = [
    { id: "contracts" as const, label: t.tolling.contracts },
    { id: "invoices" as const, label: t.tolling.invoices },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.tolling.title}</h1>
        {activeTab === "contracts" && (
          <button
            onClick={() => setShowCreateContract(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t.tolling.newContract}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "contracts" && (
        <DataTable<TollingContract>
          loading={contractsLoading}
          data={contracts ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/tolling/${r.id}`)}
          columns={[
            {
              key: "contract_number",
              header: t.tolling.contractNumber,
              className: "font-mono font-medium",
            },
            { key: "customer_name", header: t.tolling.customer },
            {
              key: "status",
              header: t.tolling.status,
              render: (r) => (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    STATUS_COLORS[r.status] ?? "bg-muted"
                  )}
                >
                  {r.status_display}
                </span>
              ),
            },
            { key: "target_yarn_product_name", header: t.tolling.targetYarnProduct },
            {
              key: "start_date",
              header: t.tolling.startDate,
              render: (r) => formatDate(r.start_date),
            },
            {
              key: "end_date",
              header: t.tolling.endDate,
              render: (r) => formatDate(r.end_date),
            },
            {
              key: "days_until_expiry",
              header: t.tolling.daysUntilExpiry,
              render: (r) =>
                r.status === "active" ? (
                  <span
                    className={cn(
                      "text-xs font-medium tabular",
                      r.days_until_expiry < 30 ? "text-red-500" : ""
                    )}
                  >
                    {r.days_until_expiry}d
                  </span>
                ) : (
                  "—"
                ),
            },
            {
              key: "id",
              header: "",
              render: () => <ChevronRight className="w-4 h-4 text-muted-foreground" />,
            },
          ]}
        />
      )}

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
            { key: "customer_name", header: t.tolling.customer },
            { key: "batch_code", header: "Batch", className: "font-mono text-xs" },
            {
              key: "invoice_date",
              header: t.tolling.invoiceDate,
              render: (r) => formatDate(r.invoice_date),
            },
            {
              key: "status",
              header: t.tolling.status,
              render: (r) => (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    INVOICE_STATUS_COLORS[r.status] ?? "bg-muted"
                  )}
                >
                  {r.status_display}
                </span>
              ),
            },
            {
              key: "total_amount",
              header: t.tolling.totalAmount,
              className: "tabular text-right font-medium",
              render: (r) => formatMoney(r.total_amount),
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
              key: "payment_due_date",
              header: t.tolling.paymentDue,
              render: (r) => formatDate(r.payment_due_date),
            },
          ]}
        />
      )}

      {showCreateContract && (
        <CreateContractModal onClose={() => setShowCreateContract(false)} />
      )}
    </div>
  );
}
