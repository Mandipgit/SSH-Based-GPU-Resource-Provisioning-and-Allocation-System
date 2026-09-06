import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10 animate-pulse">
      <div className="mb-2">
        <Skeleton className="h-8 w-48 mb-2 rounded-lg bg-muted/60" />
        <Skeleton className="h-4 w-64 rounded-md bg-muted/40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-corporate">
          <CardContent className="p-6">
            <Skeleton className="h-3.5 w-24 mb-4 rounded bg-muted/60" />
            <Skeleton className="h-8 w-36 mb-2 rounded-lg bg-muted/70" />
            <Skeleton className="h-3.5 w-28 rounded bg-muted/40" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-corporate">
          <CardContent className="p-6">
            <Skeleton className="h-3.5 w-24 mb-4 rounded bg-muted/60" />
            <Skeleton className="h-8 w-16 mb-2 rounded-lg bg-muted/70" />
            <Skeleton className="h-3.5 w-32 rounded bg-muted/40" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-corporate">
          <CardContent className="p-6">
            <Skeleton className="h-3.5 w-24 mb-4 rounded bg-muted/60" />
            <Skeleton className="h-8 w-16 mb-2 rounded-lg bg-muted/70" />
            <Skeleton className="h-3.5 w-20 rounded bg-muted/40" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Card className="bg-card border-border shadow-corporate min-h-[300px]">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-4 w-32 rounded bg-muted/60" />
                <Skeleton className="h-6 w-20 rounded-full bg-muted/50" />
              </div>
              <div className="grid grid-cols-3 gap-3 my-4">
                <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
                <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
                <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg bg-muted/60 mt-4" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-corporate min-h-[300px]">
            <CardContent className="p-6 flex flex-col gap-3">
              <Skeleton className="h-4 w-32 mb-2 rounded bg-muted/60" />
              <Skeleton className="h-14 w-full rounded-xl bg-muted/40" />
              <Skeleton className="h-14 w-full rounded-xl bg-muted/40" />
              <Skeleton className="h-14 w-full rounded-xl bg-muted/40" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-card border-border shadow-corporate">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-32 mb-4 rounded bg-muted/60" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
              <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
              <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
