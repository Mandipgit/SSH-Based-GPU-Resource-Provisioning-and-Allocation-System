"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface MarketplaceSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarketplaceSearch({
  value,
  onChange,
  placeholder = "Search GPUs...",
}: MarketplaceSearchProps) {
  return (
    <div className="relative w-full">
      <label htmlFor="marketplace-gpu-search" className="sr-only">
        Search GPUs
      </label>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-[#7a7a9a] pointer-events-none" />
        <input
          id="marketplace-gpu-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-[44px] w-full rounded-[10px] bg-[#10101e] pl-10 pr-10 text-sm font-inter text-[#f0f0f8] placeholder:text-[#4a4a6a] border border-white/[0.07] shadow-xs outline-none transition-all focus:border-[#7c3aed]/50 focus:ring-3 focus:ring-[#7c3aed]/12"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 p-1 text-[#7a7a9a] hover:text-[#f0f0f8] rounded transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
export default MarketplaceSearch;
