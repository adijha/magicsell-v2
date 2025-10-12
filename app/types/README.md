# Types

This folder contains TypeScript type definitions and interfaces.

## Structure

```
types/
├── index.ts         # Re-export all types
├── product.ts       # Product-related types
├── customer.ts      # Customer-related types
├── order.ts         # Order-related types
└── [domain].ts      # Domain-specific types
```

## Best Practices

- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Export all types from index.ts
- Document complex types with JSDoc comments

## Example

```typescript
// types/product.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  sku?: string;
  inventory: number;
}

export type ProductStatus = "active" | "draft" | "archived";

// types/index.ts
export * from "./product";
export * from "./customer";
export * from "./order";
```
