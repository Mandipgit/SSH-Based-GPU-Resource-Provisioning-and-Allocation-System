"use client";

import React from "react";
import { Bell, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore, NotificationPreferences } from "@/stores/settings-store";
import { toast } from "sonner";

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function NotificationRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

// ─── Notification rows config ─────────────────────────────────────────────────

const rows: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  group: string;
}[] = [
  {
    key: "rentalStarted",
    label: "Session Activated",
    description: "When a GPU rental session becomes active and is ready to use.",
    group: "Rental",
  },
  {
    key: "rentalStopped",
    label: "Session Ended",
    description: "When a rental session is stopped, expires, or is terminated.",
    group: "Rental",
  },
  {
    key: "walletDeposit",
    label: "Funds Added",
    description: "When a deposit is successfully credited to your wallet.",
    group: "Wallet",
  },
  {
    key: "walletSpend",
    label: "Funds Deducted",
    description: "When compute charges are deducted from your wallet balance.",
    group: "Wallet",
  },
  {
    key: "securityAlerts",
    label: "Security Events",
    description: "Sign-ins from new devices, password changes, or unusual activity.",
    group: "Security",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationSettings() {
  const { notifications, setNotification, resetNotifications } = useSettingsStore();

  const handleReset = () => {
    resetNotifications();
    toast.success("Notification preferences reset to defaults.");
  };

  // Group rows
  const groups = [...new Set(rows.map((r) => r.group))];

  return (
    <Card variant="default">
      {/* Section Header */}
      <Card.Header className="p-6 sm:p-8 pb-4 flex-row items-center justify-between gap-2 border-b border-border/60 space-y-0">
        <div className="flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <Card.Title className="text-base font-bold">Notifications</Card.Title>
            <Card.Description className="text-xs mt-0.5">
              Choose which in-app alerts you want to receive.
            </Card.Description>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onPress={handleReset}
          className="gap-1.5 font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>
      </Card.Header>

      <Card.Content className="p-6 sm:p-8 space-y-6">
        {/* Grouped rows */}
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1">
                {group}
              </p>
              <div className="divide-y divide-border/50 rounded-2xl border border-border/60 overflow-hidden bg-secondary/30 px-4">
                {rows
                  .filter((r) => r.group === group)
                  .map(({ key, label, description }) => (
                    <NotificationRow
                      key={key}
                      label={label}
                      description={description}
                      checked={notifications[key]}
                      onChange={(val) => setNotification(key, val)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground/80 italic">
          These preferences are stored locally in your browser. Email notification
          settings are managed through your account security settings.
        </p>
      </Card.Content>
    </Card>
  );
}
