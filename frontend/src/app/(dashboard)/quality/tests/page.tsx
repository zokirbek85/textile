"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, FlaskConical, Search, Filter } from "lucide-react";
import { qualityApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { QualityTestList } from "@/types";

type ResultFilter = "" | "pending" | "passed" | "failed" | "conditional" | "retest";
type TypeFilter = "" | "incoming_raw" | "in_process" | "final_product" | "periodic";

export default function QualityTestsPage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const [resultFilter, setResultFilter] = useState<ResultFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["quality-tests", resultFilter, typeFilter, search],
    queryFn: () =>
      qualityApi.listTests({
        overall_result: resultFilter || undefined,
        test_type: typeFilter || undefined,
        search: search || undefined,
        page_size: 50,
        ordering: "-test_date",
      }).then((r) => r.data.results),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t.quality.tests}</h1>
        </div>
        <button
          onClick={() => router.push("/quality/tests/new")}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.quality.newTest}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test # or product…"
            className="pl-9 pr-3 py-2 text-sm border rounded-lg bg-background w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Results</option>
          <option value="pending">{t.quality.statusPending}</option>
          <option value="passed">{t.quality.statusPassed}</option>
          <option value="failed">{t.quality.statusFailed}</option>
          <option value="conditional">{t.quality.statusConditional}</option>
          <option value="retest">{t.quality.statusRetest}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Types</option>
          <option value="incoming_raw">{t.quality.incomingRaw}</option>
          <option value="in_process">{t.quality.inProcess}</option>
          <option value="final_product">{t.quality.finalProduct}</option>
          <option value="periodic">{t.quality.periodic}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{t.quality.noTests}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {[t.quality.colTest, t.quality.colType, t.quality.colBatch, t.quality.colProduct,
                    t.quality.colDate, t.quality.testedBy, t.quality.colResult, t.quality.colGrade, t.quality.colApproved].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((test) => (
                  <tr
                    key={test.id}
                    onClick={() => router.push(`/quality/tests/${test.id}`)}
                    className="border-b last:border-0 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">{test.test_number}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{test.test_type_display}</td>
                    <td className="px-4 py-3 text-xs font-mono">{test.batch_number ?? "—"}</td>
                    <td className="px-4 py-3">{test.product_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(test.test_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{test.tested_by_name}</td>
                    <td className="px-4 py-3">
                      <ResultBadge result={test.overall_result} />
                    </td>
                    <td className="px-4 py-3">
                      {test.quality_grade ? <GradeBadge grade={test.quality_grade} /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {test.approved_for_use ? (
                        <span className="text-green-600 text-xs font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    passed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    conditional: "bg-orange-100 text-orange-800",
    retest: "bg-purple-100 text-purple-800",
  };
  const labels: Record<string, string> = {
    passed: "Passed", failed: "Failed", pending: "Pending", conditional: "Conditional", retest: "Retest",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[result] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[result] ?? result}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    A: "bg-green-100 text-green-800", B: "bg-yellow-100 text-yellow-800", C: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${map[grade] ?? "bg-gray-100 text-gray-800"}`}>
      {grade}
    </span>
  );
}
