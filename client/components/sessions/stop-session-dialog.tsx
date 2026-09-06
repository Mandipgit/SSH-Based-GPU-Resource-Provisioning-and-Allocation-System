"use client";

import React, { useState } from "react";
import { AlertTriangle, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SessionDetail } from "@/types/session";

interface StopSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionDetail | null;
  onConfirmStop: (sessionId: string) => Promise<void>;
}

export function StopSessionDialog({
  isOpen,
  onClose,
  session,
  onConfirmStop,
}: StopSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !session) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirmStop(session.id);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stop-session-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="stop-session-title" className="font-bold text-lg text-foreground">
              Stop GPU Rental Session?
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Session ID: {session.id.substring(0, 12)}
            </p>
          </div>
        </div>

        {/* Warning Details */}
        <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">
            This action will terminate your active workload:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>The remote Docker container on the host will be stopped.</li>
            <li>All active SSH relays and port forwards will be severed.</li>
            <li>
              Final billing will be calculated based on duration and settled from your wallet.
            </li>
          </ul>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">
              GPU Instance
            </span>
            <span className="font-bold text-foreground truncate block">
              {session.gpuName || session.gpuModel || "NVIDIA GPU"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">
              Hourly Rate
            </span>
            <span className="font-bold text-foreground font-mono">
              NPR {session.pricePerHour}/hr
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            isDisabled={isSubmitting}
            onPress={onClose}
            className="flex-1 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            isPending={isSubmitting}
            onPress={handleConfirm}
            className="flex-1 gap-2 font-semibold"
          >
            <StopCircle className="w-4 h-4" />
            <span>Confirm Stop</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
