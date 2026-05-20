"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { cottonApi, warehouseApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney, formatWeight, formatPct, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { Product } from "@/types";

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

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function CottonBatchDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  // ── data ─────────────────────────────────────────────────────────────────────
  const { data: batch, isLoading } = useQuery({
    queryKey: ["cotton-batch", id],
    queryFn: () => cottonApi.getBatch(id).then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ["products-cotton"],
    queryFn: () =>
      warehouseApi.listProducts({ product_type: "raw_cotton", is_active: true, page_size: 50 })
        .then((r) => r.data.results),
  });

  // ── modal state ───────────────────────────────────────────────────────────────
  const [showAddCotton, setShowAddCotton] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // ── add cotton form ───────────────────────────────────────────────────────────
  const [cottonProductId, setCottonProductId] = useState("");
  const [cottonQty, setCottonQty] = useState("");

  const addCottonMutation = useMutation({
    mutationFn: () =>
      cottonApi.addCotton(id, { product_id: cottonProductId, quantity_kg: parseFloat(cottonQty) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotton-batch", id] });
      queryClient.invalidateQueries({ queryKey: ["cotton-batches"] });
      toast.success(t.production.inputAdded);
      setShowAddCotton(false);
      setCottonProductId("");
      setCottonQty("");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? t.production.addCottonInput + " failed");
    },
  });

  // ── add expense form ──────────────────────────────────────────────────────────
  const [expCategory, setExpCategory] = useState("electricity");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(today);
  const [expDesc, setExpDesc] = useState("");

  const addExpenseMutation = useMutation({
    mutationFn: () =>
      cottonApi.addExpense(id, {
        category: expCategory,
        amount: parseFloat(expAmount),
        expense_date: expDate,
        description: expDesc,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotton-batch", id] });
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
  const [fiberOut, setFiberOut] = useState("");
  const [seedOut, setSeedOut] = useState("0");
  const [lintOut, setLintOut] = useState("0");
  const [wasteOut, setWasteOut] = useState("0");
  const [seedCredit, setSeedCredit] = useState("0");
  const [lintCredit, setLintCredit] = useState("0");
  const [completeEndDate, setCompleteEndDate] = useState(today);

  const completeMutation = useMutation({
    mutationFn: () =>
      cottonApi.completeBatch(id, {
        fiber_output_kg: parseFloat(fiberOut),
        seed_output_kg: parseFloat(seedOut),
        lint_output_kg: parseFloat(lintOut),
        waste_output_kg: parseFloat(wasteOut),
        seed_credit_value: parseFloat(seedCredit),
        lint_credit_value: parseFloat(lintCredit),
        end_date: completeEndDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotton-batch", id] });
      queryClient.invalidateQueries({ queryKey: ["cotton-batches"] });
      toast.success(t.production.batchCompleted);
      setShowComplete(false);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed");
    },
  });

  // ── render ────────────────────────────────────────────────────────────────────
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
            <p className="text-sm text-muted-foreground">{t.production.cottonToFiber}</p>
          </div>
          <StatusBadge status={batch.status} label={batch.status_display} />
        </div>

        {inProgress && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCotton(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.production.addCottonInput}
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
        {/* Input stats */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">{t.production.cottonToFiber}</h3>
          <StatRow label={t.production.cottonInput} value={formatWeight(batch.cotton_input_kg)} />
          <StatRow label={t.production.cottonCost} value={formatMoney(batch.cotton_cost_total)} />
          <StatRow label={t.production.totalExpenses} value={formatMoney(batch.total_production_expenses)} />
          <StatRow label={t.production.byproductCredits} value={formatMoney(batch.total_byproduct_credit)} />
          <StatRow label={t.production.netCost} value={formatMoney(batch.net_cost)} bold />
        </div>

        {/* Output stats */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">{t.production.colFiberOutput}</h3>
          <StatRow label={t.production.fiberOutputKg} value={formatWeight(batch.fiber_output_kg)} />
          <StatRow label={t.production.colYield} value={formatPct(batch.fiber_yield_pct)} />
          <StatRow
            label={t.production.colFiberCostKg}
            value={batch.status === "completed" ? formatMoney(batch.calculated_fiber_cost_per_kg) : "—"}
            bold
          />
          <StatRow label={t.production.colStart} value={formatDate(batch.start_date)} />
          <StatRow label={t.production.colEnd} value={batch.end_date ? formatDate(batch.end_date) : "—"} />
        </div>
      </div>

      {/* Expenses table */}
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

      {/* Add Cotton Input modal */}
      {showAddCotton && (
        <Modal title={t.production.addCottonInput} onClose={() => setShowAddCotton(false)}>
          <FormField label={t.production.product}>
            <select
              value={cottonProductId}
              onChange={(e) => setCottonProductId(e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {(products ?? []).map((p: Product) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </FormField>
          <FormField label={t.production.quantityKg}>
            <input type="number" step="0.001" min="0.001" value={cottonQty}
              onChange={(e) => setCottonQty(e.target.value)} className={inputCls} />
          </FormField>
          <ModalActions
            onCancel={() => setShowAddCotton(false)}
            onConfirm={() => addCottonMutation.mutate()}
            loading={addCottonMutation.isPending}
            disabled={!cottonProductId || !cottonQty}
            confirmLabel={addCottonMutation.isPending ? t.production.adding : t.production.addCottonInput}
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
            <input type="number" step="0.01" min="0" value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)} className={inputCls} />
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
            disabled={!expAmount}
            confirmLabel={addExpenseMutation.isPending ? t.production.adding : t.production.addExpense}
          />
        </Modal>
      )}

      {/* Complete Batch modal */}
      {showComplete && (
        <Modal title={t.production.completeBatch} onClose={() => setShowComplete(false)}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.production.fiberOutputKg}>
              <input type="number" step="0.001" min="0.001" value={fiberOut}
                onChange={(e) => setFiberOut(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.production.endDate}>
              <input type="date" value={completeEndDate}
                onChange={(e) => setCompleteEndDate(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.production.seedOutputKg}>
              <input type="number" step="0.001" min="0" value={seedOut}
                onChange={(e) => setSeedOut(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.production.seedCreditValue}>
              <input type="number" step="0.01" min="0" value={seedCredit}
                onChange={(e) => setSeedCredit(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.production.lintOutputKg}>
              <input type="number" step="0.001" min="0" value={lintOut}
                onChange={(e) => setLintOut(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.production.lintCreditValue}>
              <input type="number" step="0.01" min="0" value={lintCredit}
                onChange={(e) => setLintCredit(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.production.wasteOutputKg}>
              <input type="number" step="0.001" min="0" value={wasteOut}
                onChange={(e) => setWasteOut(e.target.value)} className={inputCls} />
            </FormField>
          </div>
          <ModalActions
            onCancel={() => setShowComplete(false)}
            onConfirm={() => completeMutation.mutate()}
            loading={completeMutation.isPending}
            disabled={!fiberOut || parseFloat(fiberOut) <= 0}
            confirmLabel={completeMutation.isPending ? t.production.completing : t.production.completeBatch}
            confirmVariant="primary"
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
  onCancel, onConfirm, loading, disabled, confirmLabel, confirmVariant = "default",
}: {
  onCancel: () => void; onConfirm: () => void; loading: boolean;
  disabled?: boolean; confirmLabel: string; confirmVariant?: "default" | "primary";
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onCancel}
        className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading || disabled}
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60",
          confirmVariant === "primary"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  );
}
