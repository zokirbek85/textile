"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, Search } from "lucide-react";
import { maintenanceApi } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function SparePartsPage() {
  const t = useT();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-spare-parts", search, categoryFilter, criticalOnly],
    queryFn: () =>
      maintenanceApi
        .listSpareParts({
          search: search || undefined,
          category: categoryFilter || undefined,
          is_critical: criticalOnly ? "true" : undefined,
        })
        .then((r) => r.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ["maintenance-low-stock"],
    queryFn: () => maintenanceApi.getLowStock().then((r) => r.data),
  });

  const restockMut = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => maintenanceApi.restockPart(id, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-spare-parts"] });
      qc.invalidateQueries({ queryKey: ["maintenance-low-stock"] });
      setRestockId(null);
      setRestockQty(1);
    },
  });

  const parts = data?.results ?? [];
  const categories = ["bearing", "belt", "electrical", "pneumatic", "hydraulic", "spindle", "roller", "filter", "other"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">{t.maintenance.spareParts}</h1>
        </div>
        {lowStock && lowStock.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm dark:bg-amber-900/10 dark:border-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            {lowStock.length} {t.maintenance.lowStockAlert}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="pl-8 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
            placeholder={`${t.maintenance.partCode} / ${t.maintenance.partName}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">{t.maintenance.category} — All</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => setCriticalOnly(e.target.checked)}
          />
          {t.maintenance.isCritical} only
        </label>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colPart}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.category}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colStock}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colMin}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.maintenance.colReorder}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t.maintenance.unitCost}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : !parts.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{t.maintenance.noParts}</td></tr>
            ) : (
              parts.map((part) => (
                <tr key={part.id} className={`border-t hover:bg-muted/30 ${part.needs_reorder ? "bg-amber-50/50 dark:bg-amber-900/5" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium flex items-center gap-2">
                      {part.part_code}
                      {part.is_critical && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          Critical
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{part.part_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{part.category}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular ${part.needs_reorder ? "text-amber-600" : ""}`}>
                    {part.current_stock} {part.unit_of_measure}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-sm">
                    {part.minimum_stock} {part.unit_of_measure}
                  </td>
                  <td className="px-4 py-3">
                    {part.needs_reorder ? (
                      <span className="flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />{t.maintenance.lowStock}
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {(parseFloat(part.unit_cost_uzs) / 1000).toFixed(0)}K UZS
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setRestockId(part.id); setRestockQty(part.minimum_stock - part.current_stock > 0 ? part.minimum_stock - part.current_stock : 1); }}
                      className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:opacity-90"
                    >
                      {t.maintenance.restock}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Restock Modal */}
      {restockId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />{t.maintenance.restock}
            </h2>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">{t.maintenance.restockQty}</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded border bg-background text-sm focus:outline-none"
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRestockId(null)} className="px-4 py-2 rounded border text-sm hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={() => restockMut.mutate({ id: restockId, qty: restockQty })}
                disabled={restockMut.isPending}
                className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
              >
                {restockMut.isPending ? "Saving…" : t.maintenance.restocked}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
