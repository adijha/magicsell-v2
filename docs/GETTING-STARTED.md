# Getting Started with MagicSell

Quick start guide for setting up your development environment and deploying your first version.

## Prerequisites

- Node.js 20+ installed
- Shopify Partner account
- Development store (or test store)
- Shopify CLI installed globally

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/adijha/magicsell-v2.git
cd magicsell-v2

# Install dependencies
npm install
```

### 2. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` with your values:

```bash
SHOPIFY_API_KEY=your-staging-client-id
DATABASE_URL=postgresql://localhost:5432/magicsell_dev
NODE_ENV=development
```

## Development Workflow

### 1. Start Local Development

```bash
npm run dev
```

This will:
- Start the development server
- Create a tunnel to your local server
- Open the app URL in your browser

### 2. Install in Development Store

When prompted:
1. Select your development store
2. Click "Install app"
3. Grant permissions

### 3. Access the App

The app will open at: `https://admin.shopify.com/store/{your-store}/apps/{your-app}`

## Deploy to Staging

### 1. Create Staging App Configuration

```bash
shopify app config link
```

Follow the prompts:
- Create new app? **Yes**
- App name: **MagicSell (Staging)**
- Config name: **staging**

This creates `shopify.app.staging.toml`

### 2. Deploy to Staging

```bash
shopify app deploy --config shopify.app.staging.toml
```

### 3. Get Extension UID

From the deployment output, copy the extension UID:

```
Extensions:
+ magic-theme-extension (uid: 2b7313e8-xxx) (new)
```

### 4. Update Environment Variables

Add to your `.env`:

```bash
THEME_EXTENSION_UID=2b7313e8-xxx  # Your staging UID
```

Restart the development server:

```bash
npm run dev
```

### 5. Test the Theme Extension

1. Navigate to `/app/setup` in your app
2. Click "Enable in Theme Editor"
3. Add the extension to your theme
4. Test the functionality

## Deploy to Production

### 1. Prepare Production Configuration

Your production config is already at `shopify.app.production.toml`

Verify it has the correct settings:
- `automatically_update_urls_on_dev = false`
- Correct production URL
- All required scopes

### 2. Deploy to Production

```bash
shopify app deploy --config shopify.app.production.toml
```

### 3. Get Production Extension UID

Copy the production extension UID from deployment output.

### 4. Update Production Environment

On your hosting platform (Heroku, Fly.io, etc.), set:

```bash
THEME_EXTENSION_UID=production-uid-here
```

### 5. Deploy Backend

```bash
# Build the app
npm run build

# Deploy to your hosting platform
# (Specific commands depend on your hosting)
```

## Project Structure

```
magicsell-v2/
├── app/
│   ├── routes/           # App pages (React Router v7)
│   ├── components/       # React components
│   ├── services/         # API clients
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── constants/        # App constants
├── extensions/
│   └── magic-theme-extension/  # Theme extension
├── docs/                 # Documentation
├── prisma/               # Database schema
└── shopify.app.*.toml    # App configurations
```

## Common Tasks

### Add New Route

Create a file in `app/routes/`:

```typescript
// app/routes/app.products.tsx
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      products(first: 10) {
        nodes {
          id
          title
        }
      }
    }
  `);

  const data = await response.json();
  return { products: data.data.products.nodes };
};

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Products">
      {products.map((product) => (
        <div key={product.id}>{product.title}</div>
      ))}
    </s-page>
  );
}
```

### Add New Component

Create a file in `app/components/`:

```typescript
// app/components/ProductCard.tsx
interface ProductCardProps {
  title: string;
  price: string;
}

export function ProductCard({ title, price }: ProductCardProps) {
  return (
    <s-card>
      <s-text variant="strong">{title}</s-text>
      <s-text>{price}</s-text>
    </s-card>
  );
}
```

### Update Database Schema

1. Edit `prisma/schema.prisma`:

```prisma
model Product {
  id        String   @id @default(cuid())
  title     String
  price     Float
  createdAt DateTime @default(now())
}
```

2. Create migration:

```bash
npx prisma migrate dev --name add_product_model
```

3. Regenerate Prisma client:

```bash
npx prisma generate
```

### Update Scopes

1. Edit `shopify.app.*.toml`:

```toml
[access_scopes]
scopes = "read_products,write_products,read_orders"
```

2. Deploy:

```bash
shopify app deploy --config shopify.app.staging.toml
```

3. Reinstall app in test stores (scope changes require reinstall)

## Testing

### Run Tests

```bash
npm test
```

### Test in Multiple Stores

1. Deploy to staging
2. Go to Partner Dashboard → Apps → Your Staging App
3. Click "Test your app" → Select different stores
4. Install and test in each store

## Troubleshooting

### Database Connection Error

```bash
# Check database is running
psql -U postgres

# Reset database (dev only!)
npx prisma migrate reset
```

### Extension Not Showing

```bash
# Verify extension deployed
shopify app info --config shopify.app.staging.toml

# Redeploy if needed
shopify app deploy --config shopify.app.staging.toml --force
```

### App Not Loading

1. Check Shopify CLI output for errors
2. Verify tunnel is active
3. Clear browser cache
4. Reinstall app in store

## Next Steps

1. ✅ Complete initial setup
2. ✅ Deploy to staging
3. ✅ Test theme extension
4. 📖 Read [Deployment Guide](DEPLOYMENT.md)
5. 📖 Read [Extension Management](EXTENSIONS.md)
6. 🚀 Build your features
7. 🚀 Deploy to production

## Resources

- [Deployment Guide](DEPLOYMENT.md) - Multi-environment deployment
- [Extension Management](EXTENSIONS.md) - Extension UIDs and testing
- [Theme Extension Deeplink](THEME-EXTENSION-DEEPLINK.md) - Deeplink setup
- [Quick Reference](QUICK-REFERENCE.md) - Command cheat sheet
- [App Structure](../app/STRUCTURE.md) - Code organization

## Need Help?

- Check the documentation in `docs/`
- Review [Shopify CLI documentation](https://shopify.dev/docs/apps/tools/cli)
- Visit [Shopify Community](https://community.shopify.com/)
