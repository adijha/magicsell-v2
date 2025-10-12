/**
 * Types for theme extension management
 */

export interface ThemeExtensionStatus {
  configured: boolean;
  uid?: string;
  deepLink?: string;
}

export interface ThemeInfo {
  id: string;
  name: string;
  role: "main" | "unpublished";
}
