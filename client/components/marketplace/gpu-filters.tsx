"use client";

import React, { useMemo } from "react";
import { Check, RotateCcw } from "lucide-react";
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
  maxCatalogPrice?: number;
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
  maxCatalogPrice = 500,
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

  // Compute slider max ceiling
  const sliderMax = Math.max(300, maxCatalogPrice);
  const currentMaxPrice = filters.maxPrice ?? sliderMax;

  return (
    <div
      className={cn(
        "flex flex-col gap-6 w-full lg:w-[240px] text-left select-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <h2 className="font-outfit text-xs font-bold uppercase tracking-wider text-[#f0f0f8]">
          FILTERS
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-medium text-[#9f67ff] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* 1. GPU MODEL */}
      {availableModels.length > 0 && (
        <div className="space-y-2.5">
          <label className="block font-outfit text-[11px] font-semibold uppercase tracking-wider text-[#7a7a9a]">
            GPU MODEL
          </label>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 mp-filter-scroll">
            {availableModels.map(({ name, count }) => {
              const isSelected = filters.models.includes(name);
              return (
                <div
                  key={name}
                  onClick={() => toggleModel(name)}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[#16162a]/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all shrink-0",
                        isSelected
                          ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                          : "border-white/20 bg-[#16162a] group-hover:border-white/30"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-inter truncate transition-colors",
                        isSelected ? "text-[#f0f0f8] font-medium" : "text-[#7a7a9a] group-hover:text-[#f0f0f8]"
                      )}
                    >
                      {name}
                    </span>
                  </div>
                  <span className="text-[11px] font-inter px-1.5 py-0.5 rounded bg-[#16162a] text-[#7a7a9a] shrink-0 font-medium">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. VRAM */}
      <div className="space-y-2.5">
        <label className="block font-outfit text-[11px] font-semibold uppercase tracking-wider text-[#7a7a9a]">
          VRAM
        </label>
        <div className="flex flex-wrap gap-1.5">
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
                  "px-2.5 py-1 rounded-[8px] text-xs font-inter font-medium transition-all cursor-pointer border",
                  isSelected
                    ? "bg-[#7c3aed]/[0.18] border-[#7c3aed]/[0.55] text-[#c4a9ff] font-semibold shadow-xs"
                    : "bg-transparent border-white/[0.07] text-[#7a7a9a] hover:text-[#f0f0f8] hover:border-white/15"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRICE / HOUR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-outfit text-[11px] font-semibold uppercase tracking-wider text-[#7a7a9a]">
            PRICE / HOUR
          </label>
          <div className="text-xs font-inter">
            <span className="text-[#7a7a9a]">NPR 0 — </span>
            <span className="font-semibold text-[#9f67ff]">
              NPR {currentMaxPrice}
            </span>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={sliderMax}
            step={10}
            value={currentMaxPrice}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange({
                ...filters,
                maxPrice: val >= sliderMax ? null : val,
              });
            }}
            className="mp-range-slider"
          />
        </div>
      </div>

      {/* 4. LOCATION */}
      {availableLocations.length > 0 && (
        <div className="space-y-2.5">
          <label className="block font-outfit text-[11px] font-semibold uppercase tracking-wider text-[#7a7a9a]">
            LOCATION
          </label>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 mp-filter-scroll">
            {availableLocations.map(({ name, count }) => {
              const isSelected = filters.locations.includes(name);
              return (
                <div
                  key={name}
                  onClick={() => toggleLocation(name)}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[#16162a]/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all shrink-0",
                        isSelected
                          ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                          : "border-white/20 bg-[#16162a] group-hover:border-white/30"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-inter truncate transition-colors",
                        isSelected ? "text-[#f0f0f8] font-medium" : "text-[#7a7a9a] group-hover:text-[#f0f0f8]"
                      )}
                    >
                      {name}
                    </span>
                  </div>
                  <span className="text-[11px] font-inter px-1.5 py-0.5 rounded bg-[#16162a] text-[#7a7a9a] shrink-0 font-medium">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. AVAILABLE NOW */}
      <div className="pt-2 border-t border-white/[0.07]">
        <div
          onClick={() => onChange({ ...filters, availableOnly: !filters.availableOnly })}
          className="flex items-center justify-between cursor-pointer py-1.5 group"
        >
          <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#7a7a9a] group-hover:text-[#f0f0f8] transition-colors">
            AVAILABLE NOW
          </span>
          <div className={cn("mp-toggle-track", filters.availableOnly && "is-on")}>
            <div className="mp-toggle-knob" />
          </div>
        </div>
      </div>

      {/* 6. CLEAR ALL FILTERS BUTTON (Only when active) */}
      {hasActiveFilters && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2 px-3 rounded-[8px] text-xs font-inter font-medium text-[#9f67ff] bg-[#7c3aed]/10 border border-[#7c3aed]/25 hover:bg-[#7c3aed]/20 transition-all cursor-pointer text-center"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
export default GpuFiltersPanel;
