"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore, AppTheme, UIDensity } from "@/stores/settings-store";
import { toast } from "sonner";

// ─── Theme Picker ────────────────────────────────────────────────────────────

const themeOptions: { value: AppTheme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const densityOptions: { value: UIDensity; label: string; description: string }[] = [
  { value: "compact", label: "Compact", description: "Tighter spacing" },
  { value: "default", label: "Default", description: "Balanced spacing" },
  { value: "comfortable", label: "Comfortable", description: "Roomier spacing" },
];

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
    <div className="flex items-center justify-between gap-4">
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

export function AppearanceSettings() {
  const { setTheme: setNextTheme } = useTheme();
  const { theme, density, reducedMotion, setTheme, setDensity, setReducedMotion, resetAppearance } =
    useSettingsStore();

  // Keep next-themes in sync with the settings store value
  useEffect(() => {
    setNextTheme(theme);
  }, [theme, setNextTheme]);

  const handleThemeChange = (value: AppTheme) => {
    setTheme(value);
    setNextTheme(value);
  };

  const handleReset = () => {
    resetAppearance();
    setNextTheme("system");
    toast.success("Appearance settings reset to defaults.");
  };

  return (
    <Card variant="default">
      {/* Section Header */}
      <Card.Header className="p-6 sm:p-8 pb-4 flex-row items-center justify-between gap-2 border-b border-border/60 space-y-0">
        <div className="flex items-center gap-2.5">
          <Monitor className="w-5 h-5 text-primary" />
          <div>
            <Card.Title className="text-base font-bold">Appearance</Card.Title>
            <Card.Description className="text-xs mt-0.5">
              Customise how tero gpu de malai looks and feels.
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

      <Card.Content className="p-6 sm:p-8 space-y-8">
        {/* Theme */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Color Theme
          </p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={cn(
                  "flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-all duration-150 cursor-pointer",
                  theme === value
                    ? "border-primary bg-primary/10 text-primary shadow-xs font-bold"
                    : "border-border/60 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* UI Density */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            UI Density
          </p>
          <div className="grid grid-cols-3 gap-3">
            {densityOptions.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setDensity(value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-150 cursor-pointer",
                  density === value
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border/60 bg-secondary/30 hover:border-border"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold",
                    density === value ? "text-primary" : "text-foreground"
                  )}
                >
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="pt-2 border-t border-border/60">
          <ToggleRow
            label="Reduced Motion"
            description="Minimise animations and transitions throughout the application."
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
