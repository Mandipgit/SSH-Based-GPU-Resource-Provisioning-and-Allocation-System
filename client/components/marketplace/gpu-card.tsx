"use client";

import React from "react";
import Link from "next/link";
import { Cpu, MapPin, ArrowRight } from "lucide-react";
import { MarketplaceGPU } from "@/types/gpu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GpuCardProps {
  gpu: MarketplaceGPU;
}

export function GpuCard({ gpu }: GpuCardProps) {
  const isAvailable = gpu.availability === "available";

  return (
    <Card
      variant="default"
      className="group relative flex flex-col justify-between p-5 hover:shadow-corporate-hover hover:-translate-y-1 hover:border-primary/40 transition-all duration-200"
    >
      <div>
        {/* Top Header: Model Name & Availability Badge */}
        <Card.Header className="p-0 pb-4 flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary border border-primary/20 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <Card.Title className="text-base font-bold truncate">
              {gpu.name}
            </Card.Title>
          </div>

          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
              isAvailable
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isAvailable
                  ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : "bg-amber-500"
              }`}
            />
            {isAvailable ? "Available" : gpu.availability}
          </span>
        </Card.Header>

        {/* Core Specs: VRAM & Location */}
        <Card.Content className="p-0">
          <div className="space-y-2 py-3 border-t border-b border-border/60 my-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">VRAM</span>
              <span className="font-bold text-foreground">{gpu.vram} GB VRAM</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">Location</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {gpu.location}
              </span>
            </div>
          </div>

          {/* Price display */}
          <div className="flex items-baseline justify-between pt-1 pb-3">
            <span className="text-xs text-muted-foreground font-medium">Hourly Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight font-mono">
                NPR {gpu.pricePerHour.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-normal">/ hr</span>
            </div>
          </div>
        </Card.Content>
      </div>

      {/* CTA Button */}
      <Card.Footer className="p-0 pt-2">
        <Link href={`/marketplace/gpu/${gpu.id}`} className="w-full block">
          <Button variant="primary" size="md" fullWidth className="justify-center font-semibold">
            <span>View GPU</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </Card.Footer>
    </Card>
  );
}
