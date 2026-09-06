import { Session } from "@/types";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecentSessionsProps {
  sessions: Session[];
  getGpuModel: (gpuId: string) => string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
    active: {
      label: "Active",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dotClass: "bg-emerald-500 animate-pulse",
    },
    completed: {
      label: "Completed",
      badgeClass: "bg-secondary text-muted-foreground border-border/60",
      dotClass: "bg-muted-foreground",
    },
    cancelled: {
      label: "Cancelled",
      badgeClass: "bg-secondary text-muted-foreground border-border/60",
      dotClass: "bg-muted-foreground",
    },
    pending: {
      label: "Pending",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      dotClass: "bg-amber-500 animate-pulse",
    },
    failed: {
      label: "Failed",
      badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
      dotClass: "bg-destructive",
    },
  };
  
  const cfg = map[status] || map["completed"];
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border", cfg.badgeClass)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

export function RecentSessions({ sessions, getGpuModel }: RecentSessionsProps) {
  if (sessions.length === 0) {
    return (
      <Card variant="default" className="h-full flex flex-col justify-center min-h-[220px]">
        <Card.Content className="p-8 text-center flex flex-col items-center justify-center">
          <History className="h-8 w-8 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">No sessions yet</h3>
          <p className="text-xs text-muted-foreground mb-4">Your completed GPU rentals will appear here.</p>
          <Link 
            href="/marketplace"
            className="text-xs font-semibold text-primary hover:underline transition-colors"
          >
            Browse GPUs
          </Link>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card variant="default" className="h-full">
      <Card.Header className="p-5 sm:p-6 pb-0 flex-row items-center justify-between space-y-0">
        <Card.Title className="text-xs font-bold uppercase tracking-wider">Recent Sessions</Card.Title>
        <Link 
          href="/sessions"
          className="text-xs font-semibold text-primary hover:underline transition-colors flex items-center"
        >
          View all <ArrowRight className="ml-1 w-3 h-3" />
        </Link>
      </Card.Header>

      <Card.Content className="p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 font-medium">Session ID</th>
                <th className="pb-2.5 font-medium">GPU</th>
                <th className="pb-2.5 font-medium">Duration</th>
                <th className="pb-2.5 font-medium">Total Cost</th>
                <th className="pb-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sessions.map((session) => {
                const model = getGpuModel(session.gpuId);
                
                // Calculate duration
                const start = new Date(session.startTime);
                const end = session.endTime ? new Date(session.endTime) : new Date();
                const diffMs = Math.max(0, end.getTime() - start.getTime());
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const duration = diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;

                return (
                  <tr 
                    key={session.id} 
                    className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pr-2">
                      <Link href={`/sessions/${session.id}`} className="font-mono text-xs text-primary font-semibold hover:underline">
                        {session.id.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="font-semibold text-xs text-foreground truncate block max-w-[140px]" title={model}>
                        {model}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-xs font-mono text-muted-foreground">
                      {duration}
                    </td>
                    <td className="py-3 pr-2 text-xs font-mono font-bold text-foreground">
                      {session.totalCost ? `NPR ${session.totalCost.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={session.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card.Content>
    </Card>
  );
}
