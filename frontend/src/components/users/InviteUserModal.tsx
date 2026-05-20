"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { usersApi } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

const ROLES = [
  "admin", "director", "accountant", "production_manager",
  "warehouse_manager", "lab_operator", "sales_manager",
];

const inputCls =
  "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function InviteUserModal({ onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("lab_operator");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      usersApi.create({
        first_name: firstName,
        last_name: lastName,
        email,
        username: email,
        role,
        department,
        password,
        password_confirm: passwordConfirm,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${firstName} ${lastName} invited`);
      onClose();
    },
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const firstError = Object.values(data)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : "Failed to create user");
      } else {
        toast.error("Failed to create user");
      }
    },
  });

  const passwordsMatch = password === passwordConfirm;
  const canSubmit = firstName && lastName && email && password.length >= 8 && passwordsMatch;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4">
          <h2 className="text-base font-semibold">{t.users.inviteUser}</h2>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.settings.firstName} required>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.settings.lastName} required>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </FormField>
          </div>

          <FormField label={t.auth.email} required>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.users.colRole} required>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </FormField>
            <FormField label={t.users.colDepartment}>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.settings.newPassword} required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label={t.settings.confirmPassword} required>
              <input
                type="password" value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>

          {passwordConfirm && !passwordsMatch && (
            <p className="text-xs text-destructive -mt-2">Passwords do not match</p>
          )}
          {password && password.length < 8 && (
            <p className="text-xs text-destructive -mt-2">Password must be at least 8 characters</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !canSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t.users.inviteUser}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
