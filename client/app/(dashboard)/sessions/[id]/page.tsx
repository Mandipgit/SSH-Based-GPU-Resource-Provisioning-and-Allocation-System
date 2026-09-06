"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Coins,
  Copy,
  Cpu,
  HardDrive,
  Radio,
  Server,
  StopCircle,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { SessionDetail } from "@/types/session";
import { getSessionById, stopSession } from "@/services/sessions";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { StopSessionDialog } from "@/components/sessions/stop-session-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = use(params);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    getSessionById(id)
      .then((data) => {
        if (isMounted) {
          setSession(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error fetching session:", err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const isPendingOrPreparing = session?.status === "pending" || session?.status === "preparing";

  // Poll for status updates when instance is provisioning or pending
  useEffect(() => {
    if (!isPendingOrPreparing) {
      return;
    }

    let isPolling = true;
    const interval = setInterval(() => {
      getSessionById(id)
        .then((updated) => {
          if (isPolling && updated) {
            setSession(updated);
          }
        })
        .catch((err) => console.warn("Session status polling error:", err));
    }, 5000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [id, isPendingOrPreparing]);

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("SSH connection command copied to clipboard.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmStop = async (sessionId: string) => {
    try {
      const res = await stopSession(sessionId);
      if (res.success) {
        toast.success("Session stopped successfully.");
        const updated = await getSessionById(sessionId);
        setSession(updated);
      }
    } catch {
      toast.error("Failed to stop session.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12 animate-pulse">
        <Skeleton className="h-6 w-32 bg-muted/60 rounded" />
        <Skeleton className="h-48 w-full rounded-2xl bg-muted/50" />
        <Skeleton className="h-64 w-full rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (!session) {
    return (
      <Card variant="default" className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 max-w-md mx-auto my-12 space-y-4 shadow-corporate">
        <Server className="w-12 h-12 text-muted-foreground/40" />
        <Card.Title className="text-xl font-bold">Session Not Found</Card.Title>
        <Card.Description className="text-sm">
          The requested compute session ({id}) does not exist or has expired.
        </Card.Description>
        <Link href="/sessions">
          <Button variant="secondary" size="md" className="gap-2 mt-2 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Sessions
          </Button>
        </Link>
      </Card>
    );
  }

  const isActive = session.status === "active";
  const isPending = session.status === "pending" || session.status === "preparing";
  const sshCommand = session.sshConnectionString
    ? session.sshConnectionString
    : session.sshHost && session.sshPort
    ? `ssh -p ${session.sshPort} ${session.sshUser || "renter"}@${session.sshHost}`
    : `ssh user@relay.labhya.io -p 22045`;

  const startTimeStr = new Date(session.startTime).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const endTimeStr = session.endTime
    ? new Date(session.endTime).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Ongoing";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      {/* Back Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sessions">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              aria-label="Back to sessions"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {session.gpuName || session.gpuModel || "GPU Compute Instance"}
              </h1>
              <SessionStatusBadge status={session.status} />
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Session ID: {session.id}
            </p>
          </div>
        </div>

        {isActive && (
          <Button
            variant="danger"
            size="md"
            onPress={() => setIsStopDialogOpen(true)}
            className="gap-2 font-semibold self-start sm:self-auto"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Session</span>
          </Button>
        )}
      </div>

      {/* SSH Connection Box (when active) */}
      {isActive && (
        <Card variant="default" className="border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />
          <Card.Content className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Terminal className="w-4 h-4" />
                <span>SSH Terminal Access</span>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                <Radio className="w-3 h-3 animate-pulse" /> Relay Ready
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Run this command in your local terminal to establish an encrypted SSH session to the allocated container:
            </p>

            <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-950 dark:bg-slate-900 rounded-xl border border-border font-mono text-xs text-emerald-400">
              <span className="truncate select-all">{sshCommand}</span>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => handleCopyCommand(sshCommand)}
                className="text-muted-foreground hover:text-white shrink-0"
                aria-label="Copy SSH command"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Pending Provisioning Banner */}
      {isPending && (
        <Card variant="secondary" className="bg-amber-500/5 border-amber-500/25">
          <Card.Content className="p-6 flex items-start gap-3.5">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Container Provisioning in Progress
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                The host Desktop Agent is allocating the Docker container and setting up the secure relay tunnel. SSH credentials will appear automatically once active.
              </p>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Instance & Billing Details */}
      <Card variant="default">
        <Card.Header className="p-6 pb-0">
          <Card.Title className="text-xs font-bold uppercase tracking-wider">
            Instance Specifications & Metrics
          </Card.Title>
        </Card.Header>

        <Card.Content className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">GPU Model</span>
              </div>
              <p className="font-bold text-foreground text-sm truncate">
                {session.gpuName || session.gpuModel || "NVIDIA GPU"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">VRAM</span>
              </div>
              <p className="font-bold text-foreground text-sm">
                {session.vram ? `${session.vram} GB` : "24 GB"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Coins className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Rate</span>
              </div>
              <p className="font-bold text-foreground text-sm font-mono">
                NPR {session.pricePerHour}/hr
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Cost</span>
              </div>
              <p className="font-bold text-foreground text-sm font-mono">
                {session.totalCost !== null ? `NPR ${session.totalCost.toLocaleString()}` : "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground block uppercase text-[10px] font-semibold mb-0.5">Session Start</span>
              <span className="text-foreground font-semibold">{startTimeStr}</span>
            </div>
            <div>
              <span className="text-muted-foreground block uppercase text-[10px] font-semibold mb-0.5">Session End</span>
              <span className="text-foreground font-semibold">{endTimeStr}</span>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Stop Session Dialog */}
      <StopSessionDialog
        isOpen={isStopDialogOpen}
        onClose={() => setIsStopDialogOpen(false)}
        session={session}
        onConfirmStop={handleConfirmStop}
      />
    </div>
  );
}
