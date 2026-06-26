"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, Award, ClipboardCheck } from "lucide-react";
import { qualityApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { QualityTestResultItem } from "@/types";

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [compliesWith, setCompliesWith] = useState("O'zDSt 604:2016");

  const { data: test, isLoading } = useQuery({
    queryKey: ["quality-test", id],
    queryFn: () => qualityApi.getTest(id).then((r) => r.data),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["quality-test", id] });

  const evaluateMut = useMutation({
    mutationFn: () => qualityApi.evaluateTest(id),
    onSuccess: invalidate,
  });

  const approveMut = useMutation({
    mutationFn: () => qualityApi.approveTest(id),
    onSuccess: invalidate,
  });

  const rejectMut = useMutation({
    mutationFn: () => qualityApi.rejectTest(id, rejectReason),
    onSuccess: () => { invalidate(); setShowRejectModal(false); setRejectReason(""); },
  });

  const certMut = useMutation({
    mutationFn: () => qualityApi.issueCertificate(id, compliesWith),
    onSuccess: () => { invalidate(); setShowCertModal(false); },
  });

  const updateResultMut = useMutation({
    mutationFn: ({ resultId, data }: { resultId: string; data: unknown }) =>
      qualityApi.updateTestResult(id, resultId, data),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!test) return <div className="p-8 text-center text-muted-foreground">Test not found</div>;

  const isPending = test.overall_result === "pending";
  const isPassed = test.overall_result === "passed";
  const hasCert = false; // would check test.certificates

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/quality/tests")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{test.test_number}</h1>
        <ResultBadge result={test.overall_result} />
        {test.quality_grade && <GradeBadge grade={test.quality_grade} />}
        {test.approved_for_use && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
            ✓ {t.quality.approvedForUse}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t.quality.testType, value: test.test_type_display },
          { label: t.quality.batchNumber, value: test.batch_number ?? "—" },
          { label: t.quality.productName, value: test.product_name },
          { label: t.quality.testDate, value: new Date(test.test_date).toLocaleDateString() },
          { label: t.quality.testedBy, value: test.tested_by_name },
          { label: t.quality.sampleSizeKg, value: `${test.sample_size_kg} kg` },
          { label: t.quality.labEquipment, value: test.lab_equipment || "—" },
          { label: t.quality.sampleLocation, value: test.sample_location || "—" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
            <div className="text-sm font-medium truncate">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {isPending && (
          <button
            onClick={() => evaluateMut.mutate()}
            disabled={evaluateMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            {evaluateMut.isPending ? t.quality.evaluating : t.quality.evaluate}
          </button>
        )}
        {isPassed && !test.approved_for_use && (
          <button
            onClick={() => approveMut.mutate()}
            disabled={approveMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {approveMut.isPending ? t.quality.approving : t.quality.approveTest}
          </button>
        )}
        {!test.rejected && !isPending && (
          <button
            onClick={() => setShowRejectModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            {t.quality.rejectTest}
          </button>
        )}
        {test.approved_for_use && test.production_batch && (
          <button
            onClick={() => setShowCertModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Award className="w-4 h-4" />
            {t.quality.issueCert}
          </button>
        )}
      </div>

      {/* Test results table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">{t.quality.parameters}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{test.pass_count} / {test.result_count} within spec</p>
        </div>
        {test.test_results.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No parameter results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {["Code", "Parameter", "Unit", "Min", "Max", "Measured", "Within Spec", "Deviation %", "Critical"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {test.test_results.map((r) => (
                  <ParameterRow
                    key={r.id}
                    result={r}
                    isPending={isPending}
                    onSave={(data) => updateResultMut.mutate({ resultId: r.id, data })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">{t.quality.rejectTest}</h3>
            <div>
              <label className="text-sm font-medium">{t.quality.rejectionReason}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                placeholder="Describe reason for rejection…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
              <button
                onClick={() => rejectMut.mutate()}
                disabled={!rejectReason.trim() || rejectMut.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {rejectMut.isPending ? "Rejecting…" : t.quality.rejectTest}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue certificate modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">{t.quality.issueCert}</h3>
            <div>
              <label className="text-sm font-medium">{t.quality.compliesWith}</label>
              <input
                value={compliesWith}
                onChange={(e) => setCompliesWith(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCertModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
              <button
                onClick={() => certMut.mutate()}
                disabled={certMut.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60"
              >
                {certMut.isPending ? "Issuing…" : t.quality.issueCert}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ParameterRow({
  result, isPending, onSave,
}: {
  result: QualityTestResultItem;
  isPending: boolean;
  onSave: (data: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(result.measured_value ?? "");
  const [grade, setGrade] = useState(result.measured_grade ?? "");

  const handleSave = () => {
    onSave(result.data_type === "numeric" ? { measured_value: val } : { measured_grade: grade });
    setEditing(false);
  };

  return (
    <tr className={`border-b last:border-0 transition-colors ${result.is_within_spec ? "" : "bg-red-50/40 dark:bg-red-900/10"}`}>
      <td className="px-4 py-2 font-mono text-xs font-medium">{result.parameter_code}</td>
      <td className="px-4 py-2 text-xs">{result.parameter_name}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{result.parameter_unit}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{result.parameter_min ?? "—"}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{result.parameter_max ?? "—"}</td>
      <td className="px-4 py-2">
        {isPending && editing ? (
          result.data_type === "numeric" ? (
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-24 border rounded px-2 py-1 text-xs"
              onBlur={handleSave}
              autoFocus
            />
          ) : (
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-20 border rounded px-2 py-1 text-xs"
              onBlur={handleSave}
              autoFocus
            />
          )
        ) : (
          <button
            onClick={() => isPending && setEditing(true)}
            className={`text-xs font-medium ${isPending ? "hover:underline cursor-pointer" : ""} ${result.measured_value ? "text-foreground" : "text-muted-foreground"}`}
          >
            {result.data_type === "numeric"
              ? (result.measured_value ?? (isPending ? "click to enter" : "—"))
              : (result.measured_grade || (isPending ? "click to enter" : "—"))}
          </button>
        )}
      </td>
      <td className="px-4 py-2">
        {result.measured_value !== null || result.measured_grade ? (
          result.is_within_spec ? (
            <span className="text-green-600 text-xs font-medium">✓ Yes</span>
          ) : (
            <span className="text-red-600 text-xs font-medium">✗ No</span>
          )
        ) : "—"}
      </td>
      <td className="px-4 py-2 text-xs">
        {result.deviation_percentage ? `${result.deviation_percentage}%` : "—"}
      </td>
      <td className="px-4 py-2">
        {result.is_critical && (
          <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">Critical</span>
        )}
      </td>
    </tr>
  );
}

function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    passed: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800", conditional: "bg-orange-100 text-orange-800",
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
      Grade {grade}
    </span>
  );
}
