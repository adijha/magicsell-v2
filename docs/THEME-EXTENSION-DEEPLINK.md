# Theme Extension Deeplink Setup

This guide explains how to set up and use the theme extension deeplink feature that allows merchants to enable your app's theme extension directly from the app UI.

## Overview

The deeplink feature creates a direct link to the Shopify theme editor with your app's extension pre-selected. This makes it easy for merchants to enable your extension without manually searching for it.

## How It Works

```
App UI → Deeplink Button → Theme Editor (with extension pre-selected)
```

### Deeplink URL Formats

**For App Embeds:**
```
https://{shop}/admin/themes/current/editor?context=apps&activateAppId={api_key}/{app_embed_handle}
```

**For App Blocks:**
```
https://{shop}/admin/themes/current/editor?template=product&addAppBlockId={api_key}/{block_handle}&target=mainSection
```

**Parameters:**
- `{shop}` = Store domain (e.g., "my-store.myshopify.com")
- `{api_key}` = Your app's API key (SHOPIFY_API_KEY)
- `{app_embed_handle}` = Filename of app-embed.liquid **without .liquid extension** (e.g., "app-embed")
- `{block_handle}` = Filename of block's liquid file **without .liquid extension** (e.g., "star_rating")

## Understanding Your Extension Structure

Your theme extension has two types of blocks:

### App Embed Block (`app-embed.liquid`)
- Appears in "App embeds" section of theme editor
- Gets enabled globally across all pages
- Handle: `app-embed` (the filename without .liquid)

### App Blocks (e.g., `star_rating.liquid`)
- Can be added to specific templates (product, collection, etc.)
- Added via theme editor to specific sections
- Handle: `star_rating` (the filename without .liquid)

```
extensions/magic-theme-extension/
├── blocks/
│   ├── app-embed.liquid    → handle: "app-embed"
│   └── star_rating.liquid  → handle: "star_rating"
```

## Configuration

### Required Environment Variable

You only need your app's API key, which should already be set:

```bash
SHOPIFY_API_KEY=your-app-client-id
```

This is automatically set by Shopify CLI during development and should be configured on your production server.

**Important:** The block handles are derived from your liquid filenames, not from extension UIDs. You do not need `THEME_EXTENSION_UID` for deeplinks.

## Using the Feature

### In the App UI

1. Navigate to `/app/setup` in your app
2. Click "Auto-Enable in Theme Editor" button
3. Theme editor opens with your extension pre-selected
4. Merchant toggles the extension ON and saves
5. Return to app and click "Check Status" to verify

### Programmatic Usage

```typescript
import {
  generateThemeEditorDeepLink,
  generateAddAppBlockDeepLink,
  generateStarRatingBlockUrl,
} from "~/services/theme-extension.server";

// In your loader or action
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Enable app-embed block (app embeds section)
  const appEmbedLink = generateThemeEditorDeepLink({
    shop: session.shop,
    blockHandle: "app-embed", // defaults to "app-embed"
  });

  // Add star_rating block to product pages
  const starRatingLink = generateAddAppBlockDeepLink({
    shop: session.shop,
    template: "product",
    blockHandle: "star_rating",
    target: "mainSection",
  });

  // Or use the helper
  const quickStarRatingLink = generateStarRatingBlockUrl(session.shop);

  return { appEmbedLink, starRatingLink };
};
```

### In Components

```tsx
import { ThemeExtensionSetup } from "~/components/ThemeExtensionSetup";

<ThemeExtensionSetup
  shop={shop}
  clientId={clientId} // Your app's API key
/>
```

## API Reference

### `generateThemeEditorDeepLink(params)`

Generates a deeplink to enable an app embed in the theme editor.

**Parameters:**
- `shop` (string, required): Store domain (e.g., "my-store.myshopify.com")
- `blockHandle` (string, optional): Block filename without .liquid (default: "app-embed")
- `themeId` (string, optional): Theme ID or "current" (default: "current")

**Returns:** Full theme editor URL with activateAppId parameter

**Example:**
```typescript
const url = generateThemeEditorDeepLink({
  shop: "my-store.myshopify.com",
  blockHandle: "app-embed",
});
// https://my-store.myshopify.com/admin/themes/current/editor?context=apps&activateAppId={clientId}/app-embed
```

### `generateAddAppBlockDeepLink(params)`

Generates a deeplink that prompts the merchant to add your app block to a specific template.

**Parameters:**
- `shop` (string, required): Store domain
- `template` (string, required): Template to open (e.g., "product", "collection")
- `blockHandle` (string, required): Block filename without .liquid (e.g., "star_rating")
- `target` (string, optional): Target section (default: "mainSection")
- `themeId` (string, optional): Theme ID or "current" (default: "current")

**Returns:** Full theme editor URL with addAppBlockId parameter

**Example:**
```typescript
const url = generateAddAppBlockDeepLink({
  shop: "my-store.myshopify.com",
  template: "product",
  blockHandle: "star_rating",
  target: "mainSection",
});
// https://my-store.myshopify.com/admin/themes/current/editor?template=product&addAppBlockId={clientId}/star_rating&target=mainSection
```

### `generateStarRatingBlockUrl(shop)`

Helper function to generate a deeplink for adding the star_rating block to product pages.

**Parameters:**
- `shop` (string, required): Store domain

**Returns:** Full theme editor URL

## Testing the Feature

### Local Testing

1. Start the app:
```bash
npm run dev
```

2. Navigate to `/app/setup` in the app

3. Click "Auto-Enable in Theme Editor"

4. Verify it opens the theme editor with your extension pre-selected in the App embeds section

5. Toggle the extension ON and click Save

6. Return to app and click "Check Status" to verify it's enabled

### Testing in Development Store

1. Deploy to staging:
```bash
shopify app deploy --config shopify.app.staging.toml
```

2. Install staging app in a development store

3. Open the app in the store admin

4. Navigate to Setup page

5. Click "Auto-Enable in Theme Editor"

6. Theme editor should open with extension pre-selected

## Troubleshooting

### Deeplink Opens But Extension Not Pre-Selected

**Possible causes:**
1. **Wrong block handle**: Verify the handle matches your liquid filename
2. **Extension not deployed**: Deploy the extension first
3. **Old browser cache**: Clear cache and try again

**Solution:**
```bash
# Verify your extension blocks
ls extensions/magic-theme-extension/blocks/

# Output should show:
# app-embed.liquid    → handle: "app-embed"
# star_rating.liquid  → handle: "star_rating"
```

### "App does not exist" Error

**Cause:** Using extension UID instead of block handle

**Solution:**
Use the block handle (filename without .liquid) instead of the extension UID:
- ✅ Correct: `activateAppId={clientId}/app-embed`
- ❌ Wrong: `activateAppId={clientId}/{extensionUid}`

### Deeplink Opens Wrong Store

**Cause:** Using wrong shop domain

**Solution:**
Ensure you're using the session shop domain:
```typescript
const { session } = await authenticate.admin(request);
const deepLink = generateThemeEditorDeepLink({
  shop: session.shop, // Always use session.shop
  blockHandle: "app-embed",
});
```

## Advanced Usage

### Open Specific Template

```typescript
// Product page with extension pre-selected
generateThemeEditorDeepLink({
  shop: session.shop,
  blockHandle: "app-embed",
});

// Note: App embeds are global, so template parameter is not needed
```

### Add Block to Specific Template

```typescript
// Add star_rating to product pages
generateAddAppBlockDeepLink({
  shop: session.shop,
  template: "product",
  blockHandle: "star_rating",
  target: "mainSection",
});

// Add to collection pages
generateAddAppBlockDeepLink({
  shop: session.shop,
  template: "collection",
  blockHandle: "star_rating",
  target: "mainSection",
});
```

### Open Specific Theme

```typescript
// Get theme ID from GraphQL
const response = await admin.graphql(`
  query {
    themes(first: 1, query: "role:main") {
      nodes {
        id
      }
    }
  }
`);

const themeId = response.data.themes.nodes[0].id;

// Generate deeplink for specific theme
generateThemeEditorDeepLink({
  shop: session.shop,
  themeId: themeId.replace('gid://shopify/Theme/', ''),
  blockHandle: "app-embed",
});
```

## Best Practices

1. **Always use block handles** (filenames without .liquid) in deeplinks
   ```typescript
   // ✅ Correct
   const url = generateThemeEditorDeepLink({
     shop: session.shop,
     blockHandle: "app-embed",
   });

   // ❌ Wrong
   const url = generateThemeEditorDeepLink({
     shop: session.shop,
     extensionUid: "2b7313e8-xxx", // Don't use extension UID
   });
   ```

2. **Open deeplinks in the same tab** (Shopify admin handles navigation)
   ```typescript
   window.location.href = deepLink;
   ```

3. **Provide clear instructions** to merchants
   ```tsx
   <s-banner status="info">
     <s-text>Click "Enable Now" to open the theme editor.
     Toggle the app embed ON and click Save to enable it.</s-text>
   </s-banner>
   ```

4. **Check extension status** after enabling
   ```typescript
   // Use GraphQL to verify extension is enabled
   const response = await admin.graphql(`
     query {
       app {
         installation {
           activeSubscriptions {
             status
           }
         }
       }
     }
   `);
   ```

## Key Differences from Old Approach

### Old Approach (Wrong)
- ❌ Required `THEME_EXTENSION_UID` environment variable
- ❌ Used extension UUID in deeplink
- ❌ Extension UID changes with each deployment
- ❌ Format: `activateAppId={clientId}/{extensionUid}`

### New Approach (Correct)
- ✅ Only requires `SHOPIFY_API_KEY` (already configured)
- ✅ Uses block handle (filename without .liquid)
- ✅ Block handle is stable (based on filename)
- ✅ Format: `activateAppId={clientId}/app-embed`

## Files Reference

```
app/
├── services/
│   └── theme-extension.server.ts    # Deeplink generation service
├── components/
│   └── ThemeExtensionSetup.tsx      # Setup UI component
├── routes/
│   ├── app.setup.tsx                # Setup page
│   └── app.setup.check-status.ts    # Status checking API
└── types/
    └── theme-extension.ts           # TypeScript types
```

## Resources

- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Shopify Deep Linking Guide](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#deep-linking)
- [Extension Management Guide](./EXTENSIONS.md)
- [Deployment Guide](./DEPLOYMENT.md)
