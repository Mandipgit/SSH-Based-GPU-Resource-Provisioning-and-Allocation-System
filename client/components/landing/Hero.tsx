import Link from "next/link";
import { Terminal, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-28 md:pt-28 md:pb-36 border-b border-border/60">
      {/* Background glow effects */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
      
      <div className="container relative mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 text-left max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            Agent-Ready Compute Infrastructure
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight text-foreground mb-6">
            Rent High-Performance <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              GPUs on Demand.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed font-normal max-w-xl">
            Labhya Compute lets developers, researchers, and AI builders rent available compute capacity with zero hardware overhead and secure SSH access.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-sm gap-2">
                <span>Explore GPUs</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
                How It Works
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Isolated Ubuntu Containers</span>
            </div>
            <span>&bull;</span>
            <div>Pay Hourly by Duration</div>
          </div>
        </div>

        {/* Abstract GPU/Terminal visual */}
        <div className="flex-1 w-full max-w-lg lg:max-w-xl hidden md:block relative z-10">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-2xl rounded-3xl opacity-60" />
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden relative">
            <div className="flex items-center px-4 py-3 border-b border-border/80 bg-secondary/60">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="ml-4 text-xs text-muted-foreground font-mono font-medium">ssh renter@relay.labhyacompute.com</div>
            </div>
            <div className="p-6 font-mono text-xs text-foreground/90 flex flex-col items-start min-h-[240px] leading-relaxed bg-slate-950 text-slate-100">
              <div className="flex items-center gap-2 mb-4 w-full">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-primary-foreground font-semibold">Establishing secure SSH session...</span>
              </div>
              <p className="text-slate-300">Welcome to Ubuntu 22.04 LTS (Docker isolated environment)</p>
              <div className="mt-4 space-y-1 w-full">
                <p className="text-slate-400" suppressHydrationWarning>System status: OK &middot; Direct GPU Passthrough</p>
                <p className="text-indigo-400 font-bold mt-2">$ nvidia-smi</p>
                <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-semibold text-white">GPU 0: NVIDIA RTX 4090 (24GB GDDR6X)</p>
                  <p className="text-slate-400">Driver: 535.129.03 | CUDA: 12.2 | Temp: 39°C</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">renter@labhya:~$</span>
                <span className="w-2 h-4 bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
