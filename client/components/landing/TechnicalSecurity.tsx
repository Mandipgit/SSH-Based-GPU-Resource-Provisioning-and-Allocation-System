import { ShieldCheck, Server, ArrowRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TechnicalSecurity() {
  return (
    <section className="py-24 bg-background border-b border-border/60 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6 shadow-xs">
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span>Enterprise-Grade Security Model</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-6">
              Your compute environment stays completely isolated.
            </h2>
            
            <p className="text-base text-muted-foreground mb-8 leading-relaxed">
              We&apos;ve built Labhya Compute with security from the ground up. You receive a fully isolated Ubuntu environment, ensuring both your proprietary code and the host&apos;s system remain protected and separate.
            </p>
            
            <ul className="space-y-4 text-sm">
              {[
                "Host filesystems are strictly inaccessible to renter containers",
                "Workloads run inside sandboxed Ubuntu Docker containers",
                "Direct hardware passthrough for near-native CUDA performance",
                "Encrypted reverse SSH tunneling with per-session credentials"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-foreground/90 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <Card className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl relative">
              <div className="flex flex-col space-y-2.5 font-mono text-xs">
                
                <div className="flex items-center justify-center p-3.5 bg-secondary/60 rounded-xl border border-border font-bold text-foreground">
                  <span>Renter Terminal / IDE</span>
                </div>
                
                <div className="flex justify-center py-0.5 text-muted-foreground">
                  <ArrowRight className="w-4 h-4 rotate-90 text-primary" />
                </div>
                
                <div className="flex items-center justify-center p-3.5 bg-primary/10 text-primary rounded-xl border border-primary/25 font-bold">
                  <span>Labhya Compute Relay Gateway</span>
                </div>
                
                <div className="flex justify-center py-0.5 text-muted-foreground">
                  <ArrowRight className="w-4 h-4 rotate-90 text-primary" />
                </div>
                
                <div className="flex items-center justify-center p-3.5 bg-secondary/60 rounded-xl border border-border font-bold text-foreground gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Secure Reverse SSH Tunnel</span>
                </div>
                
                <div className="flex justify-center py-0.5 text-muted-foreground">
                  <ArrowRight className="w-4 h-4 rotate-90 text-primary" />
                </div>
                
                <div className="p-3.5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-2">
                  <div className="text-[10px] text-center text-primary font-bold uppercase tracking-wider">
                    Container Sandbox Boundary
                  </div>
                  
                  <div className="flex items-center justify-center p-2.5 bg-card rounded-lg border border-border text-foreground font-semibold text-xs">
                    <span>Isolated Ubuntu Container</span>
                  </div>
                </div>

                <div className="flex justify-center py-0.5 text-muted-foreground">
                  <ArrowRight className="w-4 h-4 rotate-90 text-emerald-500" />
                </div>

                <div className="flex items-center justify-center p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/25 font-bold gap-2">
                  <Server className="w-4 h-4" />
                  <span>Dedicated NVIDIA GPU Passthrough</span>
                </div>

              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
