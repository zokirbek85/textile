"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { tollingApi, warehouseApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
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

export function CreateContractModal({ onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();

  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [contractType, setContractType] = useState("external");
  const [customerName, setCustomerName] = useState("");
  const [customerInn, setCustomerInn] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetYarnProduct, setTargetYarnProduct] = useState("");
  const [yarnPriceUsd, setYarnPriceUsd] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [processorShare, setProcessorShare] = useState("");
  const [customerShare, setCustomerShare] = useState("");
  const [lossShare, setLossShare] = useState("");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [paymentTermDays, setPaymentTermDays] = useState("30");
  const [advancePaymentPct, setAdvancePaymentPct] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: yarnProducts } = useQuery({
    queryKey: ["products-yarn-tolling"],
    queryFn: () =>
      warehouseApi.listProducts({ product_type: "yarn", page_size: 100 }).then((r) => r.data.results),
  });

  const shareTotal =
    (parseFloat(processorShare) || 0) +
    (parseFloat(customerShare) || 0) +
    (parseFloat(lossShare) || 0);
  const shareValid = Math.abs(shareTotal - 100) < 0.01;

  const canSubmit =
    contractNumber.trim() &&
    contractDate &&
    customerName.trim() &&
    startDate &&
    endDate &&
    targetYarnProduct &&
    yarnPriceUsd &&
    exchangeRate &&
    processorShare &&
    customerShare &&
    lossShare &&
    shareValid;

  const mutation = useMutation({
    mutationFn: () =>
      tollingApi.createContract({
        contract_number: contractNumber,
        contract_date: contractDate,
        contract_type: contractType,
        customer_name: customerName,
        customer_inn: customerInn,
        start_date: startDate,
        end_date: endDate,
        target_yarn_product: targetYarnProduct,
        yarn_price_usd: yarnPriceUsd,
        exchange_rate: exchangeRate,
        processor_share_pct: processorShare,
        customer_share_pct: customerShare,
        loss_share_pct: lossShare,
        vat_included: vatIncluded,
        payment_term_days: parseInt(paymentTermDays),
        advance_payment_pct: advancePaymentPct,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolling-contracts"] });
      toast.success(t.tolling.contractCreated);
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data) {
        const first = Object.values(data)[0];
        toast.error(Array.isArray(first) ? String(first[0]) : String(first));
      } else {
        toast.error("Error creating contract");
      }
    },
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl p-6 space-y-4 my-4">
          <h2 className="text-base font-semibold">{t.tolling.newContract}</h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tolling.contractNumber} required>
              <input
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="DC-2026-001"
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.contractDate} required>
              <input
                type="date"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tolling.customer} required>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.customerInn}>
              <input
                value={customerInn}
                onChange={(e) => setCustomerInn(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={t.tolling.contractType} required>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className={inputCls}
            >
              <option value="external">{t.tolling.external}</option>
              <option value="internal">{t.tolling.internal}</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tolling.startDate} required>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.endDate} required>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={t.tolling.targetYarnProduct} required>
            <select
              value={targetYarnProduct}
              onChange={(e) => setTargetYarnProduct(e.target.value)}
              className={inputCls}
            >
              <option value="">— Select yarn product —</option>
              {yarnProducts?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tolling.yarnPriceUsd} required>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={yarnPriceUsd}
                onChange={(e) => setYarnPriceUsd(e.target.value)}
                placeholder="0.0000"
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.exchangeRate} required>
              <input
                type="number"
                step="1"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="12800"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Share split */}
          <div className="grid grid-cols-3 gap-3">
            <Field label={t.tolling.processorShare} required>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={processorShare}
                onChange={(e) => setProcessorShare(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.customerShare} required>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={customerShare}
                onChange={(e) => setCustomerShare(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.lossShare} required>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={lossShare}
                onChange={(e) => setLossShare(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
          </div>
          {processorShare && customerShare && lossShare && (
            <p
              className={`text-xs font-medium ${
                shareValid ? "text-green-600" : "text-red-500"
              }`}
            >
              Total: {shareTotal.toFixed(2)}% {shareValid ? "✓" : "(must be 100%)"}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tolling.paymentTermDays}>
              <input
                type="number"
                min="1"
                value={paymentTermDays}
                onChange={(e) => setPaymentTermDays(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t.tolling.advancePaymentPct}>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={advancePaymentPct}
                onChange={(e) => setAdvancePaymentPct(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="vat-included"
              type="checkbox"
              checked={vatIncluded}
              onChange={(e) => setVatIncluded(e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <label
              htmlFor="vat-included"
              className="text-sm font-medium cursor-pointer"
            >
              {t.tolling.vatIncluded}
            </label>
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
              {mutation.isPending ? t.tolling.creating : t.tolling.newContract}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
