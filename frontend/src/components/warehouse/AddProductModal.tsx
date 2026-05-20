"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { warehouseApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
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

export function AddProductModal({ onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();

  const PRODUCT_TYPES = [
    { value: "raw_cotton", label: t.warehouses.ptRawCotton },
    { value: "fiber",      label: t.warehouses.ptFiber },
    { value: "seed",       label: t.warehouses.ptSeed },
    { value: "lint",       label: t.warehouses.ptLint },
    { value: "yarn",       label: t.warehouses.ptYarn },
    { value: "waste",      label: t.warehouses.ptWaste },
    { value: "other",      label: t.warehouses.ptOther },
  ];

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [productType, setProductType] = useState("raw_cotton");
  const [unit, setUnit] = useState("kg");
  const [description, setDescription] = useState("");
  const [yarnCount, setYarnCount] = useState("");
  const [yarnType, setYarnType] = useState("");

  const isYarn = productType === "yarn";

  const mutation = useMutation({
    mutationFn: () =>
      warehouseApi.createProduct({
        name,
        code: code.toUpperCase(),
        product_type: productType,
        unit,
        description,
        ...(isYarn && { yarn_count: yarnCount, yarn_type: yarnType }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-all"] });
      queryClient.invalidateQueries({ queryKey: ["products-cotton"] });
      toast.success(t.warehouses.productAdded);
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const firstError = data ? Object.values(data)[0] : null;
      toast.error(Array.isArray(firstError) ? firstError[0] : "Failed to create product");
    },
  });

  const canSubmit = name.trim() && code.trim();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold">{t.warehouses.addProductTitle}</h2>

          <Field label={t.warehouses.productName} required>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.warehouses.productCode} required>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="YRN-Ne30"
                className={inputCls}
              />
            </Field>
            <Field label={t.warehouses.productType} required>
              <select value={productType} onChange={(e) => setProductType(e.target.value)} className={inputCls}>
                {PRODUCT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.warehouses.colUnit}>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
          </Field>

          {isYarn && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.warehouses.yarnCount}>
                <input
                  value={yarnCount} onChange={(e) => setYarnCount(e.target.value)}
                  placeholder="Ne30/1" className={inputCls}
                />
              </Field>
              <Field label={t.warehouses.yarnType}>
                <input
                  value={yarnType} onChange={(e) => setYarnType(e.target.value)}
                  placeholder="Combed" className={inputCls}
                />
              </Field>
            </div>
          )}

          <Field label={t.production.optDescription}>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
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
              {mutation.isPending ? t.warehouses.adding : t.warehouses.addProduct}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
