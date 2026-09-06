"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  Coins,
  Cpu,
  ExternalLink,
  HardDrive,
  Radio,
  Server,
  StopCircle,
  Terminal,
} from "lucide-react";
import { SessionDetail } from "@/types/session";
import { SessionStatusBadge } from "./session-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ActiveSessionCardProps {
  session: SessionDetail | null;
  onStopClick: (session: SessionDetail) => void;
}

function formatDuration(startTimeStr: string, endTimeStr?: string | null): string {
  const start = new Date(startTimeStr).getTime();
  const end = endTimeStr ? new Date(endTimeStr).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function calculateLiveCost(startTimeStr: string, pricePerHour: number, currentCost?: number | null): string {
  if (currentCost !== null && currentCost !== undefined && currentCost > 0) {
    return currentCost.toFixed(2);
  }
  if (!pricePerHour) return "0.00";
  const start = new Date(startTimeStr).getTime();
  const elapsedHours = Math.max(0, (Date.now() - start) / (1000 * 60 * 60));
  return (elapsedHours * pricePerHour).toFixed(2);
}

export function ActiveSessionCard({ session, onStopClick }: ActiveSessionCardProps) {
  const [duration, setDuration] = useState<string>("");
  const [liveCost, setLiveCost] = useState<string>("");

  useEffect(() => {
    if (!session) return;

    const update = () => {
      setDuration(formatDuration(session.startTime, session.endTime));
      setLiveCost(calculateLiveCost(session.startTime, session.pricePerHour, session.totalCost));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Empty state when there is no active session
  if (!session) {
    return (
      <Card variant="default" className="relative overflow-hidden">
        <Card.Content className="p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-primary/20 text-primary shrink-0 shadow-xs">
              <Server className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                No active session
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
                Your currently rented GPUs will appear here. Rent an on-demand GPU from the marketplace to start computing.
              </p>
            </div>
          </div>

          <Link href="/marketplace" className="shrink-0 w-full md:w-auto">
            <Button variant="primary" size="md" className="w-full md:w-auto font-semibold shadow-sm">
              Browse GPUs
            </Button>
          </Link>
        </Card.Content>
      </Card>
    );
  }

  const isPending = session.status === "pending" || session.status === "preparing";
  const isActive = session.status === "active";
  const formattedStartTime = new Date(session.startTime).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card variant="default" className="relative overflow-hidden p-6 sm:p-8 flex flex-col gap-6">
      {/* Top accent glow line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

      {/* Top bar: GPU Title + Status Badges */}
      <Card.Header className="p-0 pb-4 flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 space-y-0">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-primary/25 text-primary shrink-0 mt-0.5 shadow-xs">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Card.Title className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {session.gpuName || session.gpuModel || "NVIDIA GPU"}
              </Card.Title>
              <SessionStatusBadge status={session.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
              <span>ID: {session.id.substring(0, 12)}</span>
              <span>&bull;</span>
              <span>Started: {formattedStartTime}</span>
            </div>
          </div>
        </div>

        {/* Connection Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {isActive && session.sshHost && (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>SSH Available</span>
              {session.sshPort && (
                <span className="text-emerald-600/70 dark:text-emerald-400/70">:{session.sshPort}</span>
              )}
            </div>
          )}
          {isPending && (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Container Provisioning</span>
            </div>
          )}
        </div>
      </Card.Header>

      {/* Metrics Grid */}
      <Card.Content className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Duration */}
          <div className="rounded-xl p-4 bg-secondary/50 border border-border/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Duration</span>
            </div>
            <p className="text-xl sm:text-2xl font-mono font-bold text-foreground">
              {duration || "0s"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isActive ? "Live timer" : "Allocating"}
            </p>
          </div>

          {/* Current Cost */}
          <div className="rounded-xl p-4 bg-secondary/50 border border-border/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Accrued Cost</span>
            </div>
            <p className="text-xl sm:text-2xl font-mono font-bold text-foreground">
              NPR {liveCost || "0.00"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              NPR {session.pricePerHour}/hour
            </p>
          </div>

          {/* VRAM / Specifications */}
          <div className="rounded-xl p-4 bg-secondary/50 border border-border/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Memory</span>
            </div>
            <p className="text-xl sm:text-2xl font-mono font-bold text-foreground">
              {session.vram ? `${session.vram} GB` : "24 GB"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Dedicated VRAM
            </p>
          </div>

          {/* GPU Utilization or Connection State */}
          <div className="rounded-xl p-4 bg-secondary/50 border border-border/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Status</span>
            </div>
            <p className="text-xl sm:text-2xl font-mono font-bold text-foreground">
              {session.gpuUtilization !== undefined ? `${session.gpuUtilization}%` : "Online"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {session.connectionStatus || (isActive ? "Ready" : "Provisioning")}
            </p>
          </div>
        </div>
      </Card.Content>

      {/* Action Controls */}
      <Card.Footer className="p-0 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Connect via SSH relay from your local terminal.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="danger-soft"
            size="md"
            onPress={() => onStopClick(session)}
            className="flex-1 sm:flex-initial gap-2 font-semibold"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Session</span>
          </Button>

          <Link href={`/sessions/${session.id}`} className="flex-1 sm:flex-initial">
            <Button variant="secondary" size="md" className="w-full gap-2 font-semibold shadow-xs">
              <ExternalLink className="w-4 h-4" />
              <span>Open Session</span>
            </Button>
          </Link>
        </div>
      </Card.Footer>
    </Card>
  );
}
