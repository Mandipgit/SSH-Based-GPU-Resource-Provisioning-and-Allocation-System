import { MarketplaceGPU } from "./gpu";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "host" | "renter";
  createdAt: string;
  updatedAt: string;
}

export type GPU = MarketplaceGPU;

export * from "./gpu";
export * from "./session";
export * from "./wallet";
export * from "./user";



