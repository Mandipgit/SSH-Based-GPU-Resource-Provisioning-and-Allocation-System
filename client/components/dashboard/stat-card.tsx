import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}

export function StatCard({ label, value, sub, accent, warn }: StatCardProps) {
  return (
    <Card 
      variant={accent ? "tertiary" : "default"}
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
        warn && "border-destructive/40 bg-gradient-to-br from-card via-card to-destructive/5"
      )}
    >
      <Card.Content className="p-5 sm:p-6 flex flex-col gap-1.5 relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={cn(
          "text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-foreground",
          accent && "text-primary",
          warn && "text-destructive"
        )}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-normal">{sub}</p>
        )}
      </Card.Content>
    </Card>
  );
}
