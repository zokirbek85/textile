"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { productionApi, warehouseApi, usersApi, tollingApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { NewProductionLineModal } from "@/components/production/NewProductionLineModal";

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

export function NewProductionOrderModal({ onClose }: Props) {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();

  const now = new Date();
  const localDate = now.toISOString().slice(0, 16);

  const [orderType, setOrderType] = useState("direct");
  const [inputProductId, setInputProductId] = useState("");
  const [outputProductId, setOutputProductId] = useState("");
  const [inputQty, setInputQty] = useState("");
  const [plannedOutputQty, setPlannedOutputQty] = useState("");
  const [wastePct, setWastePct] = useState("8.00");
  const [yarnCount, setYarnCount] = useState("");
  const [lineId, setLineId] = useState("");
  const [plannedStart, setPlannedStart] = useState(localDate);
  const [plannedEnd, setPlannedEnd] = useState("");
  const [shift, setShift] = useState("shift_1");
  const [brigade, setBrigade] = useState("1");
  const [supervisorId, setSupervisorId] = useState("");
  const [tollingContractId, setTollingContractId] = useState("");
  const [notes, setNotes] = useState("");
  const [showNewLine, setShowNewLine] = useState(false);

  const { data: lines } = useQuery({
    queryKey: ["production-lines-active"],
    queryFn: () => productionApi.listLines({ is_active: true, page_size: 100 }).then((r) => r.data.results),
  });

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => warehouseApi.listProducts({ page_size: 200 }).then((r) => r.data.results),
  });

  const { data: supervisors } = useQuery({
    queryKey: ["users-prod-managers"],
    queryFn: () => usersApi.list({ page_size: 100 }).then((r) => r.data.results),
  });

  const { data: tollingContracts } = useQuery({
    queryKey: ["tolling-contracts-active"],
    queryFn: () => tollingApi.listContracts({ status: "active", page_size: 100 }).then((r) => r.data.results),
    enabled: orderType === "tolling",
  });

  const mutation = useMutation({
    mutationFn: () =>
      productionApi.createOrder({
        order_type: orderType,
        input_product: inputProductId,
        output_product: outputProductId,
        input_quantity_kg: inputQty,
        planned_output_kg: plannedOutputQty,
        waste_percentage: wastePct,
        yarn_count: yarnCount,
        production_line: lineId,
        planned_start_date: plannedStart,
        planned_end_date: plannedEnd,
        shift,
        brigade: parseInt(brigade),
        supervisor: supervisorId,
        tolling_contract: tollingContractId || null,
        notes,
      }),
    onSuccess: (res) => {
      const id = res.data.id;
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      toast.success("Buyurtma yaratildi");
      onClose();
      router.push(`/production/orders/${id}`);
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const firstKey = data ? Object.keys(data)[0] : null;
      const firstVal = firstKey && data ? (data[firstKey] as string[]) : null;
      toast.error(Array.isArray(firstVal) ? firstVal[0] : "Xatolik yuz berdi");
    },
  });

  const canSubmit =
    inputProductId && outputProductId && inputQty && plannedOutputQty &&
    lineId && plannedStart && plannedEnd && supervisorId &&
    (orderType !== "tolling" || tollingContractId);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-base font-semibold">
            Yangi ishlab chiqarish buyurtmasi / New Production Order
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Buyurtma turi" required>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className={inputCls}
              >
                <option value="direct">To'g'ridan / Direct</option>
                <option value="tolling">Davalliq / Tolling</option>
                <option value="state">Davlat / State</option>
              </select>
            </Field>

            {orderType === "tolling" && (
              <Field label="Davalliq shartnomasi" required>
                <select
                  value={tollingContractId}
                  onChange={(e) => setTollingContractId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Tanlang —</option>
                  {(tollingContracts ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contract_number} · {c.customer_name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kiruvchi mahsulot" required>
              <select
                value={inputProductId}
                onChange={(e) => setInputProductId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Tanlang —</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.product_type_display})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Chiquvchi mahsulot" required>
              <select
                value={outputProductId}
                onChange={(e) => setOutputProductId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Tanlang —</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.product_type_display})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Kirish (kg)" required>
              <input
                type="number"
                min="0"
                step="0.001"
                value={inputQty}
                onChange={(e) => setInputQty(e.target.value)}
                placeholder="0.000"
                className={inputCls}
              />
            </Field>
            <Field label="Reja chiqish (kg)" required>
              <input
                type="number"
                min="0"
                step="0.001"
                value={plannedOutputQty}
                onChange={(e) => setPlannedOutputQty(e.target.value)}
                placeholder="0.000"
                className={inputCls}
              />
            </Field>
            <Field label="Chiqindi %">
              <input
                type="number"
                min="0"
                max="50"
                step="0.01"
                value={wastePct}
                onChange={(e) => setWastePct(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ip nomeri (Ne)">
              <input
                value={yarnCount}
                onChange={(e) => setYarnCount(e.target.value)}
                placeholder="Ne 30/1"
                className={inputCls}
              />
            </Field>

            <Field label="Ishlab chiqarish liniyasi" required>
              <div className="flex gap-2">
                <select
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Tanlang —</option>
                  {(lines ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.factory_display})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewLine(true)}
                  className="px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
                >
                  + Yangi
                </button>
              </div>
            </Field>
          </div>

          {showNewLine && <NewProductionLineModal onClose={() => setShowNewLine(false)} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Boshlanish (reja)" required>
              <input
                type="datetime-local"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Tugash (reja)" required>
              <input
                type="datetime-local"
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Smena" required>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className={inputCls}
              >
                <option value="shift_1">1-smena (08-20)</option>
                <option value="shift_2">2-smena (20-08)</option>
                <option value="shift_3">3-smena</option>
                <option value="shift_4">4-smena</option>
              </select>
            </Field>

            <Field label="Brigada" required>
              <select
                value={brigade}
                onChange={(e) => setBrigade(e.target.value)}
                className={inputCls}
              >
                <option value="1">1-brigada</option>
                <option value="2">2-brigada</option>
                <option value="3">3-brigada</option>
                <option value="4">4-brigada</option>
              </select>
            </Field>

            <Field label="Mas'ul" required>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Tanlang —</option>
                {(supervisors ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Izoh">
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
              Bekor qilish
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !canSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mutation.isPending ? "Yaratilmoqda…" : "Yaratish"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
