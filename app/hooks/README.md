# Hooks

This folder contains custom React hooks for reusable logic.

## Structure

```
hooks/
├── useProducts.ts       # Product-related hooks
├── useAuth.ts           # Authentication hooks
├── useToast.ts          # Toast notification hook
└── [feature].ts         # Feature-specific hooks
```

## Naming Convention

- Prefix all hooks with "use"
- Use camelCase: `useProductData`, `useFormValidation`

## Best Practices

- Keep hooks focused on a single responsibility
- Return consistent data structures
- Handle loading and error states
- Document hook parameters and return values

## Example

```typescript
// hooks/useProducts.ts
import { useState, useEffect } from "react";
import type { Product } from "~/types";
import { fetchProducts } from "~/services/api/products";

export function useProducts(shopDomain: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await fetchProducts(shopDomain);
        setProducts(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [shopDomain]);

  return { products, loading, error };
}
```
