import { GPU } from "@/types";
import { ArrowRight, Server, Cpu } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AvailableGpusProps {
  gpus: GPU[];
}

export function AvailableGpus({ gpus }: AvailableGpusProps) {
  if (gpus.length === 0) {
    return (
      <Card variant="default" className="h-full flex flex-col justify-center min-h-[220px]">
        <Card.Content className="p-8 text-center flex flex-col items-center justify-center">
          <Server className="h-8 w-8 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">No GPUs available</h3>
          <p className="text-xs text-muted-foreground">Check back soon for new compute capacity.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card variant="default" className="h-full flex flex-col">
      <Card.Header className="p-5 sm:p-6 pb-0 flex-row items-center justify-between space-y-0">
        <Card.Title className="text-xs font-bold uppercase tracking-wider">Available GPUs</Card.Title>
        <span className="text-[11px] font-semibold text-primary">{gpus.length} Ready</span>
      </Card.Header>
      
      <Card.Content className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex flex-col gap-2.5 flex-1">
          {gpus.slice(0, 3).map((gpu) => (
            <div 
              key={gpu.id} 
              className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/60 transition-all duration-150 hover:bg-secondary/70 hover:border-primary/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-foreground truncate">{gpu.model}</span>
                  <span className="text-xs text-muted-foreground">{gpu.vram} GB VRAM</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-sm font-bold text-foreground">NPR {gpu.pricePerHour}</span>
                <span className="text-[10px] text-muted-foreground block font-medium">/ hr</span>
              </div>
            </div>
          ))}
        </div>

        <Link href="/marketplace" className="mt-4 w-full block">
          <Button variant="secondary" size="sm" fullWidth className="gap-1.5 font-semibold">
            <span>Browse all GPUs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </Card.Content>
    </Card>
  );
}
