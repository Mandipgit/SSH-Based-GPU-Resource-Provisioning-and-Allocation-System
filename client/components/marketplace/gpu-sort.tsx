"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";
import { SortOption } from "@/types/gpu";

interface GpuSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "VRAM: High to Low", value: "vram-desc" },
];

export function GpuSort({ value, onChange }: GpuSortProps) {
  return (
    <div className="relative">
      <label htmlFor="gpu-sort-select" className="sr-only">
        Sort
      </label>
      <div className="relative">
        <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7a9a] pointer-events-none" />
        <select
          id="gpu-sort-select"
          aria-label="Sort GPU listings"
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="h-[44px] appearance-none rounded-[10px] bg-[#10101e] pl-10 pr-9 text-sm font-inter font-medium text-[#f0f0f8] border border-white/[0.07] outline-none shadow-xs transition-all hover:border-white/15 focus:border-[#7c3aed]/50 focus:ring-3 focus:ring-[#7c3aed]/12 cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#10101e] text-[#f0f0f8]">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7a7a9a] pointer-events-none">
          ▾
        </span>
      </div>
    </div>
  );
}
export default GpuSort;
