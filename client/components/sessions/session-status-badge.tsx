import { SessionStatus } from "@/types/session";
import { cn } from "@/lib/utils";

interface SessionStatusBadgeProps {
  status: SessionStatus | string;
  className?: string;
  size?: "sm" | "md";
}

export function SessionStatusBadge({
  status,
  className,
  size = "md",
}: SessionStatusBadgeProps) {
  const norm = (status || "").toLowerCase();

  const getStatusConfig = () => {
    switch (norm) {
      case "active":
        return {
          label: "Active",
          badgeClass:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          dotClass: "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]",
        };
      case "pending":
        return {
          label: "Pending",
          badgeClass:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          dotClass: "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]",
        };
      case "preparing":
        return {
          label: "Provisioning",
          badgeClass:
            "bg-indigo-500/10 text-primary border border-indigo-500/20",
          dotClass: "bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]",
        };
      case "stopping":
        return {
          label: "Stopping",
          badgeClass:
            "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
          dotClass: "bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]",
        };
      case "completed":
        return {
          label: "Completed",
          badgeClass:
            "bg-secondary text-muted-foreground border border-border",
          dotClass: "bg-muted-foreground",
        };
      case "stopped":
        return {
          label: "Stopped",
          badgeClass:
            "bg-secondary text-muted-foreground border border-border",
          dotClass: "bg-muted-foreground",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          badgeClass:
            "bg-secondary text-muted-foreground border border-border",
          dotClass: "bg-muted-foreground",
        };
      case "failed":
        return {
          label: "Failed",
          badgeClass:
            "bg-destructive/10 text-destructive border border-destructive/20",
          dotClass: "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]",
        };
      default:
        return {
          label: status || "Unknown",
          badgeClass:
            "bg-secondary text-muted-foreground border border-border",
          dotClass: "bg-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight whitespace-nowrap transition-colors",
        isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs font-semibold",
        config.badgeClass,
        className
      )}
    >
      <span className={cn("rounded-full shrink-0", isSmall ? "w-1.5 h-1.5" : "w-2 h-2", config.dotClass)} />
      <span>{config.label}</span>
    </span>
  );
}
