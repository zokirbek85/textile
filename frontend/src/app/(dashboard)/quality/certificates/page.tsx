"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Search } from "lucide-react";
import { qualityApi } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function QualityCertificatesPage() {
  const t = useT();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["quality-certificates", search, gradeFilter],
    queryFn: () =>
      qualityApi.listCertificates({
        search: search || undefined,
        quality_grade: gradeFilter || undefined,
        page_size: 50,
      }).then((r) => r.data.results),
  });

  const cancelMut = useMutation({
    mutationFn: ({ number, reason }: { number: string; reason: string }) =>
      qualityApi.cancelCertificate(number, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quality-certificates"] });
      setShowCancelModal(null);
      setCancelReason("");
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Award className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t.quality.certificates}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cert # or product…"
            className="pl-9 pr-3 py-2 text-sm border rounded-lg bg-background w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Grades</option>
          <option value="A">{t.quality.gradeA}</option>
          <option value="B">{t.quality.gradeB}</option>
          <option value="C">{t.quality.gradeC}</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{t.quality.noCertificates}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {[t.quality.colCertificate, t.quality.colBatch, t.quality.productName, t.quality.colGrade,
                    "Qty (kg)", t.quality.issueDate, t.quality.validUntil, t.quality.issuedBy, t.quality.colStatus, ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((cert) => (
                  <tr key={cert.id} className="border-b last:border-0 hover:bg-accent transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{cert.certificate_number}</td>
                    <td className="px-4 py-3 font-mono text-xs">{cert.batch_number}</td>
                    <td className="px-4 py-3 text-sm">{cert.product_name}</td>
                    <td className="px-4 py-3"><GradeBadge grade={cert.quality_grade} /></td>
                    <td className="px-4 py-3 text-xs">{parseFloat(cert.quantity_kg).toFixed(1)} kg</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(cert.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{cert.issued_by_name}</td>
                    <td className="px-4 py-3">
                      {cert.is_active ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Active</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Cancelled</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cert.is_active && (
                        <button
                          onClick={() => setShowCancelModal(cert.certificate_number)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          {t.quality.cancelCertificate}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">{t.quality.cancelCertificate}</h3>
            <p className="text-sm text-muted-foreground">Certificate: <strong>{showCancelModal}</strong></p>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                placeholder="Reason for cancellation…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
              <button
                onClick={() => cancelMut.mutate({ number: showCancelModal, reason: cancelReason })}
                disabled={!cancelReason.trim() || cancelMut.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {cancelMut.isPending ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
