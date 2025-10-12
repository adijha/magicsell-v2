# Utils

This folder contains utility functions and helper methods used throughout the application.

## Structure

```
utils/
├── formatters.ts    # Data formatting functions
├── validators.ts    # Validation functions
├── helpers.ts       # General helper functions
└── [domain].ts      # Domain-specific utilities
```

## Best Practices

- Keep functions pure and side-effect free
- Write unit tests for utilities
- Document complex logic

## Example

```typescript
// utils/formatters.ts
export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US").format(date);
}
```
