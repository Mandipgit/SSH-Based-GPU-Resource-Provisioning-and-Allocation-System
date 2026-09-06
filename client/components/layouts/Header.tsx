"use client";

import { LogOut, Sun, Moon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { logoutUser } from "@/services/api";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const { user } = useAuthStore();
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={toggleSidebar}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="text-muted-foreground hover:text-foreground"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span>Welcome back,</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-primary text-xs font-bold">
              {(user?.name || "U")[0].toUpperCase()}
            </span>
            {user?.name || "User"}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={logoutUser}
          aria-label="Sign out"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
