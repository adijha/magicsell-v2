# Quick Reference Guide

Essential commands and workflows for MagicSell development.

## Setup New Environment

```bash
# Create new configuration (staging, testing, etc.)
shopify app config link

# Follow prompts:
# 1. Create new app? → Yes
# 2. App name? → "MagicSell (Staging)"
# 3. Config name? → "staging"

# This creates: shopify.app.staging.toml
```

## Development

```bash
# Start local development
npm run dev

# Start with specific config
npm run dev -- --config shopify.app.staging.toml

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

## Deployment

```bash
# Deploy to staging
shopify app deploy --config shopify.app.staging.toml

# Deploy to production
shopify app deploy --config shopify.app.production.toml

# Deploy and force review (shows all changes)
shopify app deploy --config shopify.app.production.toml --force
```

## Configuration Management

```bash
# List all configurations
ls shopify.app*.toml

# View current default configuration
cat .shopify-cli.yml

# Set default configuration
shopify app config use staging

# View app info for specific config
shopify app info --config shopify.app.staging.toml
```

## Testing Across Multiple Stores

### Option 1: Single Staging App, Multiple Stores

1. Deploy to staging: `shopify app deploy --config shopify.app.staging.toml`
2. Go to Partner Dashboard → Apps → Your Staging App
3. Click "Test your app" → Select different stores
4. Install on each test store

### Option 2: Store-Specific Configs

```bash
# Create config for Store A
shopify app config link
# Name: "MagicSell - Store A"
# Config: "store-a"

# Deploy to Store A
shopify app deploy --config shopify.app.store-a.toml
```

## Extensions

### Deploy Extensions

```bash
# Extensions deploy with app automatically
shopify app deploy --config shopify.app.staging.toml

# View extension status
shopify app info --config shopify.app.staging.toml
```

### Test Extensions

1. Deploy to staging
2. Install app in test store
3. For theme extensions:
   - Go to Online Store → Themes → Customize
   - Add your extension block
4. For discount functions:
   - Go to Discounts → Create discount
   - Select your function

## Database

```bash
# Create migration
npx prisma migrate dev --name description_of_changes

# Deploy migrations (production)
npx prisma migrate deploy

# View database in browser
npx prisma studio

# Reset database (dev only!)
npx prisma migrate reset
```

## Git Workflow

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Create feature branch
git checkout -b feature/discount-stacking
git push -u origin feature/discount-stacking
```

## Environment Variables

### Local Development (.env)

```bash
SHOPIFY_API_KEY=your-dev-client-id
DATABASE_URL=postgresql://localhost:5432/magicsell_dev
NODE_ENV=development
```

### Staging (.env.staging)

```bash
SHOPIFY_API_KEY=your-staging-client-id
DATABASE_URL=postgresql://staging-db/magicsell_staging
API_URL=https://staging.magicsell.ai
NODE_ENV=staging
```

### Production (.env.production)

```bash
SHOPIFY_API_KEY=your-prod-client-id
DATABASE_URL=postgresql://prod-db/magicsell
API_URL=https://api.magicsell.ai
NODE_ENV=production
```

## Troubleshooting

### Extensions Not Showing

```bash
# Reinstall app in store
# 1. Uninstall from store admin
# 2. Reinstall from app URL

# Or redeploy
shopify app deploy --config shopify.app.staging.toml --force
```

### Database Connection Issues

```bash
# Check connection
npx prisma db pull

# Regenerate client
npx prisma generate

# Reset (dev only)
npx prisma migrate reset
```

### Wrong App/Config Active

```bash
# Check which config is active
cat .shopify-cli.yml

# Switch config
shopify app config use production
```

### Webhooks Not Received

```bash
# Test webhook endpoint
curl -X POST https://api.magicsell.ai/webhooks/app/uninstalled \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check webhook subscriptions in Partner Dashboard
# Apps → Your App → API access → Webhooks
```

## Common Workflows

### Add New Feature

```bash
# 1. Create feature branch
git checkout -b feature/product-recommendations

# 2. Develop locally
npm run dev

# 3. Test locally

# 4. Deploy to staging
shopify app deploy --config shopify.app.staging.toml

# 5. Test in staging stores

# 6. Commit and push
git add .
git commit -m "Add product recommendations"
git push origin feature/product-recommendations

# 7. Create PR and merge

# 8. Deploy to production
git checkout main
git pull
shopify app deploy --config shopify.app.production.toml
```

### Update Scopes

```bash
# 1. Edit shopify.app.*.toml
[access_scopes]
scopes = "read_customers,read_orders,write_products,read_themes"

# 2. Deploy
shopify app deploy --config shopify.app.staging.toml

# 3. Reinstall app in test stores (scope changes require reinstall)
```

### Update Webhooks

```bash
# 1. Edit shopify.app.*.toml
[[webhooks.subscriptions]]
topics = [ "products/update" ]
uri = "/webhooks/products/update"

# 2. Deploy
shopify app deploy --config shopify.app.staging.toml

# Webhooks automatically updated (no reinstall needed)
```

## File Locations

```
.
├── app/                    # Application code
│   ├── routes/            # Route handlers
│   ├── components/        # React components
│   └── services/          # API clients
├── docs/                  # Documentation
│   ├── DEPLOYMENT.md      # Full deployment guide
│   └── QUICK-REFERENCE.md # This file
├── extensions/            # Shopify extensions
│   └── magic-theme-extension/
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
├── shopify.app.toml      # Default app config
├── shopify.app.*.toml    # Environment configs
└── .env                  # Environment variables
```

## Resources

- [Full Deployment Guide](DEPLOYMENT.md)
- [App Structure](../app/STRUCTURE.md)
- [Shopify CLI Docs](https://shopify.dev/docs/apps/tools/cli)
- [React Router Docs](https://reactrouter.com/)
- [Shopify App Dev Docs](https://shopify.dev/docs/apps)
