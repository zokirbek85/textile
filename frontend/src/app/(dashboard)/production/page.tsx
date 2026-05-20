"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Factory, Plus, ChevronRight } from "lucide-react";
import { cottonApi, yarnApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatWeight, formatMoney, formatDate, formatPct } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { CottonBatch, YarnBatch } from "@/types";

type Stage = "cotton" | "yarn";

export default function ProductionPage() {
  const t = useT();
  const [stage, setStage] = useState<Stage>("yarn");

  const { data: cottonBatches, isLoading: cottonLoading } = useQuery({
    queryKey: ["cotton-batches"],
    queryFn: () => cottonApi.listBatches({ page_size: 50, ordering: "-start_date" }).then((r) => r.data.results),
  });

  const { data: yarnBatches, isLoading: yarnLoading } = useQuery({
    queryKey: ["yarn-batches"],
    queryFn: () => yarnApi.listBatches({ page_size: 50, ordering: "-start_date" }).then((r) => r.data.results),
  });

  const router = useRouter();
  const activeCotton = (cottonBatches ?? []).filter((b) => b.status === "in_progress").length;
  const activeYarn = (yarnBatches ?? []).filter((b) => b.status === "in_progress").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.nav.production}</h1>
        <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> {t.production.newBatch}
        </button>
      </div>

      {/* Stage KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title={t.production.activeCottonBatches} value={activeCotton} icon={Factory} variant="info" />
        <KpiCard title={t.production.activeYarnBatches} value={activeYarn} icon={Factory} variant="success" />
        <KpiCard
          title={t.production.cottonBatchesTotal}
          value={cottonBatches?.length ?? 0}
          subtitle={t.common.allTime}
        />
        <KpiCard
          title={t.production.yarnBatchesTotal}
          value={yarnBatches?.length ?? 0}
          subtitle={t.common.allTime}
        />
      </div>

      {/* Stage selector */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {(["yarn", "cotton"] as Stage[]).map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              stage === s
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "cotton" ? t.production.cottonToFiber : t.production.fiberToYarn}
          </button>
        ))}
      </div>

      {/* Cotton batches */}
      {stage === "cotton" && (
        <DataTable<CottonBatch>
          loading={cottonLoading}
          data={cottonBatches ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/production/cotton/${r.id}`)}
          columns={[
            { key: "batch_code", header: t.production.colBatch, className: "font-mono font-medium" },
            {
              key: "status",
              header: t.production.colStatus,
              render: (r) => <StatusBadge status={r.status} label={r.status_display} />,
            },
            { key: "start_date", header: t.production.colStart, render: (r) => formatDate(r.start_date) },
            { key: "end_date", header: t.production.colEnd, render: (r) => formatDate(r.end_date) },
            {
              key: "cotton_input_kg",
              header: t.production.colCottonInput,
              className: "tabular text-right",
              render: (r) => formatWeight(r.cotton_input_kg),
            },
            {
              key: "fiber_output_kg",
              header: t.production.colFiberOutput,
              className: "tabular text-right",
              render: (r) => formatWeight(r.fiber_output_kg),
            },
            {
              key: "fiber_yield_pct",
              header: t.production.colYield,
              className: "tabular text-right",
              render: (r) => formatPct(r.fiber_yield_pct),
            },
            {
              key: "calculated_fiber_cost_per_kg",
              header: t.production.colFiberCostKg,
              className: "tabular text-right font-bold",
              render: (r) => r.status === "completed" ? formatMoney(r.calculated_fiber_cost_per_kg) : "—",
            },
            {
              key: "id",
              header: "",
              render: () => <ChevronRight className="w-4 h-4 text-muted-foreground" />,
            },
          ]}
        />
      )}

      {/* Yarn batches */}
      {stage === "yarn" && (
        <DataTable<YarnBatch>
          loading={yarnLoading}
          data={yarnBatches ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/production/yarn/${r.id}`)}
          columns={[
            { key: "batch_code", header: t.production.colBatch, className: "font-mono font-medium" },
            { key: "yarn_product_name", header: t.production.colProduct },
            {
              key: "yarn_count",
              header: t.production.colNeCount,
              render: (r) => (
                <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 px-2 py-0.5 rounded font-medium">
                  {r.yarn_count || "—"}
                </span>
              ),
            },
            {
              key: "status",
              header: t.production.colStatus,
              render: (r) => <StatusBadge status={r.status} label={r.status_display} />,
            },
            { key: "start_date", header: t.production.colStart, render: (r) => formatDate(r.start_date) },
            {
              key: "fiber_input_kg",
              header: t.production.colFiberInput,
              className: "tabular text-right",
              render: (r) => formatWeight(r.fiber_input_kg),
            },
            {
              key: "yarn_output_kg",
              header: t.production.colYarnOutput,
              className: "tabular text-right",
              render: (r) => formatWeight(r.yarn_output_kg),
            },
            {
              key: "waste_pct",
              header: t.production.colWastePct,
              className: "tabular text-right",
              render: (r) => (
                <span className={cn("font-medium", parseFloat(r.waste_pct) > 10 ? "text-red-500" : "")}>
                  {formatPct(r.waste_pct)}
                </span>
              ),
            },
            {
              key: "efficiency_pct",
              header: t.production.colEfficiency,
              className: "tabular text-right",
              render: (r) => formatPct(r.efficiency_pct),
            },
            {
              key: "calculated_yarn_cost_per_kg",
              header: t.production.colCostKg,
              className: "tabular text-right font-bold",
              render: (r) => r.status === "completed" ? formatMoney(r.calculated_yarn_cost_per_kg) : "—",
            },
          ]}
        />
      )}
    </div>
  );
}
