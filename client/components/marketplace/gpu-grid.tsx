import React from "react";
import { MarketplaceGPU } from "@/types/gpu";
import { GpuCard } from "./gpu-card";

interface GpuGridProps {
  gpus: MarketplaceGPU[];
  viewMode?: "grid" | "list";
}

export function GpuGrid({ gpus, viewMode = "grid" }: GpuGridProps) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3.5 w-full">
        {gpus.map((gpu) => (
          <GpuCard key={gpu.id} gpu={gpu} viewMode="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 w-full">
      {gpus.map((gpu) => (
        <GpuCard key={gpu.id} gpu={gpu} viewMode="grid" />
      ))}
    </div>
  );
}
export default GpuGrid;
