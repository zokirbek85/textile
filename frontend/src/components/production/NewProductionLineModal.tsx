"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { productionApi } from "@/lib/api";
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

export function NewProductionLineModal({ onClose }: Props) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [lineType, setLineType] = useState("spinning");
  const [factory, setFactory] = useState("ip_zavodi");
  const [capacityPerHour, setCapacityPerHour] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [maintenanceSchedule, setMaintenanceSchedule] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      productionApi.createLine({
        name,
        code,
        line_type: lineType,
        factory,
        capacity_per_hour: capacityPerHour,
        equipment_model: equipmentModel,
        installation_date: installationDate || null,
        maintenance_schedule: maintenanceSchedule,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-lines"] });
      queryClient.invalidateQueries({ queryKey: ["production-lines-active"] });
      toast.success("Liniya yaratildi");
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const firstKey = data ? Object.keys(data)[0] : null;
      const firstVal = firstKey && data ? (data[firstKey] as string[]) : null;
      toast.error(Array.isArray(firstVal) ? firstVal[0] : "Xatolik yuz berdi");
    },
  });

  const canSubmit = name && code && lineType && factory && parseFloat(capacityPerHour) > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-base font-semibold">
            Yangi ishlab chiqarish liniyasi / New Production Line
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nomi" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spinning Line 1"
                className={inputCls}
              />
            </Field>
            <Field label="Kodi" required>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SPIN-01"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Turi" required>
              <select value={lineType} onChange={(e) => setLineType(e.target.value)} className={inputCls}>
                <option value="ginning">Ginning</option>
                <option value="spinning">Spinning</option>
                <option value="blending">Blending</option>
              </select>
            </Field>
            <Field label="Zavod" required>
              <select value={factory} onChange={(e) => setFactory(e.target.value)} className={inputCls}>
                <option value="paxta_zavodi">Paxta zavodi</option>
                <option value="ip_zavodi">Ip zavodi</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quvvat (kg/soat)" required>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={capacityPerHour}
                onChange={(e) => setCapacityPerHour(e.target.value)}
                placeholder="500"
                className={inputCls}
              />
            </Field>
            <Field label="Uskuna modeli">
              <input
                value={equipmentModel}
                onChange={(e) => setEquipmentModel(e.target.value)}
                placeholder="Ixtiyoriy"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="O'rnatilgan sana">
              <input
                type="date"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Texnik xizmat jadvali">
              <input
                value={maintenanceSchedule}
                onChange={(e) => setMaintenanceSchedule(e.target.value)}
                placeholder="weekly / monthly"
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
