"use client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { financeApi } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { DataTable } from "@/components/ui/DataTable";
import { formatMoney, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function FinancePage() {
  const t = useT();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: () =>
      financeApi.getSummary({ start_date: monthStart, end_date: todayStr }).then((r) => r.data),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      financeApi.listTransactions({ page_size: 50, ordering: "-transaction_date" }).then((r) => r.data.results),
  });

  const expenseChartData = Object.entries(summary?.expenses_by_category ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const COLORS = ["#2563eb", "#7c3aed", "#d97706", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.nav.finance}</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title={t.finance.totalExpensesMonth}
          value={formatMoney(summary?.total_expenses ?? 0)}
          icon={TrendingDown}
          variant="danger"
          loading={summaryLoading}
        />
        <KpiCard
          title={t.finance.totalIncomeMonth}
          value={formatMoney(summary?.total_income ?? 0)}
          icon={TrendingUp}
          variant="success"
          loading={summaryLoading}
        />
        <KpiCard
          title={t.finance.netMonth}
          value={formatMoney(summary?.net ?? 0)}
          icon={DollarSign}
          variant={(summary?.net ?? 0) >= 0 ? "success" : "danger"}
          loading={summaryLoading}
        />
      </div>

      {/* Charts */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{t.finance.expensesByCategory}</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={expenseChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v)} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => formatMoney(v)}
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="value" name={t.finance.amount} radius={[0, 4, 4, 0]}>
              {expenseChartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{t.finance.recentTransactions}</h2>
        <DataTable
          loading={txLoading}
          data={transactions ?? []}
          rowKey={(r) => r.id as string}
          columns={[
            { key: "transaction_date", header: t.common.date, render: (r) => formatDate(r.transaction_date as string) },
            { key: "transaction_type_display", header: t.finance.colType },
            { key: "description", header: t.finance.colDescription, className: "max-w-xs truncate" },
            {
              key: "is_expense",
              header: t.finance.colDir,
              render: (r) => (
                <span className={`text-xs font-medium ${r.is_expense ? "text-red-500" : "text-green-500"}`}>
                  {r.is_expense ? t.finance.expense : t.finance.income}
                </span>
              ),
            },
            {
              key: "amount",
              header: t.finance.amount,
              className: "tabular text-right font-bold",
              render: (r) => (
                <span className={r.is_expense as boolean ? "text-red-500" : "text-green-600"}>
                  {formatMoney(r.amount as string)}
                </span>
              ),
            },
            { key: "created_by_name", header: t.common.by },
          ]}
        />
      </div>
    </div>
  );
}
