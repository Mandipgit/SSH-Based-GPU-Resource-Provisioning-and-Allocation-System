import React from "react";

export function GpuCardSkeleton() {
  return (
    <div className="rounded-[14px] border border-white/[0.07] bg-[#10101e] p-4 sm:p-5 flex flex-col justify-between gap-4 animate-pulse">
      <div>
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-white/[0.05] shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-white/[0.08] rounded" />
              <div className="h-2.5 w-16 bg-white/[0.04] rounded" />
            </div>
          </div>
          <div className="h-5 w-16 bg-white/[0.05] rounded-full" />
        </div>

        {/* Spec Panel Skeleton */}
        <div className="grid grid-cols-3 gap-2 bg-[#16162a] border border-white/[0.07] rounded-[10px] p-3 my-3.5">
          <div className="space-y-1.5">
            <div className="h-2.5 w-8 bg-white/[0.05] rounded" />
            <div className="h-4 w-12 bg-white/[0.08] rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-12 bg-white/[0.05] rounded" />
            <div className="h-4 w-14 bg-white/[0.08] rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-8 bg-white/[0.05] rounded" />
            <div className="h-4 w-16 bg-white/[0.08] rounded" />
          </div>
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="h-9 w-full rounded-[8px] bg-white/[0.06]" />
    </div>
  );
}
export default GpuCardSkeleton;
