# App Folder Structure

This document outlines the folder structure for the MagicSell Shopify app, following React Router v7 and Shopify best practices.

## Directory Overview

```
app/
├── routes/              # React Router v7 routes (file-based routing)
├── components/          # Reusable React components
│   ├── ui/             # Basic UI components (buttons, inputs, cards)
│   ├── layout/         # Layout components (header, footer, nav)
│   └── forms/          # Form-related components
├── hooks/              # Custom React hooks
├── services/           # API clients and external services
│   ├── api/           # Internal API services
│   └── shopify/       # Shopify-specific services
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── styles/             # Global styles and CSS modules
├── db.server.ts       # Database client (server-only)
├── shopify.server.ts  # Shopify configuration (server-only)
├── entry.server.tsx   # Server entry point
└── root.tsx           # Root layout component
```

## Import Aliases

Use the `~` alias to import from the app directory:

```typescript
import { Button } from "~/components/ui/Button";
import { formatPrice } from "~/utils/formatters";
import { apiClient } from "~/services/api/client";
import type { Product } from "~/types";
import { APP_NAME } from "~/constants";
```

## Folder Guidelines

### `/routes`
File-based routing following React Router v7 conventions:
- `app._index.tsx` - Main app page (requires authentication)
- `app.products.tsx` - Products page
- `api.products.ts` - API route for products

### `/components`
Reusable UI components organized by category:
- Keep components focused and composable
- Use TypeScript interfaces for props
- Co-locate styles with components using CSS modules

### `/hooks`
Custom React hooks for shared logic:
- Prefix all hooks with "use"
- Return consistent data structures (data, loading, error)
- Document hook parameters and return values

### `/services`
API clients and external service integrations:
- Centralize all API calls
- Handle errors consistently
- Use TypeScript for type safety

### `/utils`
Pure utility functions:
- No side effects
- Easy to test
- Well documented

### `/types`
TypeScript definitions:
- Export all types from index.ts
- Use interfaces for object shapes
- Document complex types

### `/constants`
Application-wide constants:
- Never store secrets (use env vars)
- Group related constants
- Export from index.ts

### `/styles`
Global styles and themes:
- Use CSS modules for component styles
- Define CSS variables for theming
- Follow Shopify Polaris guidelines

## Best Practices

1. **File Naming**
   - Components: PascalCase (`ProductCard.tsx`)
   - Utils/Services: camelCase (`formatters.ts`)
   - Types: camelCase (`product.ts`)
   - CSS Modules: kebab-case (`product-card.module.css`)

2. **Code Organization**
   - Group related functionality
   - Keep files focused and small
   - Use barrel exports (index.ts)

3. **Type Safety**
   - Define types for all data structures
   - Use TypeScript strict mode
   - Avoid `any` type

4. **Testing**
   - Write tests for utilities and hooks
   - Test components in isolation
   - Mock external services

5. **Documentation**
   - Document complex logic
   - Write meaningful comments
   - Keep READMEs up to date

## Example Usage

```typescript
// app/routes/app.products.tsx
import { useLoaderData } from "react-router";
import { Button } from "~/components/ui/Button";
import { useProducts } from "~/hooks/useProducts";
import { formatPrice } from "~/utils/formatters";
import type { Product } from "~/types";

export default function ProductsPage() {
  const { products, loading } = useProducts();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products</h1>
      {products.map((product: Product) => (
        <div key={product.id}>
          <h2>{product.title}</h2>
          <p>{formatPrice(product.price)}</p>
          <Button variant="primary">View Details</Button>
        </div>
      ))}
    </div>
  );
}
```
