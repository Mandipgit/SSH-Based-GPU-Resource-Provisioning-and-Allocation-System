import React from "react";
import { Cpu } from "lucide-react";

export function MarketplaceHeader() {
  return (
    <div className="flex flex-col gap-2 pb-6 border-b border-border/60">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary border border-primary/20 shadow-xs">
          <Cpu className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          GPU Marketplace
        </h1>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
        Browse available GPUs and find the right compute power for your workload.
      </p>
    </div>
  );
}
