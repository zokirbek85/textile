"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { tollingApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  invoiceId: string;
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

export function RecordPaymentModal({ invoiceId, contractId, onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const canSubmit = amount && parseFloat(amount) > 0;

  const mutation = useMutation({
    mutationFn: () => tollingApi.recordPayment(invoiceId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolling-contract-invoices", contractId] });
      queryClient.invalidateQueries({ queryKey: ["tolling-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["tolling-contract-stats", contractId] });
      toast.success(t.tolling.recordPayment);
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: { detail?: string } } })?.response?.data;
      toast.error(data?.detail ?? "Error recording payment");
    },
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 className="text-base font-semibold">{t.tolling.recordPayment}</h2>

          <Field label={t.tolling.paymentAmount} required>
            <input
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={inputCls}
              autoFocus
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mutation.isPending ? t.tolling.creating : t.tolling.recordPayment}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
