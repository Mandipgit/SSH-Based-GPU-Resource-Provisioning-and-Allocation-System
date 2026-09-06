import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32 bg-muted/60 rounded-lg" />
        <Skeleton className="h-4 w-64 bg-muted/40 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Card Skeleton */}
        <div className="md:col-span-1">
          <Card className="bg-card border border-border shadow-corporate">
            <CardContent className="p-6 flex flex-col items-center space-y-4">
              <Skeleton className="w-20 h-20 rounded-full bg-muted/60" />
              <div className="space-y-2 text-center w-full flex flex-col items-center">
                <Skeleton className="h-5 w-32 bg-muted/60 rounded" />
                <Skeleton className="h-3.5 w-40 bg-muted/40 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-muted/40" />
            </CardContent>
          </Card>
        </div>

        {/* Right Stack Skeletons */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border border-border shadow-corporate">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-44 bg-muted/60 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
                <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
