"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const router = useRouter();
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted) return;

    if (!isInitialized) {
      checkAuth();
    }
  }, [isMounted, isInitialized, checkAuth]);

  useEffect(() => {
    if (isMounted && isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, isInitialized, isAuthenticated, router]);

  if (!isMounted || !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
