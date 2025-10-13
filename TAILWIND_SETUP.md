# Tailwind CSS v4 Setup

Tailwind CSS v4 has been successfully installed and configured in this project.

## What's Installed

- **tailwindcss**: ^4.0.0
- **@tailwindcss/vite**: ^4.0.0

## Configuration

### 1. Vite Configuration (`vite.config.ts`)

Added Tailwind Vite plugin:

```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    reactRouter(),
    tailwindcss(), // ✅ Tailwind v4 plugin
    tsconfigPaths(),
  ],
});
```

### 2. Main CSS File (`app/app.css`)

Created with Tailwind v4 import syntax:

```css
/* Tailwind CSS v4 */
@import "tailwindcss";
```

### 3. Root Component (`app/root.tsx`)

Imported the CSS file:

```typescript
import "./app.css";
```

## Key Differences from Tailwind v3

### 1. CSS-First Configuration

Tailwind v4 uses **CSS-first configuration** instead of JavaScript config files:

**v3 (Old):**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

**v4 (New):**
```css
/* app/app.css */
@import "tailwindcss";

@theme {
  --font-display: "Inter", sans-serif;
  --color-primary: #3b82f6;
}
```

### 2. Import Syntax

**v3 (Old):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v4 (New):**
```css
@import "tailwindcss";
```

### 3. Theme Customization

Customize your theme directly in CSS using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  /* Fonts */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;

  /* Breakpoints */
  --breakpoint-tablet: 640px;
  --breakpoint-laptop: 1024px;
  --breakpoint-desktop: 1280px;
}
```

### 4. Using Custom Values

Reference your custom theme values:

```tsx
// Using custom colors
<div className="bg-primary-500 text-primary-50">
  Hello World
</div>

// Using custom spacing
<div className="p-md m-lg">
  Content
</div>
```

## Usage Examples

### Basic Example

```tsx
export default function MyComponent() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900">
        Hello Tailwind v4
      </h1>
      <p className="mt-4 text-gray-600">
        This is styled with Tailwind CSS v4
      </p>
      <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Click me
      </button>
    </div>
  );
}
```

### With Custom Theme

```css
/* app/app.css */
@import "tailwindcss";

@theme {
  --color-brand: #ff6b6b;
  --color-accent: #4ecdc4;
}
```

```tsx
<div className="bg-brand text-white p-4">
  Using custom brand color
</div>
```

### Responsive Design

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive width
</div>
```

### Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Supports dark mode
</div>
```

## Advanced Configuration

### Custom Plugins

Create custom utilities in your CSS:

```css
@import "tailwindcss";

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### Component Classes

```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg;
    @apply hover:bg-blue-600 transition-colors;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

Use in components:

```tsx
<button className="btn-primary">Click me</button>
<div className="card">Card content</div>
```

## TypeScript Support

Tailwind v4 has built-in TypeScript support. No additional configuration needed!

## IDE Setup

### VS Code

Install the official extension:
- **Tailwind CSS IntelliSense** by Tailwind Labs

Features:
- ✅ Autocomplete for class names
- ✅ Linting
- ✅ Hover previews
- ✅ Syntax highlighting

### Configuration (`.vscode/settings.json`)

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

## Testing Tailwind

### Quick Test Component

Create a test route to verify Tailwind is working:

```tsx
// app/routes/test-tailwind.tsx
export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tailwind v4 Works! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          All utility classes are working perfectly.
        </p>
        <div className="flex gap-4">
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Primary
          </button>
          <button className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors">
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}
```

Visit: `http://localhost:3000/test-tailwind`

## Build and Development

### Development Mode

```bash
npm run dev
```

Tailwind will automatically:
- ✅ Watch for class changes
- ✅ Generate only used styles
- ✅ Hot reload CSS changes

### Production Build

```bash
npm run build
```

Tailwind will:
- ✅ Purge unused styles
- ✅ Minify CSS
- ✅ Optimize for production

## Performance

Tailwind v4 improvements:
- ⚡️ **10x faster** build times
- 📦 **Smaller bundle** sizes
- 🔥 **Instant HMR** (Hot Module Replacement)
- 🎯 **Better tree-shaking**

## Migration from v3

If you have existing Tailwind v3 code:

1. **Classes remain the same** - No breaking changes to utility classes
2. **Update config** - Move JS config to CSS `@theme` directive
3. **Update imports** - Change `@tailwind` to `@import "tailwindcss"`
4. **Test thoroughly** - Some edge cases may behave differently

## Resources

- [Tailwind v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind v4 Release Notes](https://tailwindcss.com/blog/tailwindcss-v4)
- [Vite Plugin Docs](https://github.com/tailwindlabs/tailwindcss-vite)
- [CSS-First Configuration](https://tailwindcss.com/docs/configuration)

## Troubleshooting

### Styles not applying?

1. **Check import order**:
   ```typescript
   import "./app.css"; // Must be imported in root.tsx
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Clear cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### IntelliSense not working?

1. Install **Tailwind CSS IntelliSense** extension
2. Reload VS Code window
3. Check `tailwind.config.js` is not present (v4 doesn't use it)

### Build errors?

Check that `@tailwindcss/vite` plugin is properly configured in `vite.config.ts`

## Summary

✅ Tailwind CSS v4 installed
✅ Vite plugin configured
✅ Main CSS file created
✅ Imported in root component
✅ Ready to use!

Start using Tailwind classes in your components immediately!
