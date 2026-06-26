"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { productionApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { NewProductionLineModal } from "@/components/production/NewProductionLineModal";
import type { ProductionLine } from "@/types";

export default function ProductionLinesPage() {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  const { data: lines, isLoading } = useQuery({
    queryKey: ["production-lines"],
    queryFn: () => productionApi.listLines({ page_size: 100 }).then((r) => r.data.results),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/production")}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Ishlab chiqarish liniyalari</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Liniya qo'shish
        </button>
      </div>

      <DataTable<ProductionLine>
        loading={isLoading}
        data={lines ?? []}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Nomi", className: "font-medium" },
          { key: "code", header: "Kodi", className: "font-mono" },
          { key: "line_type_display", header: "Turi" },
          { key: "factory_display", header: "Zavod" },
          {
            key: "capacity_per_hour",
            header: "Quvvat (kg/soat)",
            className: "tabular text-right",
          },
          { key: "equipment_model", header: "Uskuna", render: (r) => r.equipment_model || "—" },
          {
            key: "installation_date",
            header: "O'rnatilgan",
            render: (r) => (r.installation_date ? formatDate(r.installation_date) : "—"),
          },
          {
            key: "is_active",
            header: "Holat",
            render: (r) => (
              <StatusBadge
                status={r.is_active ? "active" : "inactive"}
                label={r.is_active ? "Faol" : "Faol emas"}
              />
            ),
          },
        ]}
      />

      {showNew && <NewProductionLineModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
