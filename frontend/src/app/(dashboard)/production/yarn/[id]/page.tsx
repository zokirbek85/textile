"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, CheckCircle, Loader2 } from "lucide-react";
import { yarnApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney, formatWeight, formatPct, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "raw_material", "electricity", "gas", "water", "salary",
  "amortization", "repair", "logistics", "laboratory", "overhead", "taxes", "other",
];

function StatRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm tabular", bold && "font-bold text-foreground")}>{value}</span>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function YarnBatchDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: batch, isLoading } = useQuery({
    queryKey: ["yarn-batch", id],
    queryFn: () => yarnApi.getBatch(id).then((r) => r.data),
  });

  const [showAddFiber, setShowAddFiber] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // ── add fiber form ────────────────────────────────────────────────────────────
  const [fiberQty, setFiberQty] = useState("");

  const addFiberMutation = useMutation({
    mutationFn: () => yarnApi.addFiber(id, { quantity_kg: parseFloat(fiberQty) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yarn-batch", id] });
      queryClient.invalidateQueries({ queryKey: ["yarn-batches"] });
      toast.success(t.production.inputAdded);
      setShowAddFiber(false);
      setFiberQty("");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed");
    },
  });

  // ── add expense form ──────────────────────────────────────────────────────────
  const [expCategory, setExpCategory] = useState("electricity");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(today);
  const [expDesc, setExpDesc] = useState("");

  const addExpenseMutation = useMutation({
    mutationFn: () =>
      yarnApi.addExpense(id, {
        category: expCategory,
        amount: parseFloat(expAmount),
        expense_date: expDate,
        description: expDesc,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yarn-batch", id] });
      toast.success(t.production.expenseAdded);
      setShowAddExpense(false);
      setExpAmount("");
      setExpDesc("");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed");
    },
  });

  // ── complete batch form ───────────────────────────────────────────────────────
  const [yarnOut, setYarnOut] = useState("");
  const [wasteOut, setWasteOut] = useState("0");
  const [completeEndDate, setCompleteEndDate] = useState(today);

  const isTolling = !!batch?.tolling_contract;

  const completeMutation = useMutation({
    mutationFn: () => {
      const payload = {
        yarn_output_kg: parseFloat(yarnOut),
        waste_output_kg: parseFloat(wasteOut),
        end_date: completeEndDate,
      };
      return isTolling ? yarnApi.completeTolling(id, payload) : yarnApi.completeBatch(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yarn-batch", id] });
      queryClient.invalidateQueries({ queryKey: ["yarn-batches"] });
      toast.success(t.production.batchCompleted);
      setShowComplete(false);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!batch) return null;

  const inProgress = batch.status === "in_progress";

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{batch.batch_code}</h1>
            <p className="text-sm text-muted-foreground">
              {batch.yarn_product_name}
              {batch.yarn_count && (
                <span className="ml-2 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 px-2 py-0.5 rounded font-medium">
                  {batch.yarn_count}
                </span>
              )}
              {isTolling && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 px-2 py-0.5 rounded font-medium">
                  Tolling — {batch.tolling_customer_name}
                </span>
              )}
            </p>
          </div>
          <StatusBadge status={batch.status} label={batch.status_display} />
        </div>

        {inProgress && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddFiber(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.production.addFiberInput}
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.production.addExpense}
            </button>
            <button
              onClick={() => setShowComplete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> {t.production.completeBatch}
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">{t.production.fiberToYarn}</h3>
          <StatRow label={t.production.fiberInput} value={formatWeight(batch.fiber_input_kg)} />
          <StatRow label={t.production.fiberCost} value={formatMoney(batch.fiber_cost_total)} />
          <StatRow label={t.production.totalExpenses} value={formatMoney(batch.total_spinning_expenses)} />
          <StatRow label={t.production.netCost} value={formatMoney(batch.net_cost)} bold />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">{t.production.colYarnOutput}</h3>
          <StatRow label={t.production.yarnOutputKg} value={formatWeight(batch.yarn_output_kg)} />
          <StatRow label={t.production.wasteOutputKg} value={formatWeight(batch.waste_output_kg)} />
          <StatRow label={t.production.colWastePct} value={formatPct(batch.waste_pct)} />
          <StatRow label={t.production.colEfficiency} value={formatPct(batch.efficiency_pct)} />
          <StatRow
            label={t.production.colCostKg}
            value={batch.status === "completed" ? formatMoney(batch.calculated_yarn_cost_per_kg) : "—"}
            bold
          />
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">{t.production.expenses}</h3>
        {(batch.expenses ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t.production.category}</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t.production.optDescription}</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t.finance.amount}</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t.common.date}</th>
                </tr>
              </thead>
              <tbody>
                {(batch.expenses ?? []).map((exp) => (
                  <tr key={exp.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{exp.category_display}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{exp.description || "—"}</td>
                    <td className="px-3 py-2 text-right tabular font-medium">{formatMoney(exp.amount)}</td>
                    <td className="px-3 py-2">{formatDate(exp.expense_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Fiber modal */}
      {showAddFiber && (
        <Modal title={t.production.addFiberInput} onClose={() => setShowAddFiber(false)}>
          <FormField label={t.production.quantityKg}>
            <input
              type="number" step="0.001" min="0.001"
              value={fiberQty} onChange={(e) => setFiberQty(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <ModalActions
            onCancel={() => setShowAddFiber(false)}
            onConfirm={() => addFiberMutation.mutate()}
            loading={addFiberMutation.isPending}
            disabled={!fiberQty || parseFloat(fiberQty) <= 0}
            confirmLabel={addFiberMutation.isPending ? t.production.adding : t.production.addFiberInput}
          />
        </Modal>
      )}

      {/* Add Expense modal */}
      {showAddExpense && (
        <Modal title={t.production.addExpense} onClose={() => setShowAddExpense(false)}>
          <FormField label={t.production.category}>
            <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className={inputCls}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t.finance.amount}>
            <input
              type="number" step="0.01" min="0"
              value={expAmount} onChange={(e) => setExpAmount(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label={t.production.expenseDate}>
            <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label={t.production.optDescription}>
            <input type="text" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className={inputCls} />
          </FormField>
          <ModalActions
            onCancel={() => setShowAddExpense(false)}
            onConfirm={() => addExpenseMutation.mutate()}
            loading={addExpenseMutation.isPending}
            disabled={!expAmount || parseFloat(expAmount) <= 0}
            confirmLabel={addExpenseMutation.isPending ? t.production.adding : t.production.addExpense}
          />
        </Modal>
      )}

      {/* Complete Batch modal */}
      {showComplete && (
        <Modal title={t.production.completeBatch} onClose={() => setShowComplete(false)}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.production.yarnOutputKg}>
              <input
                type="number" step="0.001" min="0.001"
                value={yarnOut} onChange={(e) => setYarnOut(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label={t.production.endDate}>
              <input
                type="date" value={completeEndDate}
                onChange={(e) => setCompleteEndDate(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label={t.production.wasteOutputKg}>
              <input
                type="number" step="0.001" min="0"
                value={wasteOut} onChange={(e) => setWasteOut(e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>
          <ModalActions
            onCancel={() => setShowComplete(false)}
            onConfirm={() => completeMutation.mutate()}
            loading={completeMutation.isPending}
            disabled={!yarnOut || parseFloat(yarnOut) <= 0}
            confirmLabel={completeMutation.isPending ? t.production.completing : t.production.completeBatch}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {children}
        </div>
      </div>
    </>
  );
}

function ModalActions({
  onCancel, onConfirm, loading, disabled, confirmLabel,
}: {
  onCancel: () => void; onConfirm: () => void;
  loading: boolean; disabled?: boolean; confirmLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading || disabled}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  );
}
