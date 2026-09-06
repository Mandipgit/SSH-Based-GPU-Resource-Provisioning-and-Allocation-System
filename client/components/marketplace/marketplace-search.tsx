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
  placeholder = "Search GPUs by model (e.g. RTX 4090, A6000)...",
}: MarketplaceSearchProps) {
  return (
    <div className="relative w-full">
      <label htmlFor="marketplace-gpu-search" className="sr-only">
        Search GPUs
      </label>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          id="marketplace-gpu-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground border border-input shadow-xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
