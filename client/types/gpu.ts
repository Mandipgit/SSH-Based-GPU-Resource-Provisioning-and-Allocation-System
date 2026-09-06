export interface MarketplaceGPU {
  id: string | number;
  hostId: string | number;
  name: string;
  model: string;
  vram: number;
  pricePerHour: number;
  availability: "available" | "busy" | "offline" | string;
  status?: "available" | "rented" | "offline" | string;
  location: string;
  isRentable?: boolean;
  averageRating?: number | null;
  hostName?: string;
  hostUptime?: number;
  hostReliability?: number;
  cudaCores?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GpuFilters {
  search: string;
  models: string[];
  minVram: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  locations: string[];
  availableOnly: boolean;
}

export type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "vram-asc"
  | "vram-desc";

export function normalizeGpu(raw: Record<string, unknown> | null | undefined): MarketplaceGPU {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      hostId: "",
      name: "Unknown GPU",
      model: "Unknown GPU",
      vram: 0,
      pricePerHour: 0,
      availability: "offline",
      status: "offline",
      location: "Unknown",
    };
  }

  // Handle availability strictly matching backend boolean fields
  let isAvailable = true;
  if (typeof raw.is_available === "boolean") {
    isAvailable = raw.is_available;
  }
  let isRentable = isAvailable;
  if (typeof raw.is_rentable === "boolean") {
    isRentable = raw.is_rentable;
  }

  let availability = "offline";
  if (isRentable && isAvailable) {
    availability = "available";
  } else if (isAvailable && !isRentable) {
    availability = "busy";
  } else if (typeof raw.availability === "string") {
    availability = raw.availability;
  } else if (typeof raw.gpu_availability === "string") {
    availability = raw.gpu_availability.toLowerCase();
  } else if (typeof raw.status === "string") {
    availability = raw.status.toLowerCase();
  }

  const rawName = (raw.gpu_name || raw.name || raw.model) as string | undefined;
  const rawLocation = (raw.location || raw.gpu_location) as string | undefined;
  const rawId = (raw.id ?? "") as string | number;
  const rawHostId = (raw.host ?? raw.host_id ?? raw.hostId ?? "") as string | number;

  const rawMemory = raw.vram_gb ?? raw.vram_total ?? raw.gpu_memory ?? raw.vram ?? raw.memory ?? 0;
  const parsedMemory = typeof rawMemory === "string" ? parseInt(rawMemory, 10) : Number(rawMemory);

  const rawPrice = raw.price_per_hour ?? raw.gpu_price ?? raw.pricePerHour ?? raw.price ?? 0;
  const parsedPrice = typeof rawPrice === "string" ? parseFloat(rawPrice) : Number(rawPrice);

  return {
    id: rawId,
    hostId: rawHostId,
    name: rawName || "Unknown GPU",
    model: String(raw.model ?? rawName ?? "Unknown GPU"),
    vram: isNaN(parsedMemory) ? 0 : parsedMemory,
    pricePerHour: isNaN(parsedPrice) ? 0 : parsedPrice,
    availability,
    status: availability === "available" ? "available" : availability === "busy" ? "rented" : "offline",
    location: rawLocation || "Unknown",
    isRentable: isRentable && isAvailable,
    averageRating: typeof raw.average_rating === "number" ? raw.average_rating : null,
    hostName: (raw.host_name as string) || undefined,
    hostUptime: typeof raw.host_uptime === "number" ? raw.host_uptime : undefined,
    hostReliability: typeof raw.host_reliability === "number" ? raw.host_reliability : undefined,
    cudaCores: typeof raw.cuda_cores === "number" ? raw.cuda_cores : undefined,
  };
}

export function normalizeGpus(rawList: unknown): MarketplaceGPU[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item) => normalizeGpu(item as Record<string, unknown>));
}
