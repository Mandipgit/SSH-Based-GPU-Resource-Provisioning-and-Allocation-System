"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, AlertCircle } from "lucide-react";
import { GpuPreviewCard } from "./GpuPreviewCard";
import { MarketplaceGPU } from "@/types/gpu";
import { getGPUs } from "@/services/api";
import { Button } from "@/components/ui/button";

export function MarketplacePreview() {
  const [gpus, setGpus] = useState<MarketplaceGPU[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGpus() {
      try {
        setIsLoading(true);
        setIsError(false);
        // Fetch only available GPUs from backend
        const data = await getGPUs({ available_only: true });
        if (isMounted) {
          // Select first 3 available GPUs deterministically
          setGpus(data.slice(0, 3));
        }
      } catch (err) {
        console.warn("Failed to fetch available GPUs for landing preview:", err);
        if (isMounted) {
          setIsError(true);
          setGpus([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGpus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-24 bg-background border-b border-border/60">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Cpu className="w-4 h-4" />
              <span>Available Compute Fleet</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Available GPUs
            </h2>
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              Rent verified compute nodes on demand with direct hardware passthrough.
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" className="group gap-2 font-semibold">
              <span>Browse All GPUs</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-primary" />
            </Button>
          </Link>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col justify-between h-[250px] animate-pulse"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/80" />
                      <div className="h-4 w-32 bg-secondary/80 rounded-md" />
                    </div>
                    <div className="h-5 w-16 bg-secondary/60 rounded-full" />
                  </div>
                  <div className="space-y-2 py-3 border-y border-border/40">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-secondary/60 rounded-sm" />
                      <div className="h-3 w-12 bg-secondary/80 rounded-sm" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-secondary/60 rounded-sm" />
                      <div className="h-3 w-24 bg-secondary/80 rounded-sm" />
                    </div>
                  </div>
                </div>
                <div className="h-10 w-full bg-secondary/70 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State - Subtle & Graceful (Does not break the page) */}
        {!isLoading && isError && (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-10 text-center max-w-md mx-auto space-y-4">
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Marketplace inventory is temporarily unreachable.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You can still browse the marketplace directly.
              </p>
            </div>
            <Link href="/marketplace" className="inline-block pt-1">
              <Button variant="outline" size="sm" className="font-semibold">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && gpus.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-10 text-center max-w-md mx-auto space-y-4">
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                No GPUs are currently available.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check back shortly or visit the marketplace to view all nodes.
              </p>
            </div>
            <Link href="/marketplace" className="inline-block pt-1">
              <Button variant="primary" size="sm" className="font-semibold">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        )}

        {/* Real GPU Cards */}
        {!isLoading && !isError && gpus.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gpus.map((gpu) => (
              <GpuPreviewCard key={String(gpu.id)} gpu={gpu} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
