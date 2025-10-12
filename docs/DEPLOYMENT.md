# Deployment Guide: Managing Staging and Production Environments

This guide explains how to manage multiple environments (staging, production, dev) for the MagicSell Shopify app.

## Overview

We use **separate Shopify app configurations** for different environments:
- **Production**: The live app on App Store (`api.magicsell.ai`)
- **Staging**: Testing environment before production
- **Development**: Local development with tunneling

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your Codebase                      │
│            (Single Git Repository)                  │
└─────────────────────────────────────────────────────┘
              │                │              │
              ▼                ▼              ▼
    ┌─────────────┐  ┌──────────────┐  ┌────────────┐
    │   Dev App   │  │ Staging App  │  │  Prod App  │
    │  (Local)    │  │ (Testing)    │  │   (Live)   │
    └─────────────┘  └──────────────┘  └────────────┘
```

## Setup Instructions

### 1. Current Configuration Files

You currently have:
- `shopify.app.toml` - Production configuration
- `shopify.web.toml` - Web frontend configuration

### 2. Create Staging Configuration

Run this command to create a new staging app configuration:

```bash
shopify app config link
```

When prompted:
1. **"Would you like to link this app to an existing Shopify app?"** → Choose **No** to create new app
2. **"What would you like to name your new app?"** → Enter `Upsell & Cross Sell MagicSell (Staging)`
3. **"What would you like to name the configuration file?"** → Enter `staging`

This creates `shopify.app.staging.toml`

### 3. Rename Current Production Config

To keep things organized, rename your current production config:

```bash
# Copy current config to production-specific file
cp shopify.app.toml shopify.app.production.toml

# The original shopify.app.toml will be used for development
```

### 4. Update .gitignore

Add to `.gitignore` to avoid committing sensitive configurations:

```gitignore
# Shopify app configurations (except template)
shopify.app.toml
shopify.app.*.toml
!shopify.app.template.toml
```

Keep a `shopify.app.template.toml` as a reference (with sensitive data removed).

## Configuration File Structure

### Production Config (`shopify.app.production.toml`)

```toml
client_id = "your-prod-client-id"
name = "Upsell & Cross Sell MagicSell"
application_url = "https://api.magicsell.ai/"
embedded = true
handle = "magicshift"

[build]
automatically_update_urls_on_dev = false  # IMPORTANT: Prevent accidental updates
include_config_on_deploy = true

[webhooks]
api_version = "2024-04"
# ... webhook configurations

[access_scopes]
scopes = "read_customers,read_orders,read_product_listings,read_publications,read_themes,write_customers,write_discounts,write_products"

[auth]
redirect_urls = [
  "https://api.magicsell.ai/auth/callback",
  "https://api.magicsell.ai/auth/shopify/callback",
  "https://api.magicsell.ai/api/auth/callback"
]
```

### Staging Config (`shopify.app.staging.toml`)

```toml
client_id = "your-staging-client-id"
name = "Upsell & Cross Sell MagicSell (Staging)"
application_url = "https://staging.magicsell.ai/"  # or different URL
embedded = true
handle = "magicshift-staging"

[build]
automatically_update_urls_on_dev = true  # Allow automatic updates in staging
include_config_on_deploy = true

[webhooks]
api_version = "2024-04"
# ... same webhook configurations as production

[access_scopes]
scopes = "read_customers,read_orders,read_product_listings,read_publications,read_themes,write_customers,write_discounts,write_products"

[auth]
redirect_urls = [
  "https://staging.magicsell.ai/auth/callback",
  "https://staging.magicsell.ai/auth/shopify/callback",
  "https://staging.magicsell.ai/api/auth/callback"
]
```

### Development Config (`shopify.app.toml` - default)

```toml
# Uses tunneling for local development
# automatically_update_urls_on_dev = true (default)
```

## Daily Workflow

### Development

```bash
# Start local development (uses default shopify.app.toml)
npm run dev

# Or specify development config explicitly
npm run dev -- --config shopify.app.toml
```

### Testing in Staging

```bash
# Deploy to staging app
shopify app deploy --config shopify.app.staging.toml

# Or set staging as default temporarily
shopify app config use staging
shopify app deploy
```

### Deploying to Production

```bash
# Review changes before deploying
shopify app deploy --config shopify.app.production.toml

# Confirm changes when prompted
# Then deploy your backend to api.magicsell.ai
```

## Testing Across Multiple Stores

### Option 1: Install in Different Stores (Recommended)

You can install the **same staging app** in multiple development stores:

1. Go to your Shopify Partner Dashboard
2. Navigate to your staging app
3. Click "Test your app" → Select different stores
4. Install on each test store

**Benefits:**
- Single app configuration
- Easy to manage
- Same app behavior across stores

### Option 2: Create Store-Specific Configs

For completely isolated testing:

```bash
# Create config for Store A
shopify app config link
# Name: "MagicSell - Test Store A"
# Config name: "store-a"

# Create config for Store B
shopify app config link
# Name: "MagicSell - Test Store B"
# Config name: "store-b"

# Deploy to specific store
shopify app deploy --config shopify.app.store-a.toml
```

## Switching Between Environments

### View Available Configurations

```bash
# List all configurations
ls shopify.app*.toml
```

### Set Default Configuration

```bash
# Switch to staging
shopify app config use staging

# Switch to production
shopify app config use production
```

### One-Time Override

```bash
# Use production config for this command only
shopify app deploy --config shopify.app.production.toml
```

## Testing Discount Functions & Extensions

### Deploy Extensions to Staging

```bash
# Extensions are deployed with the app
shopify app deploy --config shopify.app.staging.toml
```

### Test Extensions

1. Deploy to staging app
2. Install staging app in test store
3. In test store admin:
   - Go to **Discounts** → Create discount using your function
   - Go to **Themes** → Customize → Add your theme extension block

### Iterate Quickly

```bash
# Make changes to discount functions or extensions
# Deploy again to staging
shopify app deploy --config shopify.app.staging.toml

# Changes are reflected immediately in test stores
```

## Environment Variables

### Local Development (.env)

```bash
SHOPIFY_API_KEY=dev-app-client-id
DATABASE_URL=postgresql://localhost:5432/magicsell_dev
```

### Staging (.env.staging)

```bash
SHOPIFY_API_KEY=staging-app-client-id
DATABASE_URL=postgresql://staging-db-url/magicsell_staging
API_URL=https://staging.magicsell.ai
```

### Production (.env.production)

```bash
SHOPIFY_API_KEY=production-app-client-id
DATABASE_URL=postgresql://prod-db-url/magicsell
API_URL=https://api.magicsell.ai
```

## Backend Deployment

### Staging Backend

```bash
# Build
npm run build

# Deploy to staging server
# (Depends on your hosting - examples below)

# Example: Using Docker
docker build -t magicsell:staging .
docker push your-registry/magicsell:staging

# Deploy to staging.magicsell.ai
ssh staging.magicsell.ai "docker pull your-registry/magicsell:staging && docker-compose up -d"
```

### Production Backend

```bash
# Build production version
NODE_ENV=production npm run build

# Run tests
npm test

# Deploy to production server
docker build -t magicsell:latest .
docker push your-registry/magicsell:latest

# Deploy to api.magicsell.ai
ssh api.magicsell.ai "docker pull your-registry/magicsell:latest && docker-compose up -d"
```

## Migration Strategy: Old App → New App

Since you're gradually rebuilding the app:

### Phase 1: Build & Test (Current Phase)

1. Keep old production app running (`api.magicsell.ai`)
2. Build new features in this codebase
3. Test in staging environment
4. Test in multiple stores

### Phase 2: Parallel Run

1. Deploy new app to different URL (e.g., `api-v2.magicsell.ai`)
2. Run both apps in parallel
3. Install new app in a few customer stores (beta testing)
4. Compare performance and gather feedback

### Phase 3: Gradual Migration

1. Feature flag system to enable/disable features
2. Migrate customers store by store
3. Monitor errors and performance

### Phase 4: Full Cutover

1. Update production TOML to use new codebase
2. Deploy to `api.magicsell.ai`
3. Uninstall old app from all stores (coordinate with customers)
4. Decommission old infrastructure

## Troubleshooting

### Issue: Wrong app deployed

**Solution:**
```bash
# Check which config is default
cat .shopify-cli.yml

# Switch to correct config
shopify app config use production
```

### Issue: Extension not showing in store

**Solution:**
1. Verify extension deployed: Check Partner Dashboard → App → Extensions
2. Reinstall app in test store if needed
3. Check theme compatibility

### Issue: Webhook not received

**Solution:**
1. Verify webhook URL matches your deployed backend
2. Check webhook subscriptions in Partner Dashboard
3. Test webhook endpoint directly

### Issue: Need to test with old production data

**Solution:**
1. Create database dump from production
2. Restore to staging database
3. Anonymize customer data for GDPR compliance
4. Test with realistic data

## Best Practices

1. **Never develop directly on production**
   - Always use staging first
   - Test thoroughly before production deploy

2. **Keep configurations in sync**
   - When updating scopes/webhooks, update ALL configs
   - Use template file as reference

3. **Document changes**
   - Keep changelog of configuration changes
   - Note scope changes (requires reinstall)

4. **Test extension changes extensively**
   - Discount functions: Test all edge cases
   - Theme extensions: Test on multiple themes
   - Verify backward compatibility

5. **Monitor deployments**
   - Check logs after deployment
   - Monitor error rates
   - Test critical features manually

6. **Automate where possible**
   - CI/CD for staging deployments
   - Automated testing before production
   - Rollback plan ready

## Quick Reference Commands

```bash
# Create new config
shopify app config link

# List configs
ls shopify.app*.toml

# Switch default config
shopify app config use <config-name>

# Deploy to specific environment
shopify app deploy --config shopify.app.<env>.toml

# Dev with specific config
npm run dev -- --config shopify.app.<env>.toml

# View app info
shopify app info --config shopify.app.<env>.toml
```

## Need Help?

- [Shopify CLI App Documentation](https://shopify.dev/docs/apps/build/cli-for-apps)
- [Managing App Config Files](https://shopify.dev/docs/apps/build/cli-for-apps/manage-app-config-files)
- [App Configuration Reference](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration)
