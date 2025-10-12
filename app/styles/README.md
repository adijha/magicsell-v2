# Styles

This folder contains global styles, theme configurations, and shared CSS modules.

## Structure

```
styles/
├── global.css       # Global styles
├── variables.css    # CSS variables (colors, spacing, etc.)
├── mixins.css       # Reusable CSS mixins
└── themes/          # Theme-specific styles
```

## Best Practices

- Use CSS modules for component-specific styles
- Keep global styles minimal
- Use CSS variables for theming
- Follow Shopify Polaris design system when possible

## Example

```css
/* styles/variables.css */
:root {
  /* Colors */
  --color-primary: #008060;
  --color-secondary: #303030;
  --color-success: #50b83c;
  --color-warning: #ffc453;
  --color-error: #d72c0d;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
}

/* styles/global.css */
* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  line-height: 1.5;
}
```
