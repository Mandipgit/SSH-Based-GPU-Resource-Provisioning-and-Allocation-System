"use client";

import React, { Suspense, useEffect, useState, useMemo, useCallback, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { MarketplaceSearch } from "@/components/marketplace/marketplace-search";
import { GpuSort } from "@/components/marketplace/gpu-sort";
import { GpuFiltersPanel, ModelCount, LocationCount } from "@/components/marketplace/gpu-filters";
import { GpuGrid } from "@/components/marketplace/gpu-grid";
import { GpuCardSkeleton } from "@/components/marketplace/gpu-card-skeleton";
import { MarketplaceEmpty } from "@/components/marketplace/marketplace-empty";
import { MarketplaceError } from "@/components/marketplace/marketplace-error";
import { getGPUs } from "@/services/api";
import { MarketplaceGPU, GpuFilters, SortOption } from "@/types/gpu";
import { useAuthStore } from "@/stores/auth-store";
import { SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import "@/components/marketplace/marketplace.css";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

const initialFilters: GpuFilters = {
  search: "",
  models: [],
  minVram: null,
  minPrice: null,
  maxPrice: null,
  locations: [],
  availableOnly: false,
};

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const isMounted = useIsMounted();

  // Network State
  const [gpus, setGpus] = useState<MarketplaceGPU[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: Grid (default) vs List
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Mobile Filter Sheet State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Read initial filter values from URL params
  const [filters, setFilters] = useState<GpuFilters>(() => {
    const search = searchParams.get("search") || "";
    const modelsParam = searchParams.get("models");
    const models = modelsParam ? modelsParam.split(",").filter(Boolean) : [];
    const vramParam = searchParams.get("vram");
    const minVram = vramParam ? Number(vramParam) : null;
    const minPriceParam = searchParams.get("minPrice");
    const minPrice = minPriceParam ? Number(minPriceParam) : null;
    const maxPriceParam = searchParams.get("maxPrice");
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
    const locParam = searchParams.get("locations");
    const locations = locParam ? locParam.split(",").filter(Boolean) : [];
    const availableOnly = searchParams.get("available") === "true";

    return {
      search,
      models,
      minVram: Number.isNaN(minVram) ? null : minVram,
      minPrice: Number.isNaN(minPrice) ? null : minPrice,
      maxPrice: Number.isNaN(maxPrice) ? null : maxPrice,
      locations,
      availableOnly,
    };
  });

  const [sort, setSort] = useState<SortOption>(() => {
    const sortParam = searchParams.get("sort") as SortOption;
    if (
      sortParam &&
      ["default", "price-asc", "price-desc", "vram-asc", "vram-desc"].includes(sortParam)
    ) {
      return sortParam;
    }
    return "default";
  });

  // Sync state to URL search parameters cleanly
  const syncUrlParams = useCallback(
    (newFilters: GpuFilters, newSort: SortOption) => {
      const params = new URLSearchParams();

      if (newFilters.search.trim()) params.set("search", newFilters.search.trim());
      if (newFilters.models.length > 0) params.set("models", newFilters.models.join(","));
      if (newFilters.minVram !== null) params.set("vram", String(newFilters.minVram));
      if (newFilters.minPrice !== null) params.set("minPrice", String(newFilters.minPrice));
      if (newFilters.maxPrice !== null) params.set("maxPrice", String(newFilters.maxPrice));
      if (newFilters.locations.length > 0) params.set("locations", newFilters.locations.join(","));
      if (newFilters.availableOnly) params.set("available", "true");
      if (newSort !== "default") params.set("sort", newSort);

      const queryString = params.toString();
      const newUrl = queryString ? `/marketplace?${queryString}` : "/marketplace";
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Update filters & sync URL
  const handleFilterChange = (updated: GpuFilters) => {
    setFilters(updated);
    syncUrlParams(updated, sort);
  };

  // Update sort & sync URL
  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    syncUrlParams(filters, newSort);
  };

  // Reset all filters & sort
  const handleResetFilters = () => {
    setFilters(initialFilters);
    syncUrlParams(initialFilters, sort);
  };

  const handleFetchData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getGPUs()
      .then((data) => {
        setGpus(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Unable to retrieve GPU compute nodes.";
        setError(errorMessage);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMountedFlag = true;
    getGPUs()
      .then((data) => {
        if (isMountedFlag) {
          setGpus(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMountedFlag) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Unable to retrieve GPU compute nodes.";
          setError(errorMessage);
          setIsLoading(false);
        }
      });

    return () => {
      isMountedFlag = false;
    };
  }, []);

  // Compute maximum price in catalog for slider bounds
  const maxCatalogPrice = useMemo(() => {
    if (gpus.length === 0) return 500;
    return Math.max(...gpus.map((g) => g.pricePerHour), 300);
  }, [gpus]);

  // Derive dynamic Model counts from inventory
  const availableModels: ModelCount[] = useMemo(() => {
    const counts: Record<string, number> = {};
    gpus.forEach((gpu) => {
      if (gpu.name) {
        counts[gpu.name] = (counts[gpu.name] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [gpus]);

  // Derive dynamic Location counts from inventory
  const availableLocations: LocationCount[] = useMemo(() => {
    const counts: Record<string, number> = {};
    gpus.forEach((gpu) => {
      if (gpu.location) {
        counts[gpu.location] = (counts[gpu.location] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [gpus]);

  // Filter and Sort Pipeline
  const filteredAndSortedGpus = useMemo(() => {
    let result = [...gpus];

    // 1. Search Query (Model / Name / Location)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (gpu) =>
          gpu.name.toLowerCase().includes(q) ||
          gpu.location.toLowerCase().includes(q)
      );
    }

    // 2. Model Filter (OR within category)
    if (filters.models.length > 0) {
      result = result.filter((gpu) => filters.models.includes(gpu.name));
    }

    // 3. VRAM Threshold (vram >= selected)
    if (filters.minVram !== null) {
      result = result.filter((gpu) => gpu.vram >= filters.minVram!);
    }

    // 4. Price Bounds (minPrice <= price <= maxPrice)
    if (filters.minPrice !== null) {
      result = result.filter((gpu) => gpu.pricePerHour >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      result = result.filter((gpu) => gpu.pricePerHour <= filters.maxPrice!);
    }

    // 5. Location Filter (OR within category)
    if (filters.locations.length > 0) {
      result = result.filter((gpu) => filters.locations.includes(gpu.location));
    }

    // 6. Availability Filter
    if (filters.availableOnly) {
      result = result.filter((gpu) => gpu.availability === "available");
    }

    // 7. Sorting
    if (sort === "price-asc") {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sort === "price-desc") {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sort === "vram-asc") {
      result.sort((a, b) => a.vram - b.vram);
    } else if (sort === "vram-desc") {
      result.sort((a, b) => b.vram - a.vram);
    }

    return result;
  }, [gpus, filters, sort]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim() !== "" ||
      filters.models.length > 0 ||
      filters.minVram !== null ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.locations.length > 0 ||
      filters.availableOnly
    );
  }, [filters]);

  // Active filter count for button badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.models.length > 0) count += filters.models.length;
    if (filters.minVram !== null) count++;
    if (filters.minPrice !== null || filters.maxPrice !== null) count++;
    if (filters.locations.length > 0) count += filters.locations.length;
    if (filters.availableOnly) count++;
    return count;
  }, [filters]);

  // Result count formatted text
  const resultCountText = useMemo(() => {
    const len = filteredAndSortedGpus.length;
    if (len === 0) return "No GPUs available";
    if (len === 1) return "1 GPU available";
    return `${len} GPUs available`;
  }, [filteredAndSortedGpus.length]);

  // Core Marketplace Body
  const marketplaceBody = (
    <div className="flex flex-col gap-5 max-w-[1240px] mx-auto w-full pb-16">
      {/* 1. Header */}
      <MarketplaceHeader />

      {/* 2. Search + Marketplace Controls Bar */}
      <div className="flex flex-col gap-3">
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <MarketplaceSearch
              value={filters.search}
              onChange={(search) => handleFilterChange({ ...filters, search })}
            />
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
            {/* Sort Select */}
            <GpuSort value={sort} onChange={handleSortChange} />

            {/* Grid / List Segmented Toggle */}
            <div className="flex items-center h-[44px] bg-[#10101e] border border-white/[0.07] rounded-[10px] p-1 gap-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`h-full px-2.5 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#7c3aed] text-white shadow-xs"
                    : "bg-transparent text-[#7a7a9a] hover:text-[#f0f0f8]"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`h-full px-2.5 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#7c3aed] text-white shadow-xs"
                    : "bg-transparent text-[#7a7a9a] hover:text-[#f0f0f8]"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filters Button (Mobile Trigger) */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              aria-label="Open filter sidebar"
              className="lg:hidden h-[44px] px-3.5 rounded-[10px] bg-[#10101e] border border-white/[0.07] text-[#f0f0f8] hover:border-white/15 text-xs font-inter font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#9f67ff]" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#7c3aed] text-[10px] font-bold flex items-center justify-center text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips / Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="font-inter text-xs text-[#7a7a9a] font-medium mr-1">
              Active:
            </span>

            {filters.search.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-inter bg-[#16162a] text-[#f0f0f8] border border-white/[0.07]">
                Search: &quot;{filters.search}&quot;
                <button
                  type="button"
                  onClick={() => handleFilterChange({ ...filters, search: "" })}
                  className="text-[#7a7a9a] hover:text-white transition-colors cursor-pointer"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.models.map((model) => (
              <span
                key={model}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-inter bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#c4a9ff]"
              >
                {model}
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange({
                      ...filters,
                      models: filters.models.filter((m) => m !== model),
                    })
                  }
                  className="text-[#c4a9ff] hover:text-white transition-colors cursor-pointer"
                  aria-label={`Remove ${model} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.minVram !== null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-inter bg-[#16162a] text-[#f0f0f8] border border-white/[0.07]">
                ≥ {filters.minVram} GB VRAM
                <button
                  type="button"
                  onClick={() => handleFilterChange({ ...filters, minVram: null })}
                  className="text-[#7a7a9a] hover:text-white transition-colors cursor-pointer"
                  aria-label="Remove VRAM filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.minPrice !== null || filters.maxPrice !== null) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-inter bg-[#16162a] text-[#f0f0f8] border border-white/[0.07]">
                NPR {filters.minPrice ?? 0} - {filters.maxPrice !== null ? `NPR ${filters.maxPrice}` : "Max"}
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange({
                      ...filters,
                      minPrice: null,
                      maxPrice: null,
                    })
                  }
                  className="text-[#7a7a9a] hover:text-white transition-colors cursor-pointer"
                  aria-label="Remove price filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-inter bg-[#16162a] text-[#f0f0f8] border border-white/[0.07]"
              >
                {loc}
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange({
                      ...filters,
                      locations: filters.locations.filter((l) => l !== loc),
                    })
                  }
                  className="text-[#7a7a9a] hover:text-white transition-colors cursor-pointer"
                  aria-label={`Remove ${loc} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.availableOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-inter bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80]">
                Available Only
                <button
                  type="button"
                  onClick={() => handleFilterChange({ ...filters, availableOnly: false })}
                  className="text-[#4ade80] hover:text-white transition-colors cursor-pointer"
                  aria-label="Remove available only filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="font-inter text-xs text-[#9f67ff] hover:text-white font-medium ml-1 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Content Layout: Sidebar + Listings */}
      <div className="flex flex-col lg:flex-row gap-7 items-start mt-1">
        {/* Desktop Left Sidebar (240px width) */}
        <aside className="hidden lg:block shrink-0 w-[240px] sticky top-24">
          <GpuFiltersPanel
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            availableModels={availableModels}
            availableLocations={availableLocations}
            hasActiveFilters={hasActiveFilters}
            maxCatalogPrice={maxCatalogPrice}
          />
        </aside>

        {/* Right Listings Section */}
        <section className="flex-1 min-w-0 flex flex-col gap-3.5 w-full">
          {/* Results Count Header */}
          {!isLoading && !error && (
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-outfit text-sm font-semibold text-[#f0f0f8]">
                  {filteredAndSortedGpus.length}
                </span>
                <span className="font-inter text-xs text-[#7a7a9a]">
                  {filteredAndSortedGpus.length === 1 ? "GPU available" : "GPUs available"}
                </span>
              </div>
            </div>
          )}

          {/* State 1: Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 w-full">
              {Array.from({ length: 6 }).map((_, idx) => (
                <GpuCardSkeleton key={idx} />
              ))}
            </div>
          )}

          {/* State 2: API Error */}
          {!isLoading && error && (
            <MarketplaceError message={error} onRetry={handleFetchData} />
          )}

          {/* State 3: Empty State */}
          {!isLoading && !error && filteredAndSortedGpus.length === 0 && (
            <MarketplaceEmpty
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleResetFilters}
            />
          )}

          {/* State 4: Active GPU Grid / List */}
          {!isLoading && !error && filteredAndSortedGpus.length > 0 && (
            <GpuGrid gpus={filteredAndSortedGpus} viewMode={viewMode} />
          )}
        </section>
      </div>

      {/* Mobile Filter Drawer / Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/[0.07] bg-[#10101e] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.07] mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#9f67ff]" />
                <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#f0f0f8]">
                  Filter GPUs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1 rounded-lg text-[#7a7a9a] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <GpuFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              availableModels={availableModels}
              availableLocations={availableLocations}
              hasActiveFilters={hasActiveFilters}
              maxCatalogPrice={maxCatalogPrice}
              className="border-0 p-0 bg-transparent shadow-none w-full"
            />

            <div className="mt-6 pt-4 border-t border-white/[0.07] flex gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#16162a] text-[#7a7a9a] hover:text-white border border-white/[0.07] text-xs font-inter font-medium transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#7c3aed] text-white hover:bg-[#9f67ff] text-xs font-inter font-semibold transition-colors shadow-sm"
              >
                Show Results ({filteredAndSortedGpus.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Authenticated Mode: Render inside DashboardLayout with Sidebar & Header
  if (isMounted && isAuthenticated) {
    return <DashboardLayout>{marketplaceBody}</DashboardLayout>;
  }

  // Public / Guest Mode: Render with Website Navbar and Footer
  return (
    <div className="marketplace-page-wrapper flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-12">
        {marketplaceBody}
      </main>
      <Footer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080810] flex items-center justify-center text-[#7a7a9a]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
            <p className="font-inter text-xs font-medium text-[#7a7a9a]">
              Loading GPU Marketplace...
            </p>
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
