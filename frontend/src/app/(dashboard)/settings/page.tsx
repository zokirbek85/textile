"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { usersApi } from "@/lib/api";
import { Moon, Sun, Monitor, User, Lock, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export default function SettingsPage() {
  const t = useT();
  const [activeSection, setActiveSection] = useState("appearance");
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuthStore();

  const SECTIONS = [
    { id: "profile", label: t.settings.profile, icon: User },
    { id: "security", label: t.settings.security, icon: Lock },
    { id: "notifications", label: t.nav.notifications, icon: Bell },
    { id: "appearance", label: t.settings.appearance, icon: Monitor },
  ];

  // ── Profile section ───────────────────────────────────────────────────────────
  const nameParts = user?.full_name?.split(" ") ?? [];
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");

  const profileMutation = useMutation({
    mutationFn: () =>
      usersApi.update(user!.id, {
        first_name: firstName,
        last_name: lastName,
        phone,
        department,
      }),
    onSuccess: (res) => {
      updateUser({
        full_name: `${firstName} ${lastName}`.trim(),
        phone: res.data.phone,
        department: res.data.department,
      });
      toast.success(t.settings.saveChanges + " ✓");
    },
    onError: () => toast.error("Failed to save profile"),
  });

  // ── Security section ──────────────────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMutation = useMutation({
    mutationFn: () =>
      usersApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      }),
    onSuccess: () => {
      toast.success(t.settings.updatePassword + " ✓");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string; new_password_confirm?: string[] } } })?.response?.data;
      toast.error(detail?.new_password_confirm?.[0] ?? detail?.detail ?? "Failed to update password");
    },
  });

  const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";
  const disabledCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed";

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold">{t.nav.settings}</h1>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="flex flex-col gap-1 w-48 shrink-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                activeSection === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-border bg-card p-6">

          {/* Appearance */}
          {activeSection === "appearance" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">{t.settings.theme}</h2>
              <div className="grid grid-cols-3 gap-3">
                {(["light", "dark", "system"] as const).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={cn(
                      "rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-colors text-sm font-medium",
                      theme === th ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    )}
                  >
                    {th === "light" && <Sun className="w-5 h-5" />}
                    {th === "dark" && <Moon className="w-5 h-5" />}
                    {th === "system" && <Monitor className="w-5 h-5" />}
                    <span>
                      {th === "light" ? t.settings.themeLight
                        : th === "dark" ? t.settings.themeDark
                        : t.settings.themeSystem}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Profile */}
          {activeSection === "profile" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">{t.settings.profileInfo}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.settings.firstName}</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.settings.lastName}</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.auth.email}</label>
                  <input defaultValue={user?.email} disabled className={disabledCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.users.colRole}</label>
                  <input defaultValue={user?.role_display} disabled className={disabledCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.users.colDepartment}</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
                </div>
              </div>
              <button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending || !user}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {profileMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t.settings.saveChanges}
              </button>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">{t.settings.changePassword}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.settings.currentPassword}</label>
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.settings.newPassword}</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{t.settings.confirmPassword}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
                </div>
              </div>
              <button
                onClick={() => passwordMutation.mutate()}
                disabled={passwordMutation.isPending || !oldPassword || !newPassword || newPassword !== confirmPassword}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {passwordMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t.settings.updatePassword}
              </button>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">{t.settings.notificationPrefs}</h2>
              {t.settings.notificationItems.map((label) => (
                <label key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{label}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </div>
                </label>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
