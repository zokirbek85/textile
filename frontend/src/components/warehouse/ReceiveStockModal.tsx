"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { warehouseApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

export function ReceiveStockModal({ onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => warehouseApi.listWarehouses({ page_size: 50, is_active: true }).then((r) => r.data.results),
  });

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => warehouseApi.listProducts({ page_size: 100, is_active: true }).then((r) => r.data.results),
  });

  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [costPerKg, setCostPerKg] = useState("");
  const [movementDate, setMovementDate] = useState(today);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      warehouseApi.receiveStock({
        warehouse_id: warehouseId,
        product_id: productId,
        quantity_kg: parseFloat(qty),
        cost_per_kg: parseFloat(costPerKg),
        movement_date: movementDate,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success(t.warehouses.stockReceived);
      onClose();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to receive stock");
    },
  });

  const canSubmit = warehouseId && productId && parseFloat(qty) > 0 && parseFloat(costPerKg) >= 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold">{t.warehouses.receiveStockTitle}</h2>

          <FormField label={t.warehouses.warehouse}>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {(warehouses ?? []).map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label={t.production.product}>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.production.quantityKg}>
              <input
                type="number" step="0.001" min="0.001"
                value={qty} onChange={(e) => setQty(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label={t.warehouses.costPerKg}>
              <input
                type="number" step="0.01" min="0"
                value={costPerKg} onChange={(e) => setCostPerKg(e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>

          <FormField label={t.common.date}>
            <input type="date" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} className={inputCls} />
          </FormField>

          <FormField label={t.warehouses.notes}>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </FormField>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !canSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mutation.isPending ? t.warehouses.receiving : t.warehouses.receiveStock}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
