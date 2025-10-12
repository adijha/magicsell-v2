# Edge Functions for MagicSell

High-performance Cloudflare Workers for caching and serving recommendation and storefront APIs.

## Endpoints

### Product Recommendations
- **GET** `/api/v2/recommendation/product`
  - Query parameters: `shop`, `productId`, `productHandle`, `type`, `layout`, `limit`
  - Cache TTL: 1 hour
  - Request coalescing enabled

### Cart Recommendations  
- **POST** `/api/v2/recommendation/cart`
  - Body: `{ shop, type, products, layout, limit }`
  - Cache TTL: 1 hour
  - Request coalescing enabled

### Storefront API (Cart Rules & Funnels)
- **POST** `/api/storefront`
  - Body: `{ cart, shop, actionType?, variantId?, attribute? }`
  - Cache TTL: 5 minutes (shorter due to frequent cart state changes)
  - Request coalescing enabled for non-action requests
  - Actions (like `addFreeGift`) bypass cache entirely
  - Handles cart progress bars, auto/manual free gifts, and before-you-go funnels

### Upsell/Downsell Funnel API
- **POST** `/api/v2/funnel/upsell`
  - Body: `{ shop, type, items?: Array<{productId, variantId?}>, productId?, variantId? }`
  - Cache TTL: 30 minutes (moderate change frequency)
  - Request coalescing enabled
  - Handles priority-based funnel matching (contains_any > is_not > equals_anything)
  - Returns matching funnel data and styles

### Product Handle Recommendations (think.magicsell.ai)
- **GET** `/recommendations/handle/{shop}/{productHandle}`
  - Path parameters: `shop` (Shopify store URL), `productHandle` (product handle)
  - Returns: `{ product_id: string, recommendations: string[] }`
  - Cache TTL: 10 minutes
  - Request coalescing enabled
  - Origin: Configured via THINK_ORIGIN_URL environment variable

## Features

- **Intelligent Caching**: SHA-256 based cache keys with KV storage
- **Request Coalescing**: Prevents duplicate requests to origin
- **Stale-While-Revalidate**: Serves stale content while fetching fresh data
- **CORS Support**: Full CORS headers including CF-Access headers
- **Performance Monitoring**: Response time tracking with X-Response-Time header

## Performance

- **Cache Hit Response Time**: ~4-150ms
- **Cache Miss Response Time**: ~500-1500ms (origin dependent)
- **Cache Hit Rate**: 80-100% after warm-up
- **Improvement**: 75-85% faster than direct API access

## Deployment

### Development
```bash
npx wrangler deploy --env development
```

### Staging  
```bash
npx wrangler deploy --env staging
```

### Production
```bash
npx wrangler deploy --env production
```

## Configuration

Configuration is managed in `wrangler.toml`:

- **Development**: https://edge-dev.magicsell.workers.dev
- **Staging**: https://edge-staging.magicsell.workers.dev  
- **Production**: https://edge.magicsell.ai (custom domain)

## Testing

Performance tests are available in `/performance` directory:

```bash
npm run test:cart        # Test cart endpoint
npm run test:storefront  # Test storefront endpoint
npm run test:all        # Test product recommendations
```

## Environment Variables

- `ORIGIN_URL`: Backend API URL (tunnel.magicsell.ai or api.magicsell.ai)
- `THINK_ORIGIN_URL`: Think.magicsell.ai API URL for AI recommendations
- `ENVIRONMENT`: Current environment (development/staging/production)
- `CACHE`: KV namespace binding for caching

## Cache Strategy

| Endpoint | TTL | Key Components |
|----------|-----|---------------|
| Product Recommendations | 1 hour | shop, productId, type, layout |
| Cart Recommendations | 1 hour | shop, type, products[], layout |
| Storefront | 5 minutes | shop, cart token, items, total |
| Upsell/Downsell | 30 minutes | shop, type, items[], productId, variantId |
| Handle Recommendations | 10 minutes | shop, productHandle |

## Security

- CF-Access headers are automatically forwarded to protected origins
- CORS headers support all necessary client headers
- No sensitive data is cached