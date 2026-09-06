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
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            : "Unable to communicate with the compute network.";
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
              : "Unable to communicate with the compute network.";
          setError(errorMessage);
          setIsLoading(false);
        }
      });

    return () => {
      isMountedFlag = false;
    };
  }, []);

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

    // 1. Search Query (Model / Name)
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

  // Active filter count for mobile button badge
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

  // Core Marketplace Body
  const marketplaceBody = (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <MarketplaceHeader />

      {/* Search, Sort, and Mobile Filter Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <MarketplaceSearch
            value={filters.search}
            onChange={(search) => handleFilterChange({ ...filters, search })}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
          {/* Mobile Filter Sheet Trigger Button */}
          <Button
            variant="outline"
            size="md"
            onPress={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2"
            aria-label="Open filter options"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-[11px] font-bold flex items-center justify-center text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <GpuSort value={sort} onChange={handleSortChange} />
        </div>
      </div>

      {/* Active Filter Chips / Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground font-semibold mr-1">
            Active filters:
          </span>

          {filters.search.trim() && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
              Search: &quot;{filters.search}&quot;
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, search: "" })}
                className="hover:text-destructive transition-colors cursor-pointer"
                aria-label="Remove search filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.models.map((model) => (
            <span
              key={model}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/30 text-primary"
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
                className="hover:text-foreground transition-colors cursor-pointer"
                aria-label={`Remove ${model} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.minVram !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
              ≥ {filters.minVram} GB VRAM
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, minVram: null })}
                className="hover:text-destructive transition-colors cursor-pointer"
                aria-label="Remove VRAM filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.minPrice !== null || filters.maxPrice !== null) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
              NPR {filters.minPrice ?? 0} - {filters.maxPrice !== null ? `NPR ${filters.maxPrice}` : "Any"}
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({
                    ...filters,
                    minPrice: null,
                    maxPrice: null,
                  })
                }
                className="hover:text-destructive transition-colors cursor-pointer"
                aria-label="Remove price filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.locations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border"
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
                className="hover:text-destructive transition-colors cursor-pointer"
                aria-label={`Remove ${loc} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.availableOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              Available Only
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, availableOnly: false })}
                className="hover:text-foreground transition-colors cursor-pointer"
                aria-label="Remove available only filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <Button
            variant="link"
            size="xs"
            onPress={handleResetFilters}
            className="text-xs text-primary font-semibold ml-1 p-0 h-auto"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Main Content Layout: Sidebar + Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-2">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24">
          <GpuFiltersPanel
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            availableModels={availableModels}
            availableLocations={availableLocations}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        {/* Right Listings Section */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          {/* Results Count Header */}
          {!isLoading && !error && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
              <span className="font-semibold text-foreground">
                {filteredAndSortedGpus.length}{" "}
                {filteredAndSortedGpus.length === 1 ? "GPU" : "GPUs"} available
              </span>
            </div>
          )}

          {/* State 1: Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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

          {/* State 4: Active GPU Grid */}
          {!isLoading && !error && filteredAndSortedGpus.length > 0 && (
            <GpuGrid gpus={filteredAndSortedGpus} />
          )}
        </section>
      </div>

      {/* Mobile Filter Drawer / Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Filter GPUs</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setIsMobileFiltersOpen(false)}
                aria-label="Close filter options"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <GpuFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              availableModels={availableModels}
              availableLocations={availableLocations}
              hasActiveFilters={hasActiveFilters}
              className="border-0 p-0 bg-transparent shadow-none"
            />

            <div className="mt-6 pt-4 border-t border-border flex gap-3">
              {hasActiveFilters && (
                <Button
                  variant="tertiary"
                  onPress={handleResetFilters}
                  className="flex-1 font-semibold"
                >
                  Reset
                </Button>
              )}
              <Button
                variant="primary"
                onPress={() => setIsMobileFiltersOpen(false)}
                className="flex-1 font-semibold"
              >
                Show Results
              </Button>
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
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-10 py-8">
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
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Loading GPU Marketplace...</p>
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
