"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { warehouseApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { Warehouse } from "@/types";

interface Props {
  onClose: () => void;
  editTarget?: Warehouse;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function AddWarehouseModal({ onClose, editTarget }: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const isEdit = !!editTarget;

  const WAREHOUSE_TYPES = [
    { value: "cotton", label: t.warehouses.wtCotton },
    { value: "fiber",  label: t.warehouses.wtFiber },
    { value: "wip",    label: t.warehouses.wtWip },
    { value: "yarn",   label: t.warehouses.wtYarn },
    { value: "waste",  label: t.warehouses.wtWaste },
    { value: "other",  label: t.warehouses.wtOther },
  ];

  const [name, setName] = useState(editTarget?.name ?? "");
  const [code, setCode] = useState(editTarget?.code ?? "");
  const [warehouseType, setWarehouseType] = useState<string>(editTarget?.warehouse_type ?? "cotton");
  const [location, setLocation] = useState(editTarget?.location ?? "");
  const [capacityKg, setCapacityKg] = useState(editTarget?.capacity_kg ?? "");
  const [notes, setNotes] = useState(editTarget?.notes ?? "");

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        code: code.toUpperCase(),
        warehouse_type: warehouseType,
        location,
        capacity_kg: capacityKg ? parseFloat(String(capacityKg)) : null,
        notes,
      };
      return isEdit
        ? warehouseApi.updateWarehouse(editTarget!.id, payload)
        : warehouseApi.createWarehouse(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses-all"] });
      toast.success(isEdit ? t.common.updated : t.warehouses.warehouseAdded);
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const firstError = data ? Object.values(data)[0] : null;
      toast.error(Array.isArray(firstError) ? firstError[0] : "Failed to save warehouse");
    },
  });

  const canSubmit = name.trim() && code.trim();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold">
            {isEdit ? t.warehouses.editWarehouseTitle : t.warehouses.addWarehouseTitle}
          </h2>

          <Field label={t.warehouses.warehouseName} required>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.warehouses.warehouseCode} required>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WH-01"
                className={inputCls}
              />
            </Field>
            <Field label={t.warehouses.warehouseType} required>
              <select value={warehouseType} onChange={(e) => setWarehouseType(e.target.value)} className={inputCls}>
                {WAREHOUSE_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>{wt.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.warehouses.location}>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </Field>

          <Field label={t.warehouses.capacityKg}>
            <input
              type="number" step="0.001" min="0"
              value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label={t.warehouses.notes}>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </Field>

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
              {mutation.isPending
                ? t.warehouses.adding
                : isEdit ? t.settings.saveChanges : t.warehouses.addWarehouse}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
