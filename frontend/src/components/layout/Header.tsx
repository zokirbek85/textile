"use client";
import { useState } from "react";
import { Menu, Moon, Sun, Search, Bell, LogOut, Globe, CheckCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocale, LOCALE_LABELS, type Locale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const logout = useLogout();
  const { locale, setLocale } = useLocale();
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-muted transition-colors lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border w-64">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="text-xs text-muted-foreground bg-background border border-border rounded px-1">⌘K</kbd>
      </div>

      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setLangOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                      locale === l && "text-primary font-medium"
                    )}
                  >
                    {LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="p-2 rounded-md hover:bg-muted transition-colors relative"
            aria-label={t.common.notifications}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-xl w-80 max-h-96 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <span className="text-sm font-semibold">{t.common.notifications}</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {t.common.markAllRead}
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 px-4">{t.common.noNotifications}</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => markRead(n.id)}
                      >
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                            n.level === "success" && "bg-green-500",
                            n.level === "warning" && "bg-amber-500",
                            n.level === "error" && "bg-red-500",
                            n.level === "info" && "bg-blue-500",
                          )} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-snug">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => logout.mutate()}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
