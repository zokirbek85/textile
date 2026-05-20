"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Warehouse, Plus, Search } from "lucide-react";
import { warehouseApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { ReceiveStockModal } from "@/components/warehouse/ReceiveStockModal";
import { formatMoney, formatWeight, WAREHOUSE_TYPE_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { StockLedgerEntry } from "@/types";

export default function WarehousesPage() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"balances" | "movements" | "products">("balances");
  const [search, setSearch] = useState("");
  const [showReceive, setShowReceive] = useState(false);

  const { data: warehouses, isLoading: whLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseApi.listWarehouses({ page_size: 50 }).then((r) => r.data.results),
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ["stock-ledger", search],
    queryFn: () =>
      warehouseApi.listLedger({ page_size: 100, search }).then((r) => r.data.results),
  });

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: () =>
      warehouseApi.listMovements({ page_size: 50 }).then((r) => r.data.results),
    enabled: activeTab === "movements",
  });

  const tabs = [
    { id: "balances" as const, label: t.warehouses.stockBalances },
    { id: "movements" as const, label: t.warehouses.movements },
    { id: "products" as const, label: t.warehouses.products },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.nav.warehouses}</h1>
        <button
          onClick={() => setShowReceive(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.warehouses.receiveStock}
        </button>
      </div>

      {/* Warehouse cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {whLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))
          : (warehouses ?? []).map((wh) => (
              <div
                key={wh.id}
                className={cn(
                  "rounded-xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer",
                  "border-l-4",
                  {
                    "border-l-amber-400": wh.warehouse_type === "cotton",
                    "border-l-lime-400": wh.warehouse_type === "fiber",
                    "border-l-sky-400": wh.warehouse_type === "wip",
                    "border-l-violet-400": wh.warehouse_type === "yarn",
                    "border-l-slate-400": wh.warehouse_type === "waste",
                  }
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium truncate">{wh.name}</span>
                </div>
                <p className="text-sm font-bold tabular">{formatMoney(wh.total_stock_value)}</p>
                <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium mt-1 inline-block",
                  WAREHOUSE_TYPE_COLORS[wh.warehouse_type] ?? "bg-muted")}>
                  {wh.warehouse_type_display}
                </span>
              </div>
            ))}
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

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.common.searchProducts}
          className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Stock Balances */}
      {activeTab === "balances" && (
        <DataTable<StockLedgerEntry>
          loading={ledgerLoading}
          data={ledger ?? []}
          rowKey={(r) => r.id}
          columns={[
            { key: "warehouse_name", header: t.warehouses.colWarehouse },
            { key: "product_name", header: t.warehouses.colProduct },
            {
              key: "product_type",
              header: t.warehouses.colType,
              render: (r) => (
                <span className={cn("text-xs px-2 py-0.5 rounded font-medium",
                  WAREHOUSE_TYPE_COLORS[r.product_type] ?? "bg-muted text-muted-foreground")}>
                  {r.product_type}
                </span>
              ),
            },
            {
              key: "quantity_kg",
              header: t.warehouses.colQtyKg,
              className: "tabular text-right font-medium",
              render: (r) => formatWeight(r.quantity_kg),
            },
            {
              key: "avg_cost_per_kg",
              header: t.warehouses.colAvgCost,
              className: "tabular text-right",
              render: (r) => formatMoney(r.avg_cost_per_kg),
            },
            {
              key: "total_value",
              header: t.warehouses.colTotalValue,
              className: "tabular text-right font-bold",
              render: (r) => formatMoney(r.total_value),
            },
            {
              key: "last_movement_at",
              header: t.warehouses.colLastMovement,
              render: (r) => r.last_movement_at
                ? new Date(r.last_movement_at).toLocaleDateString()
                : "—",
            },
          ]}
        />
      )}

      {showReceive && <ReceiveStockModal onClose={() => setShowReceive(false)} />}

      {/* Movements */}
      {activeTab === "movements" && (
        <DataTable
          loading={movementsLoading}
          data={movements ?? []}
          rowKey={(r) => r.id as string}
          columns={[
            { key: "movement_date", header: t.common.date },
            { key: "warehouse_name", header: t.warehouses.colWarehouse },
            { key: "product_name", header: t.warehouses.colProduct },
            {
              key: "movement_type_display",
              header: t.warehouses.colType,
              render: (r) => (
                <span className="text-xs px-2 py-0.5 rounded-md bg-muted font-medium">
                  {r.movement_type_display as string}
                </span>
              ),
            },
            {
              key: "quantity_kg",
              header: t.warehouses.colQtyKg,
              className: "tabular text-right",
              render: (r) => formatWeight(r.quantity_kg as string),
            },
            {
              key: "total_cost",
              header: t.warehouses.colTotalCost,
              className: "tabular text-right font-medium",
              render: (r) => formatMoney(r.total_cost as string),
            },
            { key: "created_by_name", header: t.common.by },
          ]}
        />
      )}
    </div>
  );
}
