# Constants

This folder contains application-wide constants and configuration values.

## Structure

```
constants/
├── index.ts         # Re-export all constants
├── api.ts           # API endpoints and configs
├── app.ts           # App-level constants
└── [feature].ts     # Feature-specific constants
```

## Best Practices

- Use UPPER_SNAKE_CASE for constants
- Group related constants together
- Export from index.ts for easy imports
- Never store secrets here (use environment variables)

## Example

```typescript
// constants/api.ts
export const API_VERSION = "2024-01";
export const API_TIMEOUT = 30000;
export const MAX_RETRIES = 3;

export const ENDPOINTS = {
  PRODUCTS: "/api/products",
  ORDERS: "/api/orders",
  CUSTOMERS: "/api/customers",
} as const;

// constants/app.ts
export const APP_NAME = "MagicSell";
export const ITEMS_PER_PAGE = 20;
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

export const PRODUCT_STATUSES = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
} as const;

// constants/index.ts
export * from "./api";
export * from "./app";
```
