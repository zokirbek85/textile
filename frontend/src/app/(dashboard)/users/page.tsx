"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, CheckCircle, XCircle } from "lucide-react";
import { usersApi } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InviteUserModal } from "@/components/users/InviteUserModal";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { User } from "@/types";

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
  director: "bg-purple-100 text-purple-700 dark:bg-purple-900/20",
  accountant: "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
  production_manager: "bg-green-100 text-green-700 dark:bg-green-900/20",
  warehouse_manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/20",
  lab_operator: "bg-sky-100 text-sky-700 dark:bg-sky-900/20",
  sales_manager: "bg-teal-100 text-teal-700 dark:bg-teal-900/20",
};

export default function UsersPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () =>
      usersApi.list({ search, page_size: 50 }).then((r) => r.data.results),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t.users.deactivated);
    },
    onError: () => toast.error(t.users.deactivateFailed),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t.users.activated);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.users.title}</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> {t.users.inviteUser}
        </button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_BADGE_COLORS).map(([role, cls]) => (
          <span key={role} className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${cls}`}>
            {role.replace("_", " ")}
          </span>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.users.searchPlaceholder}
        className="px-3 py-2 text-sm border border-input rounded-lg bg-background w-64 focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}

      <DataTable<User>
        loading={isLoading}
        data={users ?? []}
        rowKey={(r) => r.id}
        columns={[
          {
            key: "full_name",
            header: t.users.colName,
            render: (r) => (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {r.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: t.users.colRole,
            render: (r) => (
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${ROLE_BADGE_COLORS[r.role] ?? ""}`}>
                {r.role_display}
              </span>
            ),
          },
          { key: "department", header: t.users.colDepartment, render: (r) => r.department || "—" },
          {
            key: "is_active",
            header: t.users.colStatus,
            render: (r) => (
              <StatusBadge status={r.is_active ? "active" : "inactive"} />
            ),
          },
          {
            key: "last_login",
            header: t.users.colLastLogin,
            render: (r) => formatDateTime(r.last_login),
          },
          {
            key: "id",
            header: t.users.colActions,
            render: (r) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  r.is_active
                    ? deactivateMutation.mutate(r.id)
                    : activateMutation.mutate(r.id);
                }}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title={r.is_active ? t.users.deactivate : t.users.activate}
              >
                {r.is_active
                  ? <XCircle className="w-4 h-4 text-red-500" />
                  : <CheckCircle className="w-4 h-4 text-green-500" />}
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
