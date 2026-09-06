import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SessionsSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-12 max-w-6xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 bg-muted/60 rounded-lg" />
        <Skeleton className="h-4 w-72 bg-muted/40 rounded-md" />
      </div>

      {/* Active Session Skeleton */}
      <Card className="bg-card border border-border shadow-corporate">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl bg-muted/60" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 bg-muted/60 rounded-md" />
                <Skeleton className="h-3.5 w-32 bg-muted/40 rounded" />
              </div>
            </div>
            <Skeleton className="h-7 w-24 rounded-full bg-muted/50" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl bg-muted/50" />
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-60 bg-muted/40 hidden sm:block rounded" />
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <Skeleton className="h-10 w-28 bg-muted/50 rounded-lg" />
              <Skeleton className="h-10 w-32 bg-muted/60 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session History Skeleton */}
      <Card className="bg-card border border-border shadow-corporate">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-5 w-40 bg-muted/60 rounded" />
            <Skeleton className="h-4 w-28 bg-muted/40 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl bg-muted/40" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
