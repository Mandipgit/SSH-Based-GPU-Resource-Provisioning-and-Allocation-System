"use client";

import { useAuthStore } from "@/stores/auth-store";

export function DashboardHeader() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="mb-2">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        {getGreeting()}, {firstName}
        <span className="text-primary font-black">.</span>
      </h1>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        Here&apos;s your compute overview and active GPU resources.
      </p>
    </div>
  );
}
