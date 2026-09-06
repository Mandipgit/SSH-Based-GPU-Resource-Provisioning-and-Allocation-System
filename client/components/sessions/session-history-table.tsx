"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Coins, Cpu, History } from "lucide-react";
import { SessionDetail } from "@/types/session";
import { SessionStatusBadge } from "./session-status-badge";
import { Card, CardContent } from "@/components/ui/card";

interface SessionHistoryTableProps {
  sessions: SessionDetail[];
}

function formatDuration(startTimeStr: string, endTimeStr?: string | null): string {
  const start = new Date(startTimeStr).getTime();
  const end = endTimeStr ? new Date(endTimeStr).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${Math.max(1, minutes)}m`;
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionHistoryTable({ sessions }: SessionHistoryTableProps) {
  if (sessions.length === 0) {
    return (
      <Card className="bg-card border border-border shadow-corporate">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center">
          <History className="h-8 w-8 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-base font-bold text-foreground">
            No session history
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Past completed, stopped, and cancelled GPU rental sessions will be listed here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-corporate">
      <CardContent className="p-0 sm:p-6 flex flex-col">
        <div className="p-4 sm:p-0 sm:pb-4 flex items-center justify-between border-b sm:border-b-0 border-border/60">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Rental History ({sessions.length})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Click session for details
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-3 font-medium">Session ID</th>
                <th className="py-3 px-3 font-medium">GPU Model</th>
                <th className="py-3 px-3 font-medium">Start Time</th>
                <th className="py-3 px-3 font-medium">End Time</th>
                <th className="py-3 px-3 font-medium">Duration</th>
                <th className="py-3 px-3 font-medium">Total Cost</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {sessions.map((s) => {
                const duration = formatDuration(s.startTime, s.endTime);
                const startTime = formatDateTime(s.startTime);
                const endTime = formatDateTime(s.endTime);

                return (
                  <tr
                    key={s.id}
                    className="group hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-3">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="text-primary hover:underline font-semibold font-mono block truncate max-w-[110px]"
                      >
                        {s.id.substring(0, 10)}...
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {s.gpuName || s.gpuModel || "NVIDIA GPU"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-mono text-[11px]">
                      {startTime}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-mono text-[11px]">
                      {endTime}
                    </td>
                    <td className="py-3.5 px-3 text-foreground font-semibold font-mono">
                      {duration}
                    </td>
                    <td className="py-3.5 px-3 text-foreground font-bold font-mono">
                      {s.totalCost !== null ? `NPR ${s.totalCost.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3.5 px-3">
                      <SessionStatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="inline-flex p-1.5 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors"
                        title="View details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-border/60">
          {sessions.map((s) => {
            const duration = formatDuration(s.startTime, s.endTime);
            const startTime = formatDateTime(s.startTime);
            const endTime = formatDateTime(s.endTime);

            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="p-4 block hover:bg-secondary/20 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-primary block">
                      {s.id.substring(0, 12)}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">
                      {s.gpuName || s.gpuModel || "NVIDIA GPU"}
                    </h4>
                  </div>
                  <SessionStatusBadge status={s.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-secondary/40 p-3 rounded-xl border border-border/60">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Duration: <strong className="text-foreground">{duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Coins className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Cost: <strong className="text-foreground font-mono">{s.totalCost ? `NPR ${s.totalCost}` : "—"}</strong></span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                    <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{startTime} &rarr; {endTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs text-primary font-semibold gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
