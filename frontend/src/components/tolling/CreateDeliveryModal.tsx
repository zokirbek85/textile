"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { tollingApi, yarnApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  contractId: string;
  onClose: () => void;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function CreateDeliveryModal({ contractId, onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();

  const [yarnBatch, setYarnBatch] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [quantityKg, setQuantityKg] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [notes, setNotes] = useState("");

  const { data: batches } = useQuery({
    queryKey: ["yarn-batches-tolling", contractId],
    queryFn: () =>
      yarnApi
        .listBatches({ tolling_contract: contractId, status: "completed", page_size: 100 })
        .then((r) => r.data.results),
  });

  const canSubmit = yarnBatch && deliveryDate && quantityKg;

  const mutation = useMutation({
    mutationFn: () =>
      tollingApi.createDelivery({
        contract: contractId,
        yarn_batch: yarnBatch,
        delivery_date: deliveryDate,
        quantity_kg: quantityKg,
        recipient_name: recipientName,
        vehicle_number: vehicleNumber,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolling-deliveries", contractId] });
      toast.success(t.tolling.delivered);
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data) {
        const first = Object.values(data)[0];
        toast.error(Array.isArray(first) ? String(first[0]) : String(first));
      } else {
        toast.error("Error");
      }
    },
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold">{t.tolling.newDelivery}</h2>

          <Field label="Yarn Batch" required>
            <select
              value={yarnBatch}
              onChange={(e) => setYarnBatch(e.target.value)}
              className={inputCls}
            >
              <option value="">— Select batch —</option>
              {batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} — {b.yarn_product_name} ({b.customer_yarn_kg} kg customer)
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tolling.quantityKg} required>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="0.000"
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.deliveryDate} required>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Recipient">
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Vehicle #">
              <input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={t.tolling.notes}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
              {mutation.isPending ? t.tolling.creating : t.tolling.newDelivery}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
