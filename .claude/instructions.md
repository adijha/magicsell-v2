# Claude Code Instructions for MagicSell Project

## Package Manager
**ALWAYS use `bun` - NEVER use npm or pnpm**

- ✅ Use: `bun install`, `bun add`, `bun remove`
- ❌ Never use: `npm install`, `pnpm install`, `yarn add`
- For scripts: `bun run dev`, `bun run build`, etc.

## UI Framework & Styling

### Shopify Polaris Components (Primary)
**ALWAYS prefer Shopify Polaris components over custom implementations**

- ✅ Use Polaris components for all UI elements:
  - `<Page>`, `<Card>`, `<Button>`, `<TextField>`, `<Select>`, etc.
  - `<Layout>`, `<Stack>`, `<InlineStack>`, `<BlockStack>`
  - `<Banner>`, `<Modal>`, `<Toast>`, `<Badge>`
  - Import from: `@shopify/polaris`

- ❌ Avoid writing custom CSS unless absolutely necessary
- ❌ Don't recreate components that Polaris already provides
- If Polaris doesn't have a component, check Polaris documentation first

### Tailwind CSS (Secondary)
**Use Tailwind CSS v4 ONLY when Polaris doesn't provide the needed functionality**

- ✅ Use Tailwind for:
  - Layout adjustments not covered by Polaris
  - Responsive design utilities
  - Custom spacing/sizing when needed

- Configuration files:
  - `tailwind.config.js` - Tailwind configuration
  - `postcss.config.js` - PostCSS with @tailwindcss/postcss
  - `app/app.css` - Main CSS entry point

- ❌ Don't write custom CSS classes when Tailwind utilities exist
- ❌ Don't use Tailwind for basic UI components (use Polaris instead)

### CSS Priority Order
1. **First choice**: Shopify Polaris components
2. **Second choice**: Tailwind utility classes
3. **Last resort**: Custom CSS (only when absolutely necessary)

## React Router v7

### File-based Routing
- Route files: `app/routes/` directory
- Use `.tsx` extension for route files
- Loader/Action pattern for data fetching

### Route Naming
- Index routes: `app.tsx`, `app._index.tsx`
- Nested routes: `app.users.tsx`, `app.users.$id.tsx`
- Resource routes (API): `api.funnel.ts`, `api.funnel.$id.ts`

### Data Loading
```typescript
// Loaders for GET requests
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Fetch data
  return { data };
}

// Actions for POST/PATCH/DELETE requests
export async function action({ request, params }: ActionFunctionArgs) {
  // Handle form submissions
  return { success: true };
}
```

## Shopify Integration

### Authentication
- Use `authenticate.admin(request)` from `~/shopify.server`
- All admin routes must authenticate first

### App Bridge
- Wrap admin UI with `<AppProvider>` from `@shopify/shopify-app-react-router/react`
- Use App Bridge React hooks for navigation, toasts, etc.

## Database (Prisma)

### Schema Location
- `prisma/schema.prisma` - Database schema
- `app/db.server.ts` - Prisma client instance

### Best Practices
- Use `prisma` export from `~/db.server`
- Serialize JSON fields before saving (e.g., arrays to JSON strings if field is `String?`)
- Use soft deletes with `deletedAt: DateTime?` field

### Example
```typescript
import { prisma } from '~/db.server';

// Query
const funnels = await prisma.funnel.findMany({
  where: { shop, deletedAt: null }
});

// Create with JSON serialization
await prisma.funnel.create({
  data: {
    ...data,
    layout: Array.isArray(data.layout) ? JSON.stringify(data.layout) : data.layout
  }
});
```

## Architecture Pattern

### Layered Architecture
Use a three-layer pattern for all features:

1. **Route Layer** (`app/routes/`)
   - Handle HTTP requests/responses
   - Call service layer for business logic
   - Use loaders for GET, actions for POST/PATCH/DELETE

2. **Service Layer** (`app/services/`)
   - Business logic and validation
   - External API calls (Shopify GraphQL, etc.)
   - Data transformation

3. **Repository Layer** (`app/repositories/`)
   - Direct database access via Prisma
   - CRUD operations
   - Query logic

### Example Structure
```
app/
├── routes/
│   ├── app.offer.new.$id.tsx    # UI route with loader/action
│   └── api.funnel.$id.ts        # API route with action
├── services/
│   ├── funnelService.ts         # Business logic
│   └── shopifyUtils.server.ts  # Shopify API calls
└── repositories/
    └── funnelRepository.server.ts # Database operations
```

## Code Style

### TypeScript
- Always use TypeScript (`.ts` or `.tsx`)
- Define proper types and interfaces
- Avoid `any` type unless necessary

### Naming Conventions
- Components: PascalCase (`FunnelForm`, `OfferCard`)
- Files: camelCase for utilities, PascalCase for components
- Functions: camelCase (`getFunnelById`, `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`API_VERSION`, `MAX_RETRIES`)

### File Organization
- One component per file
- Group related utilities in service files
- Keep route files focused on routing logic

## Error Handling

### Server-side
```typescript
try {
  // Operation
  return Response.json({ success: true });
} catch (error) {
  logger.error('Error message', { error });
  return Response.json({ error: 'User-friendly message' }, { status: 500 });
}
```

### Client-side
- Use Polaris `<Banner>` for error messages
- Use App Bridge toast for success/error notifications
- Provide clear, actionable error messages

## Logging

### Winston Logger
- Use logger from `~/libs/logger`
- Include request context in logs
- Log levels: `info`, `warn`, `error`

```typescript
import { createRequestLogger } from '~/libs/logger';

const logger = createRequestLogger(request);
logger.info('Operation started', { userId });
logger.error('Operation failed', { error: error.message });
```

## Environment Variables

### Configuration Files
- `.env` - Local development (not committed)
- `.env.example` - Template (committed)
- `shopify.app.staging.toml` - Staging config
- `shopify.app.toml` - Production config (template)

### Usage
```typescript
process.env.SHOPIFY_API_KEY
process.env.DATABASE_URL
```

## Git Workflow

### Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance
- `docs:` - Documentation
- `refactor:` - Code refactoring

### Example
```
feat: Add offer creation with Polaris components

- Implement offer form using Polaris Card and TextField
- Add validation using react-hook-form
- Create API route for saving offers
```

## Testing

### Manual Testing
- Test in Shopify admin embedded context
- Verify CORS headers for API routes
- Check mobile responsiveness (Polaris handles most)

### Dev Server
- Run: `bun run dev:staging`
- URL: Shopify CLI provides tunnel URL
- HMR should work automatically

## Common Patterns

### CORS Headers for API Routes
```typescript
const jsonWithCors = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
```

### Shopify GraphQL Queries
```typescript
const response = await admin.graphql(
  `#graphql
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
        }
      }
    }
  }`,
  { variables: { first: 10 } }
);
```

## Important Reminders

1. **Always use bun** - Never npm or pnpm
2. **Polaris first** - Check Polaris before writing custom UI
3. **Layer separation** - Routes → Services → Repositories
4. **Type safety** - Use TypeScript properly
5. **Error handling** - User-friendly messages with proper logging
6. **CORS** - Add headers to all API responses
7. **Authentication** - Always authenticate Shopify admin requests

## Resources

- [Shopify Polaris Documentation](https://polaris.shopify.com)
- [React Router v7 Documentation](https://reactrouter.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [Shopify Admin API](https://shopify.dev/docs/api/admin)
