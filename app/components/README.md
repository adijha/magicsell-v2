# Components

This folder contains reusable React components used across the application.

## Structure

```
components/
├── ui/              # Basic UI components (buttons, inputs, cards, etc.)
├── layout/          # Layout components (headers, footers, navigation)
├── forms/           # Form-related components
└── [feature]/       # Feature-specific components
```

## Naming Convention

- Use PascalCase for component files: `ProductCard.tsx`
- Use kebab-case for style files: `product-card.module.css`
- Export components as named exports

## Example

```tsx
// components/ui/Button.tsx
export function Button({ children, onClick, variant = "primary" }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```
