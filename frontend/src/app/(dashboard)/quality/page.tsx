"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, XCircle, AlertTriangle, ChevronRight, FlaskConical } from "lucide-react";
import { qualityApi } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { useT } from "@/lib/i18n";

export default function QualityPage() {
  const t = useT();
  const router = useRouter();

  const { data: passRate } = useQuery({
    queryKey: ["quality-pass-rate"],
    queryFn: () => qualityApi.getPassRate().then((r) => r.data),
  });

  const { data: compliance } = useQuery({
    queryKey: ["quality-compliance"],
    queryFn: () => qualityApi.getComplianceScore().then((r) => r.data),
  });

  const { data: grades } = useQuery({
    queryKey: ["quality-grade-dist"],
    queryFn: () => qualityApi.getGradeDistribution().then((r) => r.data),
  });

  const { data: defectPareto } = useQuery({
    queryKey: ["quality-defects-pareto"],
    queryFn: () => qualityApi.getDefectsByType().then((r) => r.data),
  });

  const { data: recentTests } = useQuery({
    queryKey: ["quality-tests-recent"],
    queryFn: () => qualityApi.listTests({ page_size: 5, ordering: "-test_date" }).then((r) => r.data.results),
  });

  const modules = [
    {
      label: t.quality.tests,
      icon: FlaskConical,
      href: "/quality/tests",
      desc: "Incoming, in-process, final product tests",
      color: "bg-blue-500",
    },
    {
      label: t.quality.certificates,
      icon: CheckCircle,
      href: "/quality/certificates",
      desc: "Quality certificates by batch",
      color: "bg-green-500",
    },
    {
      label: t.quality.defects,
      icon: AlertTriangle,
      href: "/quality/defects",
      desc: "Defect tracking and root cause analysis",
      color: "bg-red-500",
    },
  ];

  const gradeTotal = (grades?.A ?? 0) + (grades?.B ?? 0) + (grades?.C ?? 0);
  const gradePct = (n: number) => gradeTotal ? Math.round((n / gradeTotal) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">{t.quality.title}</h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title={t.quality.passRate}
          value={passRate ? `${passRate.pass_rate.toFixed(1)}%` : "—"}
          subtitle={`${passRate?.passed ?? 0} / ${passRate?.total ?? 0} tests`}
          icon={CheckCircle}
          variant="success"
        />
        <KpiCard
          title={t.quality.totalTests}
          value={String(passRate?.total ?? 0)}
          subtitle={`${passRate?.failed ?? 0} failed`}
          icon={FlaskConical}
          variant="info"
        />
        <KpiCard
          title={t.quality.complianceScore}
          value={compliance ? `${compliance.compliance_score.toFixed(1)}%` : "—"}
          subtitle={`${compliance?.within_spec ?? 0} / ${compliance?.total_results ?? 0} params`}
          icon={Shield}
          variant="info"
        />
        <KpiCard
          title={t.quality.gradeDistribution}
          value={`A:${grades?.A ?? 0} B:${grades?.B ?? 0} C:${grades?.C ?? 0}`}
          subtitle="Passed tests by grade"
          icon={XCircle}
          variant="warning"
        />
      </div>

      {/* Module quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {modules.map((m) => (
          <button
            key={m.href}
            onClick={() => router.push(m.href)}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
          >
            <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${m.color}`}>
              <m.icon className="w-5 h-5 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{m.label}</div>
              <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade distribution */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">{t.quality.gradeDistribution}</h2>
          {[
            { grade: "A", count: grades?.A ?? 0, pct: gradePct(grades?.A ?? 0), color: "bg-green-500" },
            { grade: "B", count: grades?.B ?? 0, pct: gradePct(grades?.B ?? 0), color: "bg-yellow-500" },
            { grade: "C", count: grades?.C ?? 0, pct: gradePct(grades?.C ?? 0), color: "bg-red-500" },
          ].map((g) => (
            <div key={g.grade} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Grade {g.grade}</span>
                <span className="text-muted-foreground">{g.count} tests ({g.pct}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${g.color} rounded-full transition-all`} style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top defects Pareto */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">{t.quality.defectPareto}</h2>
          {defectPareto && defectPareto.length > 0 ? (
            <div className="space-y-2">
              {defectPareto.slice(0, 5).map((d) => (
                <div key={d.defect_type__defect_code} className="flex items-center gap-3 text-sm">
                  <span className="w-20 font-mono text-xs text-muted-foreground shrink-0">{d.defect_type__defect_code}</span>
                  <span className="flex-1 truncate">{d.defect_type__defect_name_uz}</span>
                  <span className="font-semibold shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.quality.noDefects}</p>
          )}
        </div>
      </div>

      {/* Recent tests */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t.quality.tests}</h2>
          <button onClick={() => router.push("/quality/tests")} className="text-xs text-primary hover:underline">
            {t.quality.tests} →
          </button>
        </div>
        {recentTests && recentTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t.quality.colTest}</th>
                  <th className="pb-2 pr-4 font-medium">{t.quality.colBatch}</th>
                  <th className="pb-2 pr-4 font-medium">{t.quality.colProduct}</th>
                  <th className="pb-2 pr-4 font-medium">{t.quality.colDate}</th>
                  <th className="pb-2 pr-4 font-medium">{t.quality.colResult}</th>
                  <th className="pb-2 font-medium">{t.quality.colGrade}</th>
                </tr>
              </thead>
              <tbody>
                {recentTests.map((test) => (
                  <tr
                    key={test.id}
                    onClick={() => router.push(`/quality/tests/${test.id}`)}
                    className="border-b last:border-0 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-4 font-mono text-xs">{test.test_number}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{test.batch_number ?? "—"}</td>
                    <td className="py-2 pr-4">{test.product_name}</td>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">
                      {new Date(test.test_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4">
                      <ResultBadge result={test.overall_result} />
                    </td>
                    <td className="py-2">
                      {test.quality_grade ? (
                        <GradeBadge grade={test.quality_grade} />
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.quality.noTests}</p>
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
    passed: "Passed", failed: "Failed", pending: "Pending",
    conditional: "Conditional", retest: "Retest",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[result] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[result] ?? result}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    A: "bg-green-100 text-green-800",
    B: "bg-yellow-100 text-yellow-800",
    C: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${map[grade] ?? "bg-gray-100 text-gray-800"}`}>
      {grade}
    </span>
  );
}
