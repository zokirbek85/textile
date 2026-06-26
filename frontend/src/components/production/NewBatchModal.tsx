"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cottonApi, yarnApi, warehouseApi, tollingApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  stage: "cotton" | "yarn";
  onClose: () => void;
}

type SourceType = "own" | "tolling";

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

export function NewBatchModal({ stage, onClose }: Props) {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [yarnProductId, setYarnProductId] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("own");
  const [contractId, setContractId] = useState("");
  const [fiberSourceWarehouseId, setFiberSourceWarehouseId] = useState("");
  const [yarnTargetWarehouseId, setYarnTargetWarehouseId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: yarnProducts } = useQuery({
    queryKey: ["products-yarn"],
    queryFn: () =>
      warehouseApi.listProducts({ page_size: 100, product_type: "yarn" }).then((r) => r.data.results),
    enabled: stage === "yarn",
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => warehouseApi.listWarehouses({ page_size: 50, is_active: true }).then((r) => r.data.results),
    enabled: stage === "yarn",
  });

  const { data: contracts } = useQuery({
    queryKey: ["tolling-contracts-active"],
    queryFn: () => tollingApi.listContracts({ status: "active", page_size: 50 }).then((r) => r.data.results),
    enabled: stage === "yarn" && sourceType === "tolling",
  });

  const mutation = useMutation({
    mutationFn: () =>
      stage === "cotton"
        ? cottonApi.createBatch({ start_date: startDate, notes })
        : yarnApi.createBatch({
            start_date: startDate,
            yarn_product_id: yarnProductId,
            ...(sourceType === "tolling"
              ? { tolling_contract_id: contractId }
              : {
                  fiber_source_warehouse_id: fiberSourceWarehouseId,
                  yarn_target_warehouse_id: yarnTargetWarehouseId,
                }),
            notes,
          }),
    onSuccess: (res) => {
      const id = res.data.id;
      queryClient.invalidateQueries({ queryKey: [stage === "cotton" ? "cotton-batches" : "yarn-batches"] });
      toast.success(t.production.batchCreated);
      onClose();
      router.push(`/production/${stage}/${id}`);
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const firstError = data ? Object.values(data)[0] : null;
      toast.error(Array.isArray(firstError) ? firstError[0] : "Failed to create batch");
    },
  });

  const canSubmit =
    startDate &&
    (stage === "cotton" ||
      (yarnProductId &&
        (sourceType === "tolling"
          ? contractId
          : fiberSourceWarehouseId && yarnTargetWarehouseId)));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 className="text-base font-semibold">
            {stage === "cotton" ? t.production.newCottonBatchTitle : t.production.newYarnBatchTitle}
          </h2>

          {stage === "yarn" && (
            <>
              <Field label={t.production.selectYarnProduct} required>
                <select
                  value={yarnProductId}
                  onChange={(e) => setYarnProductId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {(yarnProducts ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.yarn_count ? ` (${p.yarn_count})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t.warehouses.sourceType}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSourceType("own"); setContractId(""); }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      sourceType === "own"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {t.warehouses.sourceOwn}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSourceType("tolling"); setFiberSourceWarehouseId(""); setYarnTargetWarehouseId(""); }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      sourceType === "tolling"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {t.warehouses.sourceTolling}
                  </button>
                </div>
              </Field>

              {sourceType === "tolling" ? (
                <Field label={t.warehouses.tollingCompany} required>
                  <select value={contractId} onChange={(e) => setContractId(e.target.value)} className={inputCls}>
                    <option value="">{t.warehouses.selectContract}</option>
                    {(contracts ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.customer_name} ({c.contract_number})</option>
                    ))}
                  </select>
                </Field>
              ) : (
                <>
                  <Field label={t.production.fiberSourceWarehouse} required>
                    <select
                      value={fiberSourceWarehouseId}
                      onChange={(e) => setFiberSourceWarehouseId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">—</option>
                      {(warehouses ?? []).map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.production.yarnTargetWarehouse} required>
                    <select
                      value={yarnTargetWarehouseId}
                      onChange={(e) => setYarnTargetWarehouseId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">—</option>
                      {(warehouses ?? []).map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}
            </>
          )}

          <Field label={t.production.startDate} required>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label={t.production.optDescription}>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
            />
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
              {mutation.isPending ? t.production.creating : t.production.newBatch}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
