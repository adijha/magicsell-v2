# Services

This folder contains service modules for API calls and external integrations.

## Structure

```
services/
├── api/             # API client and endpoints
├── shopify/         # Shopify API services
└── [integration]/   # Other third-party integrations
```

## Best Practices

- Use async/await for API calls
- Handle errors consistently
- Implement proper typing for requests/responses
- Use environment variables for API endpoints

## Example

```typescript
// services/api/products.ts
import type { Product } from "~/types";

export async function fetchProducts(shopDomain: string): Promise<Product[]> {
  const response = await fetch(`/api/products?shop=${shopDomain}`);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<Product> {
  const response = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
}
```
