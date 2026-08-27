import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface MarketplaceErrorProps {
  message?: string;
  onRetry: () => void;
}

export function MarketplaceError({
  message = "We couldn't retrieve the available GPUs right now.",
  onRetry,
}: MarketplaceErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] rounded-[14px] border border-white/[0.07] bg-[#10101e] p-8 text-center">
      <div className="w-12 h-12 rounded-[12px] bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="font-outfit text-lg font-semibold text-[#f0f0f8] mb-1.5">
        Unable to load GPUs
      </h3>

      <p className="font-inter text-xs text-[#7a7a9a] max-w-md mb-5 leading-relaxed">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#7c3aed] text-white text-xs font-inter font-semibold hover:bg-[#9f67ff] transition-all cursor-pointer shadow-sm"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
export default MarketplaceError;
