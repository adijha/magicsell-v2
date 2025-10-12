# Multi-Environment Setup Guide

This project supports multiple environments (development, staging, production) using **native Shopify CLI commands** with separate configurations for each.

## Environment Files

- `.env` - Active environment (auto-generated, not committed to git)
- `.env.staging` - Staging app configuration
- `.env.production` - Production app configuration
- `.env.example` - Template for new environments

## Quick Start

### Development (Staging)

```bash
npm run dev:staging
# or
bun dev:staging
```

This will:
1. Copy `.env.staging` → `.env`
2. Run `shopify app dev --config shopify.app.staging.toml`

### Development (Production)

```bash
npm run dev:production
# or
bun dev:production
```

This will:
1. Copy `.env.production` → `.env`
2. Run `shopify app dev --config shopify.app.production.toml`

### Deployment

**Deploy to Staging:**
```bash
npm run deploy:staging
# or
bun deploy:staging
```

**Deploy to Production:**
```bash
npm run deploy:production
# or
bun deploy:production
```

## Pull Environment Variables from Shopify

Shopify CLI can automatically pull environment variables from your app configuration:

```bash
# Pull for staging
npm run env:pull:staging

# Pull for production
npm run env:pull:production
```

This uses the native `shopify app env pull` command to sync your environment variables.

## Setup New Environment

1. **Create a new Shopify app** in your Partner Dashboard

2. **Copy the example file:**
   ```bash
   cp .env.example .env.production
   ```

3. **Fill in your credentials:**
   - `SHOPIFY_API_KEY` - From Partner Dashboard
   - `SHOPIFY_API_SECRET` - From Partner Dashboard
   - `SHOPIFY_APP_URL` - Your app's URL
   - `THEME_EXTENSION_UID` - Generated after first deploy
   - `DATABASE_URL` - Your database connection string

4. **Create the Shopify config:**
   ```bash
   cp shopify.app.template.toml shopify.app.production.toml
   ```

5. **Update the config:**
   - Set `client_id` to your app's API key
   - Set `name` to your app name
   - Set `application_url` to your app URL

6. **Pull environment variables from Shopify:**
   ```bash
   npm run env:pull:production
   ```

   This will sync your local `.env.production` with the app configuration from Shopify Partners Dashboard.

7. **Deploy:**
   ```bash
   npm run deploy:production
   ```

## Environment Variables

### Required for all environments:

- `SHOPIFY_API_KEY` - Your Shopify app's API key
- `SHOPIFY_API_SECRET` - Your Shopify app's API secret
- `DATABASE_URL` - Database connection string
- `SHOPIFY_APP_URL` - Your app's public URL
- `NODE_ENV` - Environment name (development/staging/production)

### Optional:

- `THEME_EXTENSION_UID` - Theme extension unique ID (auto-generated on deploy)

## How It Works

The package.json scripts use simple shell commands (`cp .env.staging .env`) to copy the correct environment file before running Shopify CLI commands.

**Why this approach:**
- ✅ Uses **native Shopify CLI** `--config` flag
- ✅ Simple shell commands (no custom Node.js scripts)
- ✅ Works with Shopify's `app env pull` command
- ✅ Each environment has its own credentials
- ✅ No manual file switching needed
- ✅ Safe deployment to multiple environments
- ✅ No accidental cross-environment deployments

**Note:** Shopify CLI always loads from `.env`, not from environment-specific files like `.env.staging`. Our scripts handle the copying automatically.

## Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Keep `.env.example` updated** - Document all required variables
3. **Use separate databases** - Avoid conflicts between environments
4. **Test in staging first** - Always deploy to staging before production
5. **Document any new variables** - Update this file and `.env.example`

## Troubleshooting

### "Environment file not found" error

Make sure you've created the environment file:
```bash
cp .env.example .env.staging
# Edit .env.staging with your credentials
```

### Wrong environment loaded

Check which environment is active:
```bash
cat .env | grep NODE_ENV
```

Manually switch if needed:
```bash
npm run env:staging
```

### Database connection errors

Ensure each environment uses a different database:
- Development: `magicsell_dev`
- Staging: `magicsell_staging`
- Production: `magicsell_production`
