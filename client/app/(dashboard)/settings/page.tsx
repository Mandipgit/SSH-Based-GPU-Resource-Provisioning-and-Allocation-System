"use client";

import React, { useState } from "react";
import {
  Monitor,
  Bell,
  Terminal,
  Shield,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ComputeSettings } from "@/components/settings/compute-settings";
import { SecuritySettings } from "@/components/settings/security-settings";

// ─── Section tabs ─────────────────────────────────────────────────────────────

const sections = [
  { id: "appearance", label: "Appearance", icon: Monitor },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "compute", label: "Session & Compute", icon: Terminal },
  { id: "security", label: "Security", icon: Shield },
] as const;

type SectionId = (typeof sections)[number]["id"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("appearance");

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary border border-primary/20 shadow-xs">
              <Settings2 className="w-6 h-6" />
            </div>
            <span>Settings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Customise your tero gpu de malai renter experience.
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar nav */}
        <nav className="w-full md:w-56 shrink-0">
          <ul className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {sections.map(({ id, label, icon: Icon }) => (
              <li key={id} className="shrink-0 md:w-full">
                <button
                  onClick={() => setActive(id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all text-left cursor-pointer whitespace-nowrap",
                    active === id
                      ? "bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent text-primary font-bold shadow-xs border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active === id ? "text-primary" : "text-muted-foreground")} />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0 w-full">
          {active === "appearance" && <AppearanceSettings />}
          {active === "notifications" && <NotificationSettings />}
          {active === "compute" && <ComputeSettings />}
          {active === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}
