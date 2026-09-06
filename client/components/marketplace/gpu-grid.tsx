import React from "react";
import { MarketplaceGPU } from "@/types/gpu";
import { GpuCard } from "./gpu-card";

interface GpuGridProps {
  gpus: MarketplaceGPU[];
}

export function GpuGrid({ gpus }: GpuGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {gpus.map((gpu) => (
        <GpuCard key={gpu.id} gpu={gpu} />
      ))}
    </div>
  );
}
