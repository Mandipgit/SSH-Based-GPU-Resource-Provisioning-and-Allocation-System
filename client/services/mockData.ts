import { Session, GPU } from "@/types";

export interface WalletData {
  balance: number;
  currency: string;
}

export const mockWalletData: WalletData = {
  balance: 2450.00,
  currency: "NPR"
};

export const mockSessions: Session[] = [
  {
    id: "sess-8492f1a",
    renterId: "user-1",
    hostId: "host-101",
    gpuId: "gpu-1",
    gpuName: "NVIDIA RTX 4090",
    gpuModel: "NVIDIA RTX 4090",
    vram: 24,
    pricePerHour: 180,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
    endTime: null,
    status: "active",
    connectionStatus: "ready",
    sshHost: "relay.labhya.io",
    sshPort: 22045,
    sshUser: "renter",
    gpuUtilization: 74,
    totalCost: 405.00
  },
  {
    id: "sess-7182e3b",
    renterId: "user-1",
    hostId: "host-102",
    gpuId: "gpu-2",
    gpuName: "NVIDIA RTX 3090",
    gpuModel: "NVIDIA RTX 3090",
    vram: 24,
    pricePerHour: 120,
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    connectionStatus: "disconnected",
    sshHost: "relay.labhya.io",
    sshPort: 22018,
    sshUser: "renter",
    totalCost: 240.00
  },
  {
    id: "sess-5910c9d",
    renterId: "user-1",
    hostId: "host-104",
    gpuId: "gpu-4",
    gpuName: "NVIDIA RTX A6000",
    gpuModel: "NVIDIA RTX A6000",
    vram: 48,
    pricePerHour: 260,
    startTime: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    connectionStatus: "disconnected",
    sshHost: "relay.labhya.io",
    sshPort: 22031,
    sshUser: "renter",
    totalCost: 780.00
  },
  {
    id: "sess-3209a8f",
    renterId: "user-1",
    hostId: "host-103",
    gpuId: "gpu-3",
    gpuName: "NVIDIA RTX 4080",
    gpuModel: "NVIDIA RTX 4080",
    vram: 16,
    pricePerHour: 140,
    startTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    connectionStatus: "disconnected",
    sshHost: "relay.labhya.io",
    sshPort: 22012,
    sshUser: "renter",
    totalCost: 140.00
  }
];

export const mockGpuList: GPU[] = [
  {
    id: "gpu-1",
    hostId: "host-101",
    name: "NVIDIA RTX 4090",
    model: "NVIDIA RTX 4090",
    vram: 24,
    pricePerHour: 180,
    status: "available",
    availability: "available",
    location: "Kathmandu",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-2",
    hostId: "host-102",
    name: "NVIDIA RTX 3090",
    model: "NVIDIA RTX 3090",
    vram: 24,
    pricePerHour: 120,
    status: "available",
    availability: "available",
    location: "Pokhara",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-3",
    hostId: "host-103",
    name: "NVIDIA RTX 4080",
    model: "NVIDIA RTX 4080",
    vram: 16,
    pricePerHour: 140,
    status: "available",
    availability: "available",
    location: "Kathmandu",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-4",
    hostId: "host-104",
    name: "NVIDIA RTX A6000",
    model: "NVIDIA RTX A6000",
    vram: 48,
    pricePerHour: 260,
    status: "available",
    availability: "available",
    location: "Lalitpur",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-5",
    hostId: "host-105",
    name: "NVIDIA A100",
    model: "NVIDIA A100",
    vram: 80,
    pricePerHour: 480,
    status: "available",
    availability: "available",
    location: "Kathmandu",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-6",
    hostId: "host-106",
    name: "NVIDIA RTX 3080",
    model: "NVIDIA RTX 3080",
    vram: 10,
    pricePerHour: 75,
    status: "available",
    availability: "available",
    location: "Pokhara",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-7",
    hostId: "host-107",
    name: "NVIDIA H100",
    model: "NVIDIA H100",
    vram: 80,
    pricePerHour: 850,
    status: "rented",
    availability: "busy",
    location: "Kathmandu",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-8",
    hostId: "host-108",
    name: "NVIDIA RTX 4070 Ti",
    model: "NVIDIA RTX 4070 Ti",
    vram: 12,
    pricePerHour: 95,
    status: "available",
    availability: "available",
    location: "Biratnagar",
    createdAt: new Date().toISOString()
  },
  {
    id: "gpu-9",
    hostId: "host-109",
    name: "NVIDIA RTX 4090",
    model: "NVIDIA RTX 4090",
    vram: 24,
    pricePerHour: 175,
    status: "available",
    availability: "available",
    location: "Lalitpur",
    createdAt: new Date().toISOString()
  }
];

// Helper to simulate network delay for mock endpoints
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
