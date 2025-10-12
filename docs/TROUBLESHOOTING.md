# Troubleshooting Guide

Common issues and solutions for MagicSell development.

## Theme Extension Not Showing in Theme Editor

### Symptoms
- Extension deployed successfully in Partner Dashboard
- App installed in store
- Extension shows in Partner Dashboard with UID
- **BUT** extension NOT appearing in Theme Editor's "App embeds" section

### Root Cause
When you install an app BEFORE deploying extensions, or deploy new extensions AFTER installation, Shopify doesn't automatically refresh the theme editor.

### Solution

#### Option 1: Reinstall the App (Recommended)

1. **Uninstall the app from the store:**
   ```
   Store Admin → Apps → magicsell staging → Delete
   ```

2. **Reinstall the app:**
   - Go to Partner Dashboard → Apps → magicsell staging
   - Click "Select store"
   - Choose your store
   - Click "Install app"

3. **Check theme editor:**
   - Go to Themes → Customize
   - Look in "App embeds" section
   - Your extension should now appear

#### Option 2: Use Development Store Reset

If you're using a development store, you can use the Shopify CLI to force a refresh:

```bash
# Uninstall the app via CLI
shopify app uninstall --config shopify.app.staging.toml

# Reinstall
shopify app install --config shopify.app.staging.toml
```

#### Option 3: Deploy with --reset Flag

```bash
# This will prompt you to select store and reinstall
shopify app deploy --reset --config shopify.app.staging.toml
```

### Verification Steps

After reinstalling:

1. Go to `https://your-store.myshopify.com/admin/themes/current/editor?context=apps`
2. Scroll down to "App embeds"
3. Look for "magic-theme-extension" or the name from your extension config
4. Toggle it ON
5. Save changes

---

## Extension Shows in Partner Dashboard But Not in Store

### Check Extension Status in Partner Dashboard

1. Go to Partner Dashboard → Apps → Your App
2. Click "Extensions" tab
3. Verify extension status is "Active"
4. Check that the extension is part of the latest version

### Verify Extension Configuration

Check `extensions/magic-theme-extension/shopify.extension.toml`:

```toml
api_version = "2024-04"
name = "Magic Theme Extension"  # This name appears in theme editor
type = "theme"

[[extensions.blocks]]
type = "star_rating"
name = "Star Rating"
```

The `name` field is what merchants will see in the theme editor.

---

## Extension UID Mismatch

### Symptoms
- Deeplink opens but says "App embed does not exist"
- UID in environment variables doesn't match Partner Dashboard

### Solution

1. **Get correct UID from Partner Dashboard:**
   - Partner Dashboard → Apps → Your App → Extensions
   - Copy the UID shown

2. **Or get from deployment output:**
   ```bash
   shopify app deploy --config shopify.app.staging.toml
   ```
   Look for:
   ```
   Extensions:
   + magic-theme-extension (uid: abc-123-xxx) (new)
   ```

3. **Update environment variable:**
   ```bash
   # In .env
   THEME_EXTENSION_UID=correct-uid-here
   ```

4. **Restart your app:**
   ```bash
   npm run dev
   ```

---

## Multiple Apps Installed (Old + New)

### Symptoms
- Both old production app and new staging app installed
- Confusion about which extensions belong to which app

### Solution

1. **Uninstall old app** (if not needed for testing):
   ```
   Store Admin → Apps → Old App → Delete
   ```

2. **Keep them separate** (if both needed):
   - Use different development stores for each app
   - Or carefully track which extensions belong to which app

3. **Name extensions clearly:**
   ```toml
   # In shopify.extension.toml
   name = "MagicSell (Staging)" # Makes it clear which app
   ```

---

## Extension Not Loading on Storefront

### Symptoms
- Extension enabled in theme editor
- Extension toggle is ON
- But not showing on storefront

### Troubleshooting Steps

1. **Check extension is actually enabled:**
   - Theme Editor → App embeds → Verify toggle is ON
   - Click "Save" explicitly

2. **Verify theme compatibility:**
   - Test on Dawn theme (Shopify's reference theme)
   - Some older themes may have compatibility issues

3. **Check browser console:**
   - Open storefront in incognito mode
   - Open Developer Tools → Console
   - Look for JavaScript errors

4. **Verify extension code:**
   - Check `extensions/magic-theme-extension/blocks/*.liquid` files
   - Ensure no syntax errors
   - Test with minimal code first

5. **Clear caches:**
   - Clear browser cache
   - Try incognito mode
   - Try different browser

---

## Database Migration Errors

### Error: "The table `main.Session` does not exist"

**Solution:**
```bash
npx prisma migrate dev
```

### Error: "Can't reach database server"

**Solution:**
```bash
# Check database is running
# For PostgreSQL:
pg_isready

# For SQLite (dev):
# Just run migrations
npx prisma migrate dev
```

---

## App Not Loading in Store Admin

### Error: "This app is not available"

**Possible causes:**
1. App URL not set correctly
2. Development tunnel not running
3. App not deployed

**Solution:**
```bash
# Check app is running
npm run dev

# Verify tunnel URL in output
# Should match the URL in shopify.app.toml
```

### Error: "Authentication failed"

**Solution:**
```bash
# Check environment variables
echo $SHOPIFY_API_KEY

# Should match client_id in shopify.app.*.toml
# If mismatch, update .env or use correct config file
```

---

## Scope Changes Not Reflected

### Symptoms
- Updated scopes in `shopify.app.toml`
- Deployed successfully
- But app still has old scopes

### Solution

**Scope changes require reinstallation:**

1. Update scopes in TOML file:
   ```toml
   [access_scopes]
   scopes = "read_products,write_products,read_orders"
   ```

2. Deploy:
   ```bash
   shopify app deploy --config shopify.app.staging.toml
   ```

3. **Reinstall the app** in all stores

---

## Webhook Not Received

### Troubleshooting Steps

1. **Verify webhook configuration:**
   ```toml
   [[webhooks.subscriptions]]
   topics = [ "orders/create" ]
   uri = "/webhooks/app/order/create"
   ```

2. **Check webhook endpoint exists:**
   - File should exist at `app/routes/webhooks.app.order.create.tsx`

3. **Test webhook manually:**
   ```bash
   shopify app webhook trigger --topic orders/create
   ```

4. **Check Partner Dashboard:**
   - Apps → Your App → API access → Webhooks
   - Verify subscriptions are registered

5. **Check application logs:**
   ```bash
   # In your app console
   # Look for incoming webhook requests
   ```

---

## Extension Deployment Failed

### Error: "Extension validation failed"

**Solution:**
1. Check `shopify.extension.toml` syntax
2. Ensure all required fields are present
3. Verify API version is valid

### Error: "Could not find extension"

**Solution:**
```bash
# Verify extension directory structure
tree extensions/

# Should be:
# extensions/
# └── magic-theme-extension/
#     ├── shopify.extension.toml
#     ├── blocks/
#     ├── snippets/
#     └── assets/
```

---

## CLI Version Issues

### Error: "Command not found" or unexpected behavior

**Solution:**
```bash
# Update Shopify CLI
npm install -g @shopify/cli@latest

# Verify version
shopify version

# Should be 3.x or higher
```

---

## Environment Variable Not Loading

### Symptoms
- Set environment variable but app doesn't see it
- Getting undefined when accessing process.env.THEME_EXTENSION_UID

### Solution

1. **Restart development server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Verify .env file location:**
   - Must be in project root
   - File must be named exactly `.env`

3. **Check .env syntax:**
   ```bash
   # Correct
   THEME_EXTENSION_UID=abc-123

   # Wrong (no spaces)
   THEME_EXTENSION_UID = abc-123
   ```

4. **Verify variable name:**
   ```typescript
   // In code
   process.env.THEME_EXTENSION_UID // Must match .env exactly
   ```

---

## Need More Help?

1. Check [Shopify Community Forums](https://community.shopify.com/)
2. Review [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
3. Check [Extension Documentation](EXTENSIONS.md)
4. Review [Deployment Guide](DEPLOYMENT.md)

---

## Common Quick Fixes

### "Try turning it off and on again"

Often works for:
- Restart development server
- Reinstall app in store
- Clear browser cache
- Close and reopen theme editor

### Nuclear Option (Development Only)

When all else fails:
```bash
# 1. Uninstall from store
# 2. Delete local database
rm prisma/dev.sqlite

# 3. Reset migrations
npx prisma migrate reset

# 4. Redeploy
shopify app deploy --reset --config shopify.app.staging.toml

# 5. Reinstall in store
```

⚠️ **WARNING:** This deletes all local data. Only use in development!
