"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { productionApi, usersApi } from "@/lib/api";
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

export function NewShiftReportModal({ onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);

  const [lineId, setLineId] = useState("");
  const [shiftDate, setShiftDate] = useState(today);
  const [shift, setShift] = useState("shift_1");
  const [brigade, setBrigade] = useState("1");
  const [supervisorId, setSupervisorId] = useState("");
  const [workersCount, setWorkersCount] = useState("8");
  const [totalInputKg, setTotalInputKg] = useState("");
  const [totalOutputKg, setTotalOutputKg] = useState("");
  const [wasteKg, setWasteKg] = useState("0");
  const [plannedHours, setPlannedHours] = useState("12");
  const [actualHours, setActualHours] = useState("12");
  const [downtimeHours, setDowntimeHours] = useState("0");
  const [downtimeReason, setDowntimeReason] = useState("");
  const [electricityKwh, setElectricityKwh] = useState("");
  const [defectCount, setDefectCount] = useState("0");
  const [notes, setNotes] = useState("");
  const [showNewLine, setShowNewLine] = useState(false);

  const { data: lines } = useQuery({
    queryKey: ["production-lines-active"],
    queryFn: () => productionApi.listLines({ is_active: true, page_size: 100 }).then((r) => r.data.results),
  });

  const { data: supervisors } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => usersApi.list({ page_size: 100 }).then((r) => r.data.results),
  });

  const mutation = useMutation({
    mutationFn: () =>
      productionApi.createShiftReport({
        production_line: lineId,
        shift_date: shiftDate,
        shift,
        brigade: parseInt(brigade),
        supervisor: supervisorId,
        workers_count: parseInt(workersCount),
        total_input_kg: totalInputKg,
        total_output_kg: totalOutputKg,
        waste_kg: wasteKg,
        planned_runtime_hours: plannedHours,
        actual_runtime_hours: actualHours,
        downtime_hours: downtimeHours,
        downtime_reason: downtimeReason,
        electricity_kwh: electricityKwh || null,
        defect_count: parseInt(defectCount),
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-reports"] });
      toast.success("Smena xisoboti yaratildi");
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const firstKey = data ? Object.keys(data)[0] : null;
      const firstVal = firstKey && data ? (data[firstKey] as string[]) : null;
      toast.error(Array.isArray(firstVal) ? firstVal[0] : "Xatolik yuz berdi");
    },
  });

  const canSubmit = lineId && shiftDate && shift && supervisorId && totalInputKg && totalOutputKg;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-base font-semibold">
            Yangi smena xisoboti / New Shift Report
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Liniya" required>
              <div className="flex gap-2">
                <select
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Tanlang —</option>
                  {(lines ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
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

            {showNewLine && <NewProductionLineModal onClose={() => setShowNewLine(false)} />}

            <Field label="Smena sanasi" required>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
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

            <Field label="Ishchilar soni">
              <input
                type="number"
                min="1"
                value={workersCount}
                onChange={(e) => setWorkersCount(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

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

          {/* Production quantities */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Kirish (kg)" required>
              <input
                type="number"
                min="0"
                step="0.001"
                value={totalInputKg}
                onChange={(e) => setTotalInputKg(e.target.value)}
                placeholder="0.000"
                className={inputCls}
              />
            </Field>
            <Field label="Chiqish (kg)" required>
              <input
                type="number"
                min="0"
                step="0.001"
                value={totalOutputKg}
                onChange={(e) => setTotalOutputKg(e.target.value)}
                placeholder="0.000"
                className={inputCls}
              />
            </Field>
            <Field label="Chiqindi (kg)">
              <input
                type="number"
                min="0"
                step="0.001"
                value={wasteKg}
                onChange={(e) => setWasteKg(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Runtime */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Reja ish vaqti (h)">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={plannedHours}
                onChange={(e) => setPlannedHours(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Haqiqiy ish vaqti (h)">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="To'xtash vaqti (h)">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={downtimeHours}
                onChange={(e) => setDowntimeHours(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {parseFloat(downtimeHours) > 0 && (
            <Field label="To'xtash sababi">
              <input
                value={downtimeReason}
                onChange={(e) => setDowntimeReason(e.target.value)}
                className={inputCls}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Elektr energiya (kWh)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={electricityKwh}
                onChange={(e) => setElectricityKwh(e.target.value)}
                placeholder="Ixtiyoriy"
                className={inputCls}
              />
            </Field>
            <Field label="Nuqsonlar soni">
              <input
                type="number"
                min="0"
                value={defectCount}
                onChange={(e) => setDefectCount(e.target.value)}
                className={inputCls}
              />
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
