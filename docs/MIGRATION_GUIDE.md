# Migration Guide: From Old MagicSell to New Repo

This guide helps you systematically migrate features from your old MagicSell app to this new clean repository.

## Why Migrate to New Repo?

- Fresh codebase with updated dependencies
- **Remix → React Router v7** (natural framework evolution)
- **MongoDB → Prisma** (better TypeScript support, easier migrations)
- **Monorepo → Single repo** (simpler structure)
- **Bun runtime** (60% faster builds than Node.js)
- Clean multi-environment setup
- Better maintainability
- Avoid dependency upgrade issues

## Old vs New Architecture

### Old App (`/Users/adi/magic/upsell-app-dev/`)
```
apps/
├── shopify-app/          # Remix backend
├── embed-react/          # Cart widgets
├── embed-product/        # Product page widgets
├── embed-upsell/         # Upsell popups
├── embed-cart/           # Cart features
└── edge-functions/       # Cloudflare Workers

Tech: Remix + MongoDB + Mongoose + pnpm + Node.js
```

### New App (Current repo)
```
app/                      # React Router v7 backend
extensions/               # All embeds/functions
prisma/                   # Database schema

Tech: React Router v7 + Prisma + PostgreSQL + npm/bun
```

## Migration Strategy

We'll migrate in **5 phases**, prioritizing by dependencies:

### Phase 1: Foundation (Database & Core Services)
**Priority**: CRITICAL - Everything depends on this

### Phase 2: Backend APIs
**Priority**: HIGH - Required for all frontend features

### Phase 3: Admin UI (App Side)
**Priority**: MEDIUM - Merchant-facing features

### Phase 4: Frontend Embeds (Extensions)
**Priority**: MEDIUM - Customer-facing features

### Phase 5: Shopify Functions
**Priority**: MEDIUM - Discount and checkout features

---

## Phase 1: Foundation

### 1.1 Database Schema Migration (MongoDB → Prisma)

**Location**: `prisma/schema.prisma`

**Old Database**: MongoDB with Mongoose (`/Users/adi/magic/upsell-app-dev/apps/shopify-app/app/db/`)
**New Database**: PostgreSQL with Prisma

**Finding Old Models**:
In your old app, Mongoose models are in:
- `/apps/shopify-app/app/db/models/`
- `/apps/shopify-app/app/repositories/` (look for Schema definitions)

**Key Differences**:
| MongoDB (Mongoose) | Prisma (PostgreSQL) |
|-------------------|---------------------|
| `_id: ObjectId` | `id: String @id @default(cuid())` |
| `type: {}` | `type: Json` |
| `ref: 'Model'` | `relation` with explicit foreign keys |
| `createdAt: { type: Date, default: Date.now }` | `createdAt: DateTime @default(now())` |

**Steps**:
1. **Find Mongoose models** in old app:
   ```bash
   # In old app directory
   find apps/shopify-app/app/db -name "*.ts" -o -name "*.js"
   ```

2. **Convert each model to Prisma**:
   - Copy the fields
   - Convert types (see conversion table below)
   - Add indexes for commonly queried fields
   - Define relations explicitly

3. **Update datasource in `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Run migrations**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

**Type Conversion Table**:
| Mongoose | Prisma |
|----------|--------|
| `String` | `String` |
| `Number` | `Int` or `Float` |
| `Boolean` | `Boolean` |
| `Date` | `DateTime` |
| `ObjectId` | `String` (use cuid) |
| `{}` or `Object` | `Json` |
| `[String]` | `String[]` |
| `Schema.Types.Mixed` | `Json` |

**Example Conversion**:

**OLD (Mongoose)**:
```javascript
// apps/shopify-app/app/db/models/Funnel.js
const FunnelSchema = new Schema({
  _id: ObjectId,
  shop: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: 'draft' },
  priority: { type: Number, default: 0 },
  rules: { type: Schema.Types.Mixed },
  config: { type: Schema.Types.Mixed },
  customization: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**NEW (Prisma)**:
```prisma
// prisma/schema.prisma
model Funnel {
  id            String   @id @default(cuid())
  shop          String
  name          String
  type          String   // cart-progress-bar, cart-cross-sell, etc.
  status        String   @default("draft") // draft, active, paused
  priority      Int      @default(0)
  rules         Json?    // Targeting rules
  config        Json?    // Funnel-specific configuration
  customization Json?    // Styling options
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([shop, status])
  @@index([shop, type])
}
```

**Common Models to Migrate**:
1. **Funnel/Offer** - Main funnel configuration
2. **Milestone** - Cart progress bar milestones
3. **Customization** - Store styling settings
4. **Analytics** - Performance tracking
5. **Product** (if cached) - Product data cache
6. **Session** - Already exists, keep as is

### 1.2 Core Services Migration

**Location**: `app/services/`

**Old Location**: `/Users/adi/magic/upsell-app-dev/apps/shopify-app/app/services/`

**What to copy**:
- `shopify-admin.server.ts` - Shopify Admin API client (if exists)
- `shopify-storefront.server.ts` - Shopify Storefront API client (if exists)
- `analytics.server.ts` - Analytics tracking
- `recommendation.server.ts` - AI recommendation service (calls think.magicsell.ai)
- Any other service files

**Steps**:
1. **Find services in old app**:
   ```bash
   ls /Users/adi/magic/upsell-app-dev/apps/shopify-app/app/services/
   ```

2. **Copy each service file**:
   ```bash
   cp /path/to/old/service.ts app/services/
   ```

3. **Update imports**:
   - Change any `@remix-run/*` imports to `react-router`
   - Update relative paths if needed
   - Replace `mongoose` queries with `prisma` queries

4. **Update database queries**:
   **OLD (Mongoose)**:
   ```typescript
   const funnel = await Funnel.findOne({ shop, status: 'active' });
   ```

   **NEW (Prisma)**:
   ```typescript
   import { prisma } from "~/db.server";
   const funnel = await prisma.funnel.findFirst({
     where: { shop, status: 'active' }
   });
   ```

5. **Test each service independently**

### 1.3 Utilities Migration

**Location**: `app/utils/`

**Old Location**: `/Users/adi/magic/upsell-app-dev/apps/shopify-app/app/utils/`

**What to copy**:
- `funnel-matcher.ts` - Rule matching logic
- `cart-helpers.ts` - Cart calculation utilities
- `product-helpers.ts` - Product formatting utilities
- `pricing.ts` - Pricing calculations
- Any other utility files

**Steps**:
1. Copy utility files from old app
2. Update imports (no Mongoose dependencies in utils)
3. Test each utility function

---

## Phase 2: Backend APIs

### 2.1 Funnel CRUD APIs

**Routes to create**:
- `app/routes/api.funnel.ts` (or split into multiple)
- `app/routes/api.funnel.$id.ts`

**Old Location**: `/Users/adi/magic/upsell-app-dev/apps/shopify-app/app/routes/api.*.ts`

**API Endpoints to Migrate**:
- GET /api/funnel - List all funnels
- POST /api/funnel - Create funnel
- PUT /api/funnel/:id - Update funnel
- DELETE /api/funnel/:id - Delete funnel
- GET /api/funnel/:id - Get single funnel

**Steps**:
1. **Find old API routes**:
   ```bash
   ls /Users/adi/magic/upsell-app-dev/apps/shopify-app/app/routes/api*.ts
   ```

2. **Copy route file structure**:
   - Remix and React Router v7 use the same routing conventions
   - File names stay the same: `api.funnel.ts`, `api.funnel.$id.ts`

3. **Update imports**:
   ```typescript
   // OLD (Remix)
   import { json } from "@remix-run/node";
   import type { LoaderFunctionArgs } from "@remix-run/node";

   // NEW (React Router v7)
   import { json } from "react-router";
   import type { LoaderFunctionArgs } from "react-router";
   ```

4. **Update database calls**:
   ```typescript
   // OLD (Mongoose)
   const funnels = await Funnel.find({ shop });

   // NEW (Prisma)
   import { prisma } from "~/db.server";
   const funnels = await prisma.funnel.findMany({ where: { shop } });
   ```

5. **Test each endpoint** with Postman or curl:
   ```bash
   # Test GET
   curl http://localhost:3000/api/funnel?shop=test.myshopify.com

   # Test POST
   curl -X POST http://localhost:3000/api/funnel \
     -H "Content-Type: application/json" \
     -d '{"shop":"test.myshopify.com","name":"Test Funnel"}'
   ```

### 2.2 Recommendation APIs

**Routes to create**:
- `app/routes/api.v2.recommendation.product.ts`
- `app/routes/api.v2.recommendation.cart.ts`

**What to copy**:
```typescript
// POST /api/v2/recommendation/product
// Parameters: shop, productId, type, layout, limit
// Returns: { products: [], config: {} }

// POST /api/v2/recommendation/cart
// Parameters: shop, cartItems, type, limit
// Returns: { products: [], config: {} }
```

### 2.3 Cart Features APIs

**Routes to create**:
- `app/routes/api.v2.cart-progress-bar.ts`
- `app/routes/api.v2.select-free-gift.ts`
- `app/routes/api.v2.free-gift-auto-add.ts`

**What to copy**:
- Cart progress bar eligibility logic
- Milestone calculation
- Free gift qualification logic
- Gift selection logic

### 2.4 Other Essential APIs

**Routes to create**:
- `app/routes/api.sync-products.ts` - Product sync
- `app/routes/api.sync-orders.ts` - Order sync
- `app/routes/api.customization.ts` - Customization settings
- `app/routes/api.health.ts` - Health check

---

## Phase 3: Admin UI (App Side)

### 3.1 Dashboard Enhancement

**File**: `app/routes/app._index.tsx` (already exists)

**What to add**:
- Stats cards (revenue, conversions, AOV)
- Active funnels list
- Recent performance metrics
- Quick action buttons

**Copy from old app**:
- Dashboard components from `app/routes/app._index.tsx`
- Stats calculation logic
- Chart components

### 3.2 Offer Creation/Edit

**Files to create**:
- `app/routes/app.offer.new.tsx`
- `app/routes/app.offer.$id.tsx`
- `app/components/FunnelTypeSelector.tsx`
- `app/components/RuleBuilder.tsx`
- `app/components/OfferPreview.tsx`

**What to copy**:
- Funnel type selection UI
- Rule builder interface
- Targeting configuration
- A/B testing setup
- Preview functionality

### 3.3 Analytics Pages

**Files to create**:
- `app/routes/app.analytics-v2.tsx`
- `app/routes/app.product-analytics.tsx`
- `app/components/AnalyticsChart.tsx`
- `app/components/MetricsCard.tsx`

### 3.4 Enhanced Customization

**File**: `app/routes/app.customization.tsx` (already exists, enhance it)

**What to add**:
- Color picker
- Font selector
- Border radius slider
- Spacing controls
- Preview iframe
- Save/reset functionality

---

## Phase 4: Frontend Embeds

### 4.1 Setup Embed Build System

**Old Structure** (Monorepo):
```
/Users/adi/magic/upsell-app-dev/
└── apps/
    ├── embed-react/       # Separate package
    ├── embed-product/     # Separate package
    ├── embed-upsell/      # Separate package
    └── embed-cart/        # Separate package
```

**New Structure** (Extensions):
```
extensions/
├── embed-react/           # Standalone extension
│   ├── src/
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── embed-product/         # Standalone extension
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
└── embed-upsell/          # Standalone extension
    ├── src/
    ├── vite.config.ts
    └── package.json
```

**Migration Strategy**:
Each embed app was a separate package in the old monorepo. We'll recreate them as extensions.

**Build Configuration**:
Each embed needs its own Vite config for building standalone JS bundles that can be loaded in Shopify themes.

**Output**: Built JS files go to:
- Old: `/apps/shopify-app/extensions/magicshift-theme-extension/assets/`
- New: `/extensions/magic-theme-extension/assets/`

### 4.2 Cart Embeds (embed-react)

**Components to copy**:
- `CartProgressBar.tsx`
- `SelectGiftCart.tsx`
- `CartCrossSellFunnel.tsx`
- Supporting utilities

### 4.3 Product Page Embeds (embed-product)

**Components to copy**:
- `CrossSellAddon.tsx`
- `CrossSellBottom.tsx`
- `CrossSellAmazon.tsx`

### 4.4 Upsell Embeds (embed-upsell)

**Components to copy**:
- `PopUp.tsx`
- `UpsellDownsell.tsx`

---

## Phase 5: Shopify Functions

### 5.1 Discount Functions

**Create**:
```
extensions/
  free-gift-am/           # Free gift discount
  recommend-discount/     # Recommendation discount
  cart-progress-reward/   # Milestone discount
  magic-shipping/         # Shipping discount
```

**What to copy**:
- Function source code from old extensions
- GraphQL queries
- Input/output types
- Configuration files

### 5.2 Checkout UI Extension

**Create**:
```
extensions/
  magic-checkout/
    src/
    shopify.extension.toml
```

**What to copy**:
- Checkout recommendation component
- API integration
- UI components

---

## Migration Checklist

Use this checklist as you migrate:

### Phase 1: Foundation
- [ ] Prisma models defined
- [ ] Database migrated
- [ ] Core services copied
- [ ] Utilities copied and tested

### Phase 2: Backend APIs
- [ ] Funnel CRUD APIs working
- [ ] Recommendation APIs working
- [ ] Cart features APIs working
- [ ] Sync APIs working
- [ ] All APIs tested

### Phase 3: Admin UI
- [ ] Dashboard enhanced
- [ ] Offer creation page built
- [ ] Analytics pages built
- [ ] Customization page enhanced
- [ ] Settings page enhanced

### Phase 4: Frontend Embeds
- [ ] Build system configured
- [ ] Cart embeds working
- [ ] Product embeds working
- [ ] Upsell embeds working
- [ ] All embeds tested in theme

### Phase 5: Shopify Functions
- [ ] Free gift function deployed
- [ ] Recommend discount deployed
- [ ] Cart progress reward deployed
- [ ] Magic shipping deployed
- [ ] Checkout UI extension deployed

---

## Best Practices

### 1. Test As You Go
- Don't copy everything at once
- Test each feature after copying
- Use staging environment for testing

### 2. Update Imports
- React Router v7 uses different import paths
- Update `@remix-run/*` to `react-router` where needed
- Update relative imports to match new structure

### 3. Environment Variables
- Ensure all required env vars are in `.env.staging` and `.env.production`
- Update API URLs if they changed
- Test with both environments

### 4. Database Migrations
- Always create Prisma migrations
- Don't manually edit the database
- Keep migrations in git

### 5. Commit Frequently
- Commit after each major feature migration
- Use descriptive commit messages
- Push to remote regularly

---

## Recommended Order

Here's the recommended order to migrate features:

1. **Start with one complete feature end-to-end**:
   - Example: Cart Progress Bar
   - Database model → API → Admin UI → Frontend embed → Function
   - This validates your entire stack

2. **Then migrate by phase**:
   - Complete Phase 1 entirely
   - Complete Phase 2 entirely
   - And so on...

3. **Test thoroughly at each phase**:
   - Manual testing in staging
   - Automated tests if available
   - Fix issues before moving to next phase

---

## Mongoose to Prisma Query Conversion Reference

This section helps you convert Mongoose queries to Prisma queries quickly.

### Find Operations

| Mongoose | Prisma |
|----------|--------|
| `Model.find()` | `prisma.model.findMany()` |
| `Model.findOne({ field: value })` | `prisma.model.findFirst({ where: { field: value } })` |
| `Model.findById(id)` | `prisma.model.findUnique({ where: { id } })` |
| `Model.find({ field: { $in: [values] } })` | `prisma.model.findMany({ where: { field: { in: [values] } } })` |

### Create Operations

| Mongoose | Prisma |
|----------|--------|
| `new Model({ data }).save()` | `prisma.model.create({ data })` |
| `Model.create({ data })` | `prisma.model.create({ data })` |
| `Model.insertMany([data])` | `prisma.model.createMany({ data: [data] })` |

### Update Operations

| Mongoose | Prisma |
|----------|--------|
| `Model.findByIdAndUpdate(id, data)` | `prisma.model.update({ where: { id }, data })` |
| `Model.updateOne({ field }, data)` | `prisma.model.update({ where: { field }, data })` |
| `Model.updateMany({ field }, data)` | `prisma.model.updateMany({ where: { field }, data })` |

### Delete Operations

| Mongoose | Prisma |
|----------|--------|
| `Model.findByIdAndDelete(id)` | `prisma.model.delete({ where: { id } })` |
| `Model.deleteOne({ field })` | `prisma.model.delete({ where: { field } })` |
| `Model.deleteMany({ field })` | `prisma.model.deleteMany({ where: { field } })` |

### Query Conditions

| Mongoose | Prisma |
|----------|--------|
| `{ field: value }` | `{ where: { field: value } }` |
| `{ field: { $gt: value } }` | `{ where: { field: { gt: value } } }` |
| `{ field: { $gte: value } }` | `{ where: { field: { gte: value } } }` |
| `{ field: { $lt: value } }` | `{ where: { field: { lt: value } } }` |
| `{ field: { $ne: value } }` | `{ where: { field: { not: value } } }` |
| `{ $or: [{ a }, { b }] }` | `{ where: { OR: [{ a }, { b }] } }` |
| `{ $and: [{ a }, { b }] }` | `{ where: { AND: [{ a }, { b }] } }` |

### Sorting & Pagination

| Mongoose | Prisma |
|----------|--------|
| `.sort({ field: 1 })` | `{ orderBy: { field: 'asc' } }` |
| `.sort({ field: -1 })` | `{ orderBy: { field: 'desc' } }` |
| `.limit(10)` | `{ take: 10 }` |
| `.skip(20)` | `{ skip: 20 }` |
| `.select('field1 field2')` | `{ select: { field1: true, field2: true } }` |

### Complete Example

**OLD (Mongoose)**:
```typescript
const funnels = await Funnel.find({
  shop: shop,
  status: 'active',
  priority: { $gte: 5 }
})
  .sort({ priority: -1 })
  .limit(10)
  .select('name type config');
```

**NEW (Prisma)**:
```typescript
const funnels = await prisma.funnel.findMany({
  where: {
    shop: shop,
    status: 'active',
    priority: { gte: 5 }
  },
  orderBy: { priority: 'desc' },
  take: 10,
  select: {
    name: true,
    type: true,
    config: true
  }
});
```

## Common Issues & Solutions

### Issue: Import errors
**Solution**: Update imports to React Router v7 syntax
```typescript
// OLD
import { json } from "@remix-run/node";
// NEW
import { json } from "react-router";
```

### Issue: Prisma client not found
**Solution**: Run `npx prisma generate` after modifying schema

### Issue: MongoDB query doesn't work
**Solution**: Use the Mongoose → Prisma conversion table above

### Issue: API not responding
**Solution**: Check CORS, authentication, and route configuration

### Issue: Embed not loading
**Solution**: Check theme extension is enabled, JS bundle built correctly

### Issue: Functions not applying discounts
**Solution**: Check function configuration in Partner Dashboard, ensure proper API responses

### Issue: Database connection errors
**Solution**:
1. Check DATABASE_URL in `.env` file
2. Ensure PostgreSQL is running
3. Run `npx prisma migrate dev` to apply migrations

---

## Getting Help

- Check existing docs in `/docs`
- Review `FEATURES_DOCUMENTATION.md` for feature details
- Test in staging environment first
- Ask for help when stuck!

---

## Next Steps

Ready to start? Here's what to do:

1. **Choose your starting feature** (recommended: Cart Progress Bar or simplest feature)
2. **Mark the relevant todo as in_progress**
3. **Start with Phase 1 for that feature** (database model)
4. **Work through each phase** for that feature
5. **Test thoroughly** before moving to next feature

Good luck with the migration! 🚀
