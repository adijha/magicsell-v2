# Extension Management Across Environments

Understanding how Shopify extensions work across different app configurations (staging, production, etc.).

## How Extension UIDs Work

### Key Concept: Extension UIDs Are App-Specific

Each Shopify app gets its own unique extension UIDs, even if the extension code is identical.

```
┌─────────────────────────────────────────┐
│  Your Extension Code                    │
│  extensions/magic-theme-extension/      │
└─────────────────────────────────────────┘
              │
              ├─────────────────────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  Staging App    │          │  Production App │
     │                 │          │                 │
     │  Extension UID: │          │  Extension UID: │
     │  abc-123-xxx    │          │  def-456-yyy    │
     └─────────────────┘          └─────────────────┘
```

### Example from Your Deployment

When you deployed to staging, you saw:

```
Extensions:
+ magic-theme-extension (uid: 2b7313e8-6e4b-bbe6-cd71-124e8ddaedee713c6c53) (new)
```

This UID (`2b7313e8-...`) belongs to the **staging app** only.

When you deploy the same extension to production, it will get a **different UID**.

## Workflow for Extension Development

### 1. Develop Locally

```bash
# Start development with default (or staging) config
npm run dev
```

Changes to extension code are hot-reloaded in your dev store.

### 2. Deploy to Staging

```bash
shopify app deploy --config shopify.app.staging.toml
```

**First deployment:**
```
Extensions:
+ magic-theme-extension (uid: abc-123) (new)
```

**Subsequent deployments:**
```
Extensions:
• magic-theme-extension (uid: abc-123) (update)
```

### 3. Test in Staging Stores

Install the staging app in test stores:
1. Go to Partner Dashboard → Apps → magicsell staging
2. Click "Select store" → Choose your test stores
3. Install the app
4. Test the extension in theme customizer

### 4. Deploy to Production

Once tested and verified:

```bash
shopify app deploy --config shopify.app.production.toml
```

**First time deploying this extension to production:**
```
Extensions:
+ magic-theme-extension (uid: def-456) (new)
```

Note: Different UID than staging!

## Multiple Extension Types

You can have multiple types of extensions in your app:

```
extensions/
├── magic-theme-extension/     # Theme app extension
├── discount-function/          # Discount function
└── checkout-ui-extension/      # Checkout UI extension
```

Each extension type gets its own UID per app:

### Staging App
- Theme Extension: `uid-staging-theme-1`
- Discount Function: `uid-staging-discount-1`
- Checkout Extension: `uid-staging-checkout-1`

### Production App
- Theme Extension: `uid-prod-theme-2`
- Discount Function: `uid-prod-discount-2`
- Checkout Extension: `uid-prod-checkout-2`

## Common Questions

### Q: Do I need to create separate extension folders for staging vs production?

**A: No!** Keep your extension code in one place. Shopify CLI handles the deployment to different apps.

```
✅ CORRECT:
extensions/
└── magic-theme-extension/  ← One extension folder

❌ WRONG:
extensions/
├── magic-theme-extension-staging/
└── magic-theme-extension-production/
```

### Q: What if I make changes to an extension?

**A: Test in staging first, then deploy to production.**

1. Make changes to extension code
2. Deploy to staging: `shopify app deploy --config shopify.app.staging.toml`
3. Test in staging stores
4. Deploy to production: `shopify app deploy --config shopify.app.production.toml`

### Q: Can I deploy only specific extensions?

**A: Yes, but it's not recommended.**

Shopify CLI allows selective deployment, but it's easier to deploy everything together to keep versions in sync.

### Q: What happens to existing installations when I deploy a new version?

**A: Updates are automatic.**

When you deploy a new version:
- Stores that have your app installed get the update automatically
- No need to reinstall the app
- Changes appear in theme customizer immediately

**Exception:** If you change app scopes, stores must reinstall the app.

### Q: Can I roll back an extension?

**A: Yes, through Partner Dashboard.**

1. Go to Partner Dashboard → Apps → Your App
2. Navigate to Extensions → Your Extension
3. View version history
4. Select a previous version to make it active

## Extension Configuration

### Theme App Extension

Location: `extensions/magic-theme-extension/shopify.extension.toml`

```toml
api_version = "2024-04"
name = "Magic Theme Extension"
type = "theme"

[[extensions.blocks]]
type = "star_rating"
name = "Star Rating"
```

**Important:** This config is the same for all environments. The UID is assigned during deployment.

### Discount Function

Location: `extensions/discount-function/shopify.extension.toml`

```toml
api_version = "2024-04"
name = "Volume Discount"
type = "function"

[build]
command = "npm run build"
path = "dist/index.wasm"
```

## Testing Extensions in Multiple Stores

### Strategy 1: Single Staging App, Multiple Stores (Recommended)

1. Deploy to staging once:
   ```bash
   shopify app deploy --config shopify.app.staging.toml
   ```

2. Install in multiple test stores:
   - Partner Dashboard → magicsell staging → Select store
   - Install in Store A, Store B, Store C

3. Test extension in all stores

**Benefits:**
- One deployment updates all stores
- Consistent behavior across test stores
- Easy to iterate

### Strategy 2: Store-Specific Apps (For Advanced Testing)

Create separate apps for specific stores:

```bash
# Create app for Store A
shopify app config link
# Name: "magicsell - Store A"
# Config: "store-a"

# Deploy
shopify app deploy --config shopify.app.store-a.toml
```

**Use when:**
- Testing different extension configurations
- Need completely isolated test environments
- Testing migration scenarios

## Troubleshooting

### Extension Not Showing in Theme Customizer

**Solution:**

1. Verify extension deployed:
   ```bash
   shopify app info --config shopify.app.staging.toml
   ```

2. Check extension is active in Partner Dashboard

3. Reinstall app in store (if needed)

4. Clear browser cache

5. Try different theme (some themes have compatibility issues)

### Extension Shows Old Version

**Solution:**

1. Deploy new version:
   ```bash
   shopify app deploy --config shopify.app.staging.toml
   ```

2. Refresh theme customizer

3. If still old, uninstall and reinstall app

### Different Behavior in Staging vs Production

**Possible causes:**

1. **Different extension versions**
   - Check when each was last deployed
   - Deploy same code to both environments

2. **Different store settings**
   - Theme differences
   - Store configuration differences

3. **Scope differences**
   - Verify scopes are identical in both TOML files

## Best Practices

### 1. Keep Extension Code in Version Control

```bash
git add extensions/magic-theme-extension/
git commit -m "Add star rating block"
```

### 2. Test Thoroughly in Staging

- Test on multiple themes (Dawn, Debut, etc.)
- Test with different store configurations
- Test all extension features

### 3. Version Your Extensions

Use semantic versioning in commit messages:

```bash
git commit -m "feat(extension): Add product recommendations v1.2.0"
```

### 4. Document Extension Features

Keep a changelog for extensions:

```markdown
## Theme Extension Changelog

### v1.2.0 - 2024-01-15
- Added star rating block
- Added product recommendation snippet

### v1.1.0 - 2024-01-10
- Added thumbs up asset
- Improved styling
```

### 5. Monitor Extension Performance

After deploying to production:
- Check error logs in Partner Dashboard
- Monitor store performance
- Gather merchant feedback

## Quick Reference

```bash
# View extension info
shopify app info --config shopify.app.staging.toml

# Deploy to staging
shopify app deploy --config shopify.app.staging.toml

# Deploy to production
shopify app deploy --config shopify.app.production.toml

# Create new extension
shopify app generate extension

# Test extension locally
npm run dev
```

## Resources

- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Shopify Functions](https://shopify.dev/docs/api/functions)
- [Extension Configuration](https://shopify.dev/docs/apps/build/app-extensions/configure-app-extensions)
