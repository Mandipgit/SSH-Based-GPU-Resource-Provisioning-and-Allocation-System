import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32 bg-muted/60 rounded-lg" />
        <Skeleton className="h-4 w-72 bg-muted/40 rounded-md" />
      </div>

      {/* Balance Card Skeleton */}
      <Card className="bg-card border border-border shadow-corporate">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl bg-muted/60 shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 bg-muted/40 rounded" />
              <Skeleton className="h-9 w-52 bg-muted/60 rounded-lg" />
              <Skeleton className="h-3.5 w-64 bg-muted/40 rounded" />
            </div>
          </div>
          <Skeleton className="h-11 w-32 rounded-lg bg-muted/60" />
        </CardContent>
      </Card>

      {/* Transaction History Skeleton */}
      <Card className="bg-card border border-border shadow-corporate">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/60">
            <Skeleton className="h-5 w-44 bg-muted/60 rounded" />
            <Skeleton className="h-8 w-48 rounded-xl bg-muted/40" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl bg-muted/30" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
