"use client";

import React, { useState } from "react";
import { Terminal, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { toast } from "sonner";

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComputeSettings() {
  const { compute, setComputePreference, resetCompute } = useSettingsStore();
  const [sshUserInput, setSshUserInput] = useState(compute.defaultSshUser);
  const [sshUserError, setSshUserError] = useState<string | null>(null);

  const handleSshUserSave = () => {
    const val = sshUserInput.trim();
    if (!val) {
      setSshUserError("SSH user cannot be empty.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(val)) {
      setSshUserError("Only letters, numbers, underscores, hyphens, and dots are allowed.");
      return;
    }
    setSshUserError(null);
    setComputePreference("defaultSshUser", val);
    toast.success("Default SSH user updated.");
  };

  const handleReset = () => {
    resetCompute();
    setSshUserInput("root");
    setSshUserError(null);
    toast.success("Compute preferences reset to defaults.");
  };

  return (
    <Card variant="default">
      {/* Section Header */}
      <Card.Header className="p-6 sm:p-8 pb-4 flex-row items-center justify-between gap-2 border-b border-border/60 space-y-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-primary" />
          <div>
            <Card.Title className="text-base font-bold">Session & Compute</Card.Title>
            <Card.Description className="text-xs mt-0.5">
              Preferences for GPU sessions and SSH connections.
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
        {/* Default SSH User */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            SSH Connection
          </p>
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="sshUser"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Default SSH Username
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    id="sshUser"
                    type="text"
                    placeholder="root"
                    value={sshUserInput}
                    onChange={(e) => {
                      setSshUserInput(e.target.value);
                      if (sshUserError) setSshUserError(null);
                    }}
                    className="h-10 font-mono text-sm"
                  />
                  {sshUserError && (
                    <p className="text-xs text-destructive font-semibold">{sshUserError}</p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleSshUserSave}
                  isDisabled={sshUserInput.trim() === compute.defaultSshUser}
                  className="h-10 px-5 font-semibold"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This user is pre-filled in session SSH command snippets. The host
                machine sets the actual credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1">
            Behaviour
          </p>
          <div className="divide-y divide-border/50 rounded-2xl border border-border/60 overflow-hidden bg-secondary/30 px-4">
            <ToggleRow
              label="Auto-Copy SSH Command"
              description="Automatically copy the SSH connection command to your clipboard when a session becomes active."
              checked={compute.autoCopySsh}
              onChange={(val) => {
                setComputePreference("autoCopySsh", val);
                toast.success(val ? "Auto-copy SSH enabled." : "Auto-copy SSH disabled.");
              }}
            />
            <ToggleRow
              label="Confirm Before Stopping Session"
              description="Show a confirmation dialog before terminating an active GPU rental session."
              checked={compute.confirmBeforeStop}
              onChange={(val) => {
                setComputePreference("confirmBeforeStop", val);
                toast.success(val ? "Stop confirmation enabled." : "Stop confirmation disabled.");
              }}
            />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
