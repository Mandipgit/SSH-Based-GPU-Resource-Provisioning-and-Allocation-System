import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function GpuCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-corporate animate-pulse">
      <div>
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="w-8 h-8 rounded-xl bg-muted/60 shrink-0" />
            <Skeleton className="h-5 w-32 bg-muted/70 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 bg-muted/50 rounded-full" />
        </div>

        {/* Specs Skeleton */}
        <div className="space-y-2.5 py-3 border-t border-b border-border/60 my-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-12 bg-muted/40 rounded" />
            <Skeleton className="h-4 w-20 bg-muted/60 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16 bg-muted/40 rounded" />
            <Skeleton className="h-4 w-24 bg-muted/60 rounded" />
          </div>
        </div>

        {/* Price Skeleton */}
        <div className="flex items-baseline justify-between pt-1 pb-4">
          <Skeleton className="h-4 w-16 bg-muted/40 rounded" />
          <Skeleton className="h-7 w-28 bg-muted/70 rounded-md" />
        </div>
      </div>

      {/* Button Skeleton */}
      <Skeleton className="w-full h-9 rounded-lg bg-muted/60" />
    </Card>
  );
}
