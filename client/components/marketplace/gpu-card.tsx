"use client";

import React from "react";
import Link from "next/link";
import { Cpu, MapPin, ArrowRight } from "lucide-react";
import { MarketplaceGPU } from "@/types/gpu";

interface GpuCardProps {
  gpu: MarketplaceGPU;
  viewMode?: "grid" | "list";
}

export function GpuCard({ gpu, viewMode = "grid" }: GpuCardProps) {
  const isAvailable = gpu.availability === "available";

  if (viewMode === "list") {
    return (
      <div className="mp-gpu-card-list p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#7c3aed]/[0.18] flex items-center justify-center text-[#9f67ff] shrink-0 border border-[#7c3aed]/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="font-outfit text-[15px] font-semibold text-[#f0f0f8] truncate">
                {gpu.name}
              </h3>
              <span
                className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                  isAvailable
                    ? "text-[#4ade80] bg-[#22c55e]/[0.12] border-[#22c55e]/[0.25]"
                    : "text-[#f59e0b] bg-[#f59e0b]/[0.12] border-[#f59e0b]/[0.25]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    isAvailable ? "bg-[#22c55e] animate-pulse" : "bg-[#f59e0b]"
                  }`}
                />
                {isAvailable ? "Available" : "Rented"}
              </span>
            </div>
            <p className="font-inter text-xs text-[#7a7a9a]">GPU Server</p>
          </div>
        </div>

        {/* Center: Specs in Secondary Surface */}
        <div className="flex items-center gap-6 bg-[#16162a] border border-white/[0.07] rounded-[10px] px-4 py-2 text-xs">
          <div>
            <span className="block font-inter text-[10px] uppercase font-semibold text-[#7a7a9a]">
              VRAM
            </span>
            <span className="font-outfit text-sm font-bold text-white">
              {gpu.vram} GB
            </span>
          </div>
          <div className="h-6 w-px bg-white/[0.07]" />
          <div>
            <span className="block font-inter text-[10px] uppercase font-semibold text-[#7a7a9a]">
              LOCATION
            </span>
            <span className="font-inter text-xs text-[#f0f0f8] flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-[#7a7a9a]" />
              {gpu.location}
            </span>
          </div>
          <div className="h-6 w-px bg-white/[0.07]" />
          <div>
            <span className="block font-inter text-[10px] uppercase font-semibold text-[#7a7a9a]">
              RATE
            </span>
            <span className="font-outfit text-sm font-bold text-[#9f67ff]">
              NPR {gpu.pricePerHour.toLocaleString()}
              <span className="font-inter text-[10px] font-normal text-[#7a7a9a]">/hour</span>
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="shrink-0">
          {isAvailable ? (
            <Link
              href={`/marketplace/gpu/${gpu.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[8px] bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#9f67ff] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(124,58,237,0.25)]"
            >
              <span>View GPU</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center px-4 py-2 rounded-[8px] bg-[#16162a] text-[#7a7a9a] border border-white/[0.07] text-xs font-medium cursor-not-allowed opacity-60"
            >
              Currently Rented
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: Grid View Card
  return (
    <div className="mp-gpu-card p-4 sm:p-5 flex flex-col justify-between gap-4">
      <div>
        {/* Top Header: Icon + Title + Availability Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[#7c3aed]/[0.18] flex items-center justify-center text-[#9f67ff] shrink-0 border border-[#7c3aed]/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-outfit text-[15px] font-semibold text-[#f0f0f8] truncate">
                {gpu.name}
              </h3>
              <p className="font-inter text-[11px] text-[#7a7a9a]">GPU Server</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
              isAvailable
                ? "text-[#4ade80] bg-[#22c55e]/[0.12] border-[#22c55e]/[0.25]"
                : "text-[#f59e0b] bg-[#f59e0b]/[0.12] border-[#f59e0b]/[0.25]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isAvailable ? "bg-[#22c55e] animate-pulse" : "bg-[#f59e0b]"
              }`}
            />
            {isAvailable ? "Available" : "Rented"}
          </span>
        </div>

        {/* Specification Panel (Secondary Surface 3-columns) */}
        <div className="grid grid-cols-3 gap-2 bg-[#16162a] border border-white/[0.07] rounded-[10px] p-3 my-3.5 text-left">
          {/* Column 1: VRAM */}
          <div>
            <span className="block font-inter text-[10px] uppercase font-semibold text-[#7a7a9a] mb-0.5">
              VRAM
            </span>
            <span className="font-outfit text-base font-bold text-white tracking-tight">
              {gpu.vram} GB
            </span>
          </div>

          {/* Column 2: Location */}
          <div>
            <span className="block font-inter text-[10px] uppercase font-semibold text-[#7a7a9a] mb-0.5">
              LOCATION
            </span>
            <span className="font-inter text-xs text-[#f0f0f8] flex items-center gap-0.5 font-medium truncate pt-0.5">
              <MapPin className="w-3 h-3 text-[#7a7a9a] shrink-0" />
              <span className="truncate">{gpu.location}</span>
            </span>
          </div>

          {/* Column 3: Rate */}
          <div>
            <span className="block font-inter text-[10px] uppercase font-semibold text-[#7a7a9a] mb-0.5">
              RATE
            </span>
            <div className="flex flex-col">
              <span className="font-outfit text-base font-bold text-[#9f67ff] leading-none">
                NPR {gpu.pricePerHour.toLocaleString()}
              </span>
              <span className="font-inter text-[10px] text-[#7a7a9a] leading-none mt-0.5">
                /hour
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div>
        {isAvailable ? (
          <Link
            href={`/marketplace/gpu/${gpu.id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-[8px] bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#9f67ff] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(124,58,237,0.25)] text-center group"
          >
            <span>View GPU</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-2.5 rounded-[8px] bg-[#16162a] text-[#7a7a9a] border border-white/[0.07] text-xs font-medium cursor-not-allowed opacity-60"
          >
            Currently Rented
          </button>
        )}
      </div>
    </div>
  );
}
export default GpuCard;
