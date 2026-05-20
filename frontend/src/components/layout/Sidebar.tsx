"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Warehouse, Factory, DollarSign,
  FileText, Users, Settings, ChevronLeft,
  Layers, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n";

const NAV_HREFS = [
  { key: "dashboard" as const, href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "director", "accountant", "production_manager", "warehouse_manager", "lab_operator", "sales_manager"] },
  { key: "warehouses" as const, href: "/warehouses", icon: Warehouse, roles: ["admin", "director", "warehouse_manager", "production_manager", "sales_manager"] },
  { key: "production" as const, href: "/production", icon: Factory, roles: ["admin", "director", "production_manager", "lab_operator"] },
  { key: "costing" as const, href: "/costing", icon: Layers, roles: ["admin", "director", "accountant", "production_manager"] },
  { key: "finance" as const, href: "/finance", icon: DollarSign, roles: ["admin", "director", "accountant"] },
  { key: "analytics" as const, href: "/analytics", icon: Zap, roles: ["admin", "director", "production_manager", "accountant"] },
  { key: "reports" as const, href: "/reports", icon: FileText, roles: ["admin", "director", "accountant", "production_manager", "warehouse_manager", "sales_manager"] },
  { key: "users" as const, href: "/users", icon: Users, roles: ["admin", "director"] },
  { key: "settings" as const, href: "/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleCollapsed } = useUIStore();
  const { user } = useAuthStore();
  const t = useT();

  const visibleItems = NAV_HREFS.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Textile ERP</p>
              <p className="text-xs text-sidebar-foreground/50">Manufacturing Suite</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-md hover:bg-sidebar-accent/20 transition-colors"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const label = t.nav[item.key];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {!sidebarCollapsed && user && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent/30 flex items-center justify-center text-xs font-bold">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.role_display}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
