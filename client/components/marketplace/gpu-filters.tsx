"use client";

import React from "react";
import { Filter, RotateCcw, Check } from "lucide-react";
import { GpuFilters } from "@/types/gpu";
import { cn } from "@/lib/utils";

export interface ModelCount {
  name: string;
  count: number;
}

export interface LocationCount {
  name: string;
  count: number;
}

interface GpuFiltersProps {
  filters: GpuFilters;
  onChange: (filters: GpuFilters) => void;
  onReset: () => void;
  availableModels: ModelCount[];
  availableLocations: LocationCount[];
  hasActiveFilters: boolean;
  className?: string;
}

const vramOptions: { label: string; value: number | null }[] = [
  { label: "All VRAM", value: null },
  { label: "8 GB+", value: 8 },
  { label: "12 GB+", value: 12 },
  { label: "16 GB+", value: 16 },
  { label: "24 GB+", value: 24 },
  { label: "48 GB+", value: 48 },
  { label: "80 GB+", value: 80 },
];

export function GpuFiltersPanel({
  filters,
  onChange,
  onReset,
  availableModels,
  availableLocations,
  hasActiveFilters,
  className = "",
}: GpuFiltersProps) {
  const toggleModel = (modelName: string) => {
    const isSelected = filters.models.includes(modelName);
    const newModels = isSelected
      ? filters.models.filter((m) => m !== modelName)
      : [...filters.models, modelName];
    onChange({ ...filters, models: newModels });
  };

  const toggleLocation = (locName: string) => {
    const isSelected = filters.locations.includes(locName);
    const newLocations = isSelected
      ? filters.locations.filter((l) => l !== locName)
      : [...filters.locations, locName];
    onChange({ ...filters, locations: newLocations });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 shadow-corporate",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-xs text-foreground tracking-wider uppercase">
            Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </button>
        )}
      </div>

      {/* 1. GPU Model Filter */}
      {availableModels.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            GPU Model
          </label>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {availableModels.map(({ name, count }) => {
              const isSelected = filters.models.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleModel(name)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/30 font-semibold"
                      : "text-foreground hover:bg-secondary/60 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-card"
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 font-mono font-medium">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. VRAM Filter */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          VRAM Memory
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {vramOptions.map((opt) => {
            const isSelected =
              opt.value === null
                ? filters.minVram === null
                : filters.minVram === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    minVram: opt.value === filters.minVram ? null : opt.value,
                  })
                }
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium text-center transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-secondary/40 text-foreground hover:bg-secondary border border-border/50"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Price per Hour (NPR) Filter */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Price / Hour (NPR)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Min</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={filters.minPrice !== null ? filters.minPrice : ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : Math.max(0, Number(e.target.value));
                onChange({ ...filters, minPrice: val });
              }}
              className="h-9 w-full rounded-lg bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground border border-input outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Max</span>
            <input
              type="number"
              min={0}
              placeholder="Any"
              value={filters.maxPrice !== null ? filters.maxPrice : ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : Math.max(0, Number(e.target.value));
                onChange({ ...filters, maxPrice: val });
              }}
              className="h-9 w-full rounded-lg bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground border border-input outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* 4. Location Filter */}
      {availableLocations.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Location
          </label>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
            {availableLocations.map(({ name, count }) => {
              const isSelected = filters.locations.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleLocation(name)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/30 font-semibold"
                      : "text-foreground hover:bg-secondary/60 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-card"
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 font-mono font-medium">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Availability Filter */}
      <div className="pt-3 border-t border-border/60">
        <label className="flex items-center justify-between cursor-pointer py-1">
          <span className="text-xs font-medium text-foreground">
            Available now only
          </span>
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) =>
              onChange({ ...filters, availableOnly: e.target.checked })
            }
            className="w-4 h-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
          />
        </label>
      </div>
    </div>
  );
}
