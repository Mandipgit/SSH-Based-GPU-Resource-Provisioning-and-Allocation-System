import React from "react";
import { Cpu, RotateCcw } from "lucide-react";

interface MarketplaceEmptyProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function MarketplaceEmpty({
  hasActiveFilters,
  onClearFilters,
}: MarketplaceEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] rounded-[14px] bg-[#10101e] border border-white/[0.07] p-8 text-center">
      <div className="w-12 h-12 rounded-[12px] bg-[#16162a] border border-white/[0.07] flex items-center justify-center text-[#7a7a9a] mb-4">
        <Cpu className="w-6 h-6" />
      </div>

      <h3 className="font-outfit text-lg font-semibold text-[#f0f0f8] mb-1.5">
        No GPUs found
      </h3>

      <p className="font-inter text-xs text-[#7a7a9a] max-w-sm mb-5 leading-relaxed">
        {hasActiveFilters
          ? "Try adjusting your filters or search for another GPU."
          : "There are currently no GPUs registered on the network."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#7c3aed]/10 border border-[#7c3aed]/25 text-[#9f67ff] hover:bg-[#7c3aed]/20 text-xs font-inter font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
}
export default MarketplaceEmpty;
