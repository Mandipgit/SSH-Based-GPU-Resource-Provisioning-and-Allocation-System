import { Session, GPU } from "@/types";
import { ArrowRight, Server, Terminal, Radio, Clock, Coins, Cpu } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ActiveSessionSectionProps {
  session: Session | null;
  gpu: GPU | null;
}

export function ActiveSessionSection({ session, gpu }: ActiveSessionSectionProps) {
  if (!session) {
    return (
      <Card className="bg-card border border-border shadow-corporate h-full flex flex-col justify-center min-h-[320px]">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/25 text-primary mb-4 shadow-sm">
            <Server className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">No active session</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
            Rent an on-demand GPU from the marketplace to launch your compute workloads.
          </p>
          <Link href="/marketplace">
            <Button variant="primary" size="md" className="font-semibold shadow-sm">
              <span>Browse GPUs</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isPending = session.status === "pending" || session.status === "preparing";

  if (isPending) {
    return (
      <Card className="bg-card border border-border shadow-corporate h-full flex flex-col justify-center min-h-[320px]">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-2xl animate-ping bg-amber-500/20" />
            <div className="relative w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Server className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400">Request Pending</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Allocating container &middot; {gpu?.model || "GPU Instance"}
          </p>
          <Link href={`/sessions/${session.id}`}>
            <Button variant="outline" size="md">
              <span>View Request Details</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Active state calculation
  const startTime = new Date(session.startTime);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - startTime.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationStr = diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;

  return (
    <Card className="bg-card border border-border shadow-corporate h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />
      <CardContent className="p-6 flex flex-col h-full gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Active Session
              </p>
              <p className="text-sm font-mono font-bold text-foreground truncate max-w-[150px]">
                {session.id.substring(0, 10)}...
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Running
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-3.5 bg-secondary/50 border border-border/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Duration</span>
            </div>
            <p className="text-lg font-bold text-foreground font-mono">{durationStr}</p>
            <p className="text-[10px] text-muted-foreground">Elapsed time</p>
          </div>

          <div className="rounded-xl p-3.5 bg-secondary/50 border border-border/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Current Cost</span>
            </div>
            <p className="text-lg font-bold text-foreground font-mono">
              {session.totalCost !== null ? `NPR ${session.totalCost.toLocaleString()}` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {gpu ? `NPR ${gpu.pricePerHour}/hr` : "—"}
            </p>
          </div>

          <div className="rounded-xl p-3.5 bg-secondary/50 border border-border/60 flex flex-col gap-1 col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">GPU Model</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{gpu?.model || "Instance"}</p>
            <p className="text-[10px] text-muted-foreground">{gpu?.vram ? `${gpu.vram} GB VRAM` : "—"}</p>
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Link href={`/sessions/${session.id}`} className="w-full block">
            <Button variant="outline" size="md" fullWidth className="justify-center font-semibold">
              <Terminal className="mr-2 h-4 w-4 text-primary" />
              <span>Open Session Details</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
