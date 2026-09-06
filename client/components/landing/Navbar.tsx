"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, LayoutDashboard, Cpu } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const isMounted = useIsMounted();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-border/80 transition-all">
      <div className="container mx-auto flex h-[72px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              Labhya Compute
            </span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/marketplace"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Marketplace
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              How It Works
            </Link>
            <Link
              href="/register/host"
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-150"
            >
              For Hosts
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isMounted && isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="gap-2 font-semibold shadow-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard ({user?.name?.split(" ")[0] || "Account"})</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                Login
              </Link>
              <Link href="/register" className="hidden md:inline-flex">
                <Button variant="primary" size="sm" className="font-semibold shadow-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Toggle navigation menu"
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
