"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Calendar,
  Wallet,
  Settings,
  User,
  PanelLeftClose,
  X,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: Server },
  { name: "Sessions", href: "/sessions", icon: Calendar },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile Backdrop Overlay with smooth fade */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden transition-opacity duration-300 ease-in-out",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Aside Container with smooth width & transform transitions */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out md:relative flex flex-col shrink-0 shadow-sm",
          isSidebarOpen
            ? "w-64 translate-x-0 opacity-100"
            : "w-64 -translate-x-full md:w-0 md:translate-x-0 md:opacity-0 md:border-r-0 md:overflow-hidden pointer-events-none"
        )}
      >
        <div className="w-64 flex flex-col h-full overflow-hidden shrink-0">
          {/* Header with Title and Close Button */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-extrabold text-lg text-foreground tracking-tight group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="truncate bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                tero gpu de malai
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={toggleSidebar}
              aria-label="Close sidebar"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <PanelLeftClose className="hidden md:block h-4 w-4" />
              <X className="md:hidden h-4 w-4" />
            </Button>
          </div>

          {/* Navigation items */}
          <nav className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Platform
            </div>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent text-primary font-semibold shadow-xs border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-sidebar-border mt-auto">
            <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 border border-border/60">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Network Online</p>
                <p className="text-[10px] text-muted-foreground truncate">Direct SSH Provisioning</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
