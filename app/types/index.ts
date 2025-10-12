/**
 * Central export for all TypeScript types and interfaces
 * Import types like: import type { Product, Customer } from "~/types"
 */

// Re-export types here as you create them
// export * from "./product";
// export * from "./customer";
// export * from "./order";

// Example placeholder type
export interface AppConfig {
  apiVersion: string;
  environment: "development" | "production" | "staging";
}
