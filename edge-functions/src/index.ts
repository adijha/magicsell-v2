/**
 * Cloudflare Worker for recommendation endpoints
 * Handles both product and cart recommendation requests with intelligent caching
 * 
 * Endpoints:
 * - /api/v2/recommendation/product (GET)
 * - /api/v2/recommendation/cart (POST)
 * 
 * Performance targets:
 * - 10M requests/day capacity
 * - Sub-50ms response time for cache hits
 * - 1-hour cache TTL with stale-while-revalidate
 */

export interface Env {
  // KV namespace for caching
  CACHE: KVNamespace;
  // Origin server URL
  ORIGIN_URL: string;
  // Think.magicsell.ai origin URL
  THINK_ORIGIN_URL: string;
  // Environment (production/development)
  ENVIRONMENT?: string;
  // Request coalescing map (in-flight requests)
  requestCoalescing?: Map<string, Promise<Response>>;
}

interface ProductRequestBody {
  shop: string;
  productId?: string;
  productHandle?: string;
  type: string;
  layout?: string;
  limit?: number;
  excludeProductIds?: string[];
  cartToken?: string;
}

interface CartRequestBody {
  shop: string;
  type: string;
  products?: number[];
  layout?: string;
  limit?: number;
  cartToken?: string;
}

interface StorefrontRequestBody {
  cart: any;
  shop: string;
  actionType?: string;
  variantId?: string;
  attribute?: string;
}

interface UpsellRequestBody {
  shop: string;
  type: string;
  items?: Array<{ productId: string; variantId?: string }>;
  productId?: string;
  variantId?: string;
}

interface RecommendationsResponse {
  product_id: string;
  recommendations: string[];
}

interface CachedResponse {
  data: any;
  timestamp: number;
  etag?: string;
}

// Initialize request coalescing map
const inFlightRequests = new Map<string, Promise<Response>>();

/**
 * Main fetch handler - routes requests and manages caching
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    
    // Determine which endpoint is being called
    const isProductEndpoint = url.pathname.includes('/api/v2/recommendation/product');
    const isCartEndpoint = url.pathname.includes('/api/v2/recommendation/cart');
    const isStorefrontEndpoint = url.pathname.includes('/api/storefront');
    const isUpsellEndpoint = url.pathname.includes('/api/v2/funnel/upsell');
    const isThinkRecommendationsEndpoint = url.pathname.startsWith('/recommendations/handle/');
    
    // Handle non-matching paths
    if (!isProductEndpoint && !isCartEndpoint && !isStorefrontEndpoint && !isUpsellEndpoint && !isThinkRecommendationsEndpoint) {
      return new Response('Not found', { status: 404 });
    }

    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Client-Id, CF-Access-Client-Secret, cf-access-client-id, cf-access-client-secret, Accept, Accept-Language, Cache-Control, DNT, Origin, Pragma, Priority, Referer, Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, User-Agent',
        },
      });
    }

    // Route to appropriate handler
    if (isProductEndpoint) {
      return handleProductRecommendation(request, env, ctx, startTime);
    } else if (isCartEndpoint) {
      return handleCartRecommendation(request, env, ctx, startTime);
    } else if (isStorefrontEndpoint) {
      return handleStorefrontRequest(request, env, ctx, startTime);
    } else if (isUpsellEndpoint) {
      return handleUpsellRequest(request, env, ctx, startTime);
    } else if (isThinkRecommendationsEndpoint) {
      return handleThinkRecommendations(request, env, ctx, startTime);
    }

    return createErrorResponse('Internal server error', 500, startTime);
  },
};

/**
 * Handle product recommendation requests
 */
async function handleProductRecommendation(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  startTime: number
): Promise<Response> {
  if (request.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405, startTime);
  }

  try {
    const url = new URL(request.url);
    const body = parseProductQueryParams(url);
    if (!body) {
      return createErrorResponse('Invalid request parameters', 400, startTime);
    }

    // Generate cache key from request body
    const cacheKey = await generateProductCacheKey(body);
    
    // Check for cached response
    const cachedResponse = await getCachedResponse(env.CACHE, cacheKey);
    
    if (cachedResponse && !isStale(cachedResponse)) {
      // Cache hit - return cached data
      return createSuccessResponse(
        cachedResponse.data,
        'HIT',
        startTime,
        cachedResponse.etag
      );
    }

    // Check if there's already an in-flight request for this cache key
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      // Request coalescing - wait for existing request
      const response = await existingRequest;
      return response.clone();
    }

    // Create new request promise for coalescing
    const requestPromise = fetchProductFromOrigin(env, body, cacheKey, cachedResponse, startTime, ctx);
    inFlightRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up request coalescing map
      inFlightRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error('Product worker error:', error);
    return createErrorResponse('Internal server error', 500, startTime);
  }
}

/**
 * Handle cart recommendation requests
 */
async function handleCartRecommendation(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  startTime: number
): Promise<Response> {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, startTime);
  }

  try {
    // Parse JSON body
    const body = await parseCartRequestBody(request);
    if (!body) {
      return createErrorResponse('Invalid request parameters', 400, startTime);
    }

    // Generate cache key from request body
    const cacheKey = await generateCartCacheKey(body);
    
    // Check for cached response
    const cachedResponse = await getCachedResponse(env.CACHE, cacheKey);
    
    if (cachedResponse && !isStale(cachedResponse)) {
      // Cache hit - return cached data
      return createSuccessResponse(
        cachedResponse.data,
        'HIT',
        startTime,
        cachedResponse.etag
      );
    }

    // Check if there's already an in-flight request for this cache key
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      // Request coalescing - wait for existing request
      const response = await existingRequest;
      return response.clone();
    }

    // Create new request promise for coalescing
    const requestPromise = fetchCartFromOrigin(env, body, cacheKey, cachedResponse, startTime, ctx);
    inFlightRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up request coalescing map
      inFlightRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error('Cart worker error:', error);
    return createErrorResponse('Internal server error', 500, startTime);
  }
}

/**
 * Parse query parameters from URL for GET requests
 */
function parseProductQueryParams(url: URL): ProductRequestBody | null {
  const params = url.searchParams;
  
  const shop = params.get('shop');
  const type = params.get('type');
  const productId = params.get('productId');
  const productHandle = params.get('productHandle');
  const layout = params.get('layout');
  const cartToken = params.get('cartToken');
  
  // Validate required fields
  if (!shop || !type) {
    return null;
  }
  
  // Ensure at least one product identifier is present
  if (!productId && !productHandle) {
    return null;
  }
  
  // Parse excludeProductIds if present
  const excludeProductIds = params.get('excludeProductIds')
    ? params.get('excludeProductIds')!.split(',')
    : undefined;
  
  const limit = params.get('limit') ? parseInt(params.get('limit')!, 10) : undefined;
  
  return {
    shop,
    type,
    productId: productId || undefined,
    productHandle: productHandle || undefined,
    layout: layout || undefined,
    cartToken: cartToken || undefined,
    excludeProductIds,
    limit,
  };
}

/**
 * Handle storefront requests (cart rules, progress bars, etc)
 */
async function handleStorefrontRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  startTime: number
): Promise<Response> {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, startTime);
  }

  try {
    // Parse JSON body
    const body = await parseStorefrontRequestBody(request);
    if (!body) {
      return createErrorResponse('Invalid request parameters', 400, startTime);
    }

    // Generate cache key from request body (only for non-action requests)
    // Actions like addFreeGift modify cart state and should not be cached
    if (!body.actionType) {
      const cacheKey = await generateStorefrontCacheKey(body);
      
      // Check for cached response
      const cachedResponse = await getCachedResponse(env.CACHE, cacheKey);
      
      if (cachedResponse && !isStale(cachedResponse)) {
        // Cache hit - return cached data
        return createSuccessResponse(
          cachedResponse.data,
          'HIT',
          startTime,
          cachedResponse.etag
        );
      }

      // Check if there's already an in-flight request for this cache key
      const existingRequest = inFlightRequests.get(cacheKey);
      if (existingRequest) {
        // Request coalescing - wait for existing request
        const response = await existingRequest;
        return response.clone();
      }

      // Create new request promise for coalescing
      const requestPromise = fetchStorefrontFromOrigin(env, body, cacheKey, cachedResponse, startTime, ctx);
      inFlightRequests.set(cacheKey, requestPromise);

      try {
        const response = await requestPromise;
        return response;
      } finally {
        // Clean up request coalescing map
        inFlightRequests.delete(cacheKey);
      }
    } else {
      // For action requests, always go to origin (no caching)
      return fetchStorefrontFromOrigin(env, body, null, null, startTime, ctx);
    }

  } catch (error) {
    console.error('Storefront worker error:', error);
    return createErrorResponse('Internal server error', 500, startTime);
  }
}

/**
 * Parse JSON body for cart requests
 */
async function parseCartRequestBody(request: Request): Promise<CartRequestBody | null> {
  try {
    const body = await request.json() as CartRequestBody;
    
    // Validate required fields
    if (!body.shop || !body.type) {
      return null;
    }
    
    return body;
  } catch (error) {
    console.error('Failed to parse cart request body:', error);
    return null;
  }
}

/**
 * Parse JSON body for storefront requests
 */
async function parseStorefrontRequestBody(request: Request): Promise<StorefrontRequestBody | null> {
  try {
    const body = await request.json() as StorefrontRequestBody;
    
    // Validate required fields
    if (!body.cart || !body.shop) {
      return null;
    }
    
    return body;
  } catch (error) {
    console.error('Failed to parse storefront request body:', error);
    return null;
  }
}

/**
 * Handle recommendations from think.magicsell.ai
 */
async function handleThinkRecommendations(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  startTime: number
): Promise<Response> {
  if (request.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405, startTime);
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // Extract shop and productHandle from path
    // Format: /recommendations/handle/{shop}/{productHandle}
    if (pathParts.length < 5 || pathParts[1] !== 'recommendations' || pathParts[2] !== 'handle') {
      return createErrorResponse('Invalid URL format', 400, startTime);
    }
    
    const shop = pathParts[3];
    const productHandle = pathParts[4];
    
    if (!shop || !productHandle) {
      return createErrorResponse('Missing shop or product handle', 400, startTime);
    }

    // Generate cache key
    const cacheKey = await generateRecommendationsCacheKey(shop, productHandle);
    
    // Check for cached response
    const cachedResponse = await getCachedResponse(env.CACHE, cacheKey);
    
    if (cachedResponse && !isStale(cachedResponse)) {
      // Cache hit - return cached data
      return createSuccessResponse(
        cachedResponse.data,
        'HIT',
        startTime,
        cachedResponse.etag
      );
    }

    // Check if there's already an in-flight request for this cache key
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      // Request coalescing - wait for existing request
      const response = await existingRequest;
      return response.clone();
    }

    // Create new request promise for coalescing
    const requestPromise = fetchRecommendationsFromOrigin(env, shop, productHandle, cacheKey, cachedResponse, startTime, ctx);
    inFlightRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up request coalescing map
      inFlightRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error('Recommendations worker error:', error);
    return createErrorResponse('Internal server error', 500, startTime);
  }
}

/**
 * Handle upsell funnel requests
 */
async function handleUpsellRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  startTime: number
): Promise<Response> {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, startTime);
  }

  try {
    // Parse JSON body
    const body = await parseUpsellRequestBody(request);
    if (!body) {
      return createErrorResponse('Invalid request parameters', 400, startTime);
    }

    // Generate cache key from request body
    const cacheKey = await generateUpsellCacheKey(body);
    
    // Check for cached response
    const cachedResponse = await getCachedResponse(env.CACHE, cacheKey);
    
    if (cachedResponse && !isStale(cachedResponse)) {
      // Cache hit - return cached data
      return createSuccessResponse(
        cachedResponse.data,
        'HIT',
        startTime,
        cachedResponse.etag
      );
    }

    // Check if there's already an in-flight request for this cache key
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      // Request coalescing - wait for existing request
      const response = await existingRequest;
      return response.clone();
    }

    // Create new request promise for coalescing
    const requestPromise = fetchUpsellFromOrigin(env, body, cacheKey, cachedResponse, startTime, ctx);
    inFlightRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up request coalescing map
      inFlightRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error('Upsell worker error:', error);
    return createErrorResponse('Internal server error', 500, startTime);
  }
}

/**
 * Parse JSON body for upsell requests
 */
async function parseUpsellRequestBody(request: Request): Promise<UpsellRequestBody | null> {
  try {
    const body = await request.json() as UpsellRequestBody;
    
    // Validate required fields
    if (!body.shop || !body.type) {
      return null;
    }
    
    // Must have either items array or productId/variantId
    if (!body.items && !body.productId) {
      return null;
    }
    
    return body;
  } catch (error) {
    console.error('Failed to parse upsell request body:', error);
    return null;
  }
}

/**
 * Generate SHA-256 cache key from product request body
 */
async function generateProductCacheKey(body: ProductRequestBody): Promise<string> {
  // Create deterministic string from body
  const keyData = JSON.stringify({
    shop: body.shop,
    productId: body.productId,
    productHandle: body.productHandle,
    type: body.type,
    layout: body.layout,
    limit: body.limit,
    excludeProductIds: body.excludeProductIds?.sort(), // Sort for consistency
  });
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `rec_product_${hashHex}`;
}

/**
 * Generate SHA-256 cache key from cart request body
 */
async function generateCartCacheKey(body: CartRequestBody): Promise<string> {
  // Create deterministic string from body
  const keyData = JSON.stringify({
    shop: body.shop,
    type: body.type,
    products: body.products?.sort(), // Sort for consistency
    layout: body.layout,
    limit: body.limit,
  });
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `rec_cart_${hashHex}`;
}

/**
 * Generate SHA-256 cache key from storefront request body
 */
async function generateStorefrontCacheKey(body: StorefrontRequestBody): Promise<string> {
  // Create deterministic string from body
  // Include cart items and total for cache key to ensure different cart states get different caches
  const keyData = JSON.stringify({
    shop: body.shop,
    cartToken: body.cart?.token,
    cartTotal: body.cart?.total_price,
    itemCount: body.cart?.item_count,
    // Create a simplified items array for the key
    items: body.cart?.items?.map((item: any) => ({
      id: item.variant_id,
      quantity: item.quantity,
      properties: item.properties
    })).sort((a: any, b: any) => a.id - b.id)
  });
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `storefront_${hashHex}`;
}

/**
 * Generate SHA-256 cache key from upsell request body
 */
async function generateUpsellCacheKey(body: UpsellRequestBody): Promise<string> {
  // Create deterministic string from body
  const keyData = JSON.stringify({
    shop: body.shop,
    type: body.type,
    // Sort items for consistency if they exist
    items: body.items?.map(item => ({
      productId: item.productId,
      variantId: item.variantId
    })).sort((a, b) => a.productId.localeCompare(b.productId)),
    productId: body.productId,
    variantId: body.variantId
  });
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `upsell_${hashHex}`;
}

/**
 * Generate SHA-256 cache key for recommendations
 */
async function generateRecommendationsCacheKey(shop: string, productHandle: string): Promise<string> {
  // Create deterministic string from parameters
  const keyData = JSON.stringify({
    shop,
    productHandle
  });
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `recommendations_${hashHex}`;
}

/**
 * Retrieve cached response from KV storage
 */
async function getCachedResponse(cache: KVNamespace, key: string): Promise<CachedResponse | null> {
  try {
    const cached = await cache.get(key, { type: 'json' }) as CachedResponse | null;
    return cached;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Check if cached response is stale (older than 1 hour)
 */
function isStale(cached: CachedResponse): boolean {
  const ONE_HOUR = 3600 * 1000; // 1 hour in milliseconds
  return Date.now() - cached.timestamp > ONE_HOUR;
}

/**
 * Fetch product data from origin server
 */
async function fetchProductFromOrigin(
  env: Env,
  body: ProductRequestBody,
  cacheKey: string,
  staleCache: CachedResponse | null,
  startTime: number,
  ctx: ExecutionContext
): Promise<Response> {
  // Build query parameters for GET request to origin
  const params = new URLSearchParams();
  params.append('shop', body.shop);
  params.append('type', body.type);
  
  if (body.productId) params.append('productId', body.productId);
  if (body.productHandle) params.append('productHandle', body.productHandle);
  if (body.layout) params.append('layout', body.layout);
  if (body.cartToken) params.append('cartToken', body.cartToken);
  
  const originUrl = `${env.ORIGIN_URL}/api/v2/recommendation/product?${params.toString()}`;
  
  try {
    // Fetch from origin with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Forward CF-Access headers if we're calling tunnel.magicsell.ai
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Cloudflare-Worker/1.0',
    };
    
    // Add CF-Access headers when calling protected origins
    if (env.ORIGIN_URL.includes('tunnel.magicsell.ai') || env.ORIGIN_URL.includes('api.magicsell.ai')) {
      headers['CF-Access-Client-Id'] = '68d1ece1f2c023d9e41478db797fb493.access';
      headers['CF-Access-Client-Secret'] = '26e5b9ba395a2cbc2950a7524b93cfefa95906b9e727303701565a56eb7b7f86';
    }
    
    const originResponse = await fetch(originUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!originResponse.ok) {
      // Origin error - try to serve stale cache if available
      if (staleCache) {
        console.log('Origin error, serving stale cache');
        return createSuccessResponse(
          staleCache.data,
          'STALE',
          startTime,
          staleCache.etag
        );
      }
      throw new Error(`Origin returned ${originResponse.status}`);
    }
    
    // Parse origin response
    const data = await originResponse.json();
    const etag = originResponse.headers.get('etag') || generateEtag(data);
    
    // Cache the response asynchronously
    const cacheData: CachedResponse = {
      data,
      timestamp: Date.now(),
      etag,
    };
    
    // Use waitUntil for non-blocking cache write
    ctx.waitUntil(
      env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 3600, // 1 hour TTL
      })
    );
    
    return createSuccessResponse(data, 'MISS', startTime, etag);
    
  } catch (error) {
    console.error('Origin fetch error:', error);
    console.error('Origin URL was:', originUrl);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If origin fails and we have stale cache, serve it
    if (staleCache) {
      console.log('Origin timeout/error, serving stale cache');
      return createSuccessResponse(
        staleCache.data,
        'STALE',
        startTime,
        staleCache.etag
      );
    }
    
    // No cache available, return error with more details
    const errorMessage = error instanceof Error && error.message.includes('abort') 
      ? 'Origin timeout (10s)' 
      : 'Origin unavailable';
    return createErrorResponse(errorMessage, 503, startTime);
  }
}

/**
 * Fetch cart data from origin server
 */
async function fetchCartFromOrigin(
  env: Env,
  body: CartRequestBody,
  cacheKey: string,
  staleCache: CachedResponse | null,
  startTime: number,
  ctx: ExecutionContext
): Promise<Response> {
  const originUrl = `${env.ORIGIN_URL}/api/v2/recommendation/cart`;
  
  try {
    // Fetch from origin with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Forward CF-Access headers if we're calling tunnel.magicsell.ai
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Cloudflare-Worker/1.0',
    };
    
    // Add CF-Access headers when calling protected origins
    if (env.ORIGIN_URL.includes('tunnel.magicsell.ai') || env.ORIGIN_URL.includes('api.magicsell.ai')) {
      headers['CF-Access-Client-Id'] = '68d1ece1f2c023d9e41478db797fb493.access';
      headers['CF-Access-Client-Secret'] = '26e5b9ba395a2cbc2950a7524b93cfefa95906b9e727303701565a56eb7b7f86';
    }
    
    const originResponse = await fetch(originUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!originResponse.ok) {
      // Origin error - try to serve stale cache if available
      if (staleCache) {
        console.log('Origin error, serving stale cache');
        return createSuccessResponse(
          staleCache.data,
          'STALE',
          startTime,
          staleCache.etag
        );
      }
      throw new Error(`Origin returned ${originResponse.status}`);
    }
    
    // Parse origin response
    const data = await originResponse.json();
    const etag = originResponse.headers.get('etag') || generateEtag(data);
    
    // Cache the response asynchronously
    const cacheData: CachedResponse = {
      data,
      timestamp: Date.now(),
      etag,
    };
    
    // Use waitUntil for non-blocking cache write
    ctx.waitUntil(
      env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 3600, // 1 hour TTL
      })
    );
    
    return createSuccessResponse(data, 'MISS', startTime, etag);
    
  } catch (error) {
    console.error('Origin fetch error:', error);
    console.error('Origin URL was:', originUrl);
    console.error('Request body was:', JSON.stringify(body));
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If origin fails and we have stale cache, serve it
    if (staleCache) {
      console.log('Origin timeout/error, serving stale cache');
      return createSuccessResponse(
        staleCache.data,
        'STALE',
        startTime,
        staleCache.etag
      );
    }
    
    // No cache available, return error with more details
    const errorMessage = error instanceof Error && error.message.includes('abort') 
      ? 'Origin timeout (10s)' 
      : 'Origin unavailable';
    return createErrorResponse(errorMessage, 503, startTime);
  }
}

/**
 * Fetch storefront data from origin server
 */
async function fetchStorefrontFromOrigin(
  env: Env,
  body: StorefrontRequestBody,
  cacheKey: string | null,
  staleCache: CachedResponse | null,
  startTime: number,
  ctx: ExecutionContext
): Promise<Response> {
  const originUrl = `${env.ORIGIN_URL}/api/storefront`;
  
  try {
    // Fetch from origin with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (longer for complex operations)
    
    // Forward CF-Access headers if we're calling protected origins
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Cloudflare-Worker/1.0',
    };
    
    // Add CF-Access headers when calling protected origins
    if (env.ORIGIN_URL.includes('tunnel.magicsell.ai') || env.ORIGIN_URL.includes('api.magicsell.ai')) {
      headers['CF-Access-Client-Id'] = '68d1ece1f2c023d9e41478db797fb493.access';
      headers['CF-Access-Client-Secret'] = '26e5b9ba395a2cbc2950a7524b93cfefa95906b9e727303701565a56eb7b7f86';
    }
    
    const originResponse = await fetch(originUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!originResponse.ok) {
      // Origin error - try to serve stale cache if available
      if (staleCache) {
        console.log('Origin error, serving stale cache');
        return createSuccessResponse(
          staleCache.data,
          'STALE',
          startTime,
          staleCache.etag
        );
      }
      throw new Error(`Origin returned ${originResponse.status}`);
    }
    
    // Parse origin response
    const data = await originResponse.json();
    const etag = originResponse.headers.get('etag') || generateEtag(data);
    
    // Only cache non-action responses
    if (cacheKey && !body.actionType) {
      // Cache the response asynchronously
      const cacheData: CachedResponse = {
        data,
        timestamp: Date.now(),
        etag,
      };
      
      // Use waitUntil for non-blocking cache write
      // Shorter TTL for storefront data as cart state changes frequently
      ctx.waitUntil(
        env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 300, // 5 minutes TTL for storefront data
        })
      );
    }
    
    return createSuccessResponse(data, cacheKey ? 'MISS' : 'BYPASS', startTime, etag);
    
  } catch (error) {
    console.error('Origin fetch error:', error);
    console.error('Origin URL was:', originUrl);
    console.error('Request body was:', JSON.stringify(body));
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If origin fails and we have stale cache, serve it
    if (staleCache) {
      console.log('Origin timeout/error, serving stale cache');
      return createSuccessResponse(
        staleCache.data,
        'STALE',
        startTime,
        staleCache.etag
      );
    }
    
    // No cache available, return error with more details
    const errorMessage = error instanceof Error && error.message.includes('abort') 
      ? 'Origin timeout (15s)' 
      : 'Origin unavailable';
    return createErrorResponse(errorMessage, 503, startTime);
  }
}

/**
 * Fetch upsell data from origin server
 */
async function fetchUpsellFromOrigin(
  env: Env,
  body: UpsellRequestBody,
  cacheKey: string,
  staleCache: CachedResponse | null,
  startTime: number,
  ctx: ExecutionContext
): Promise<Response> {
  const originUrl = `${env.ORIGIN_URL}/api/v2/funnel/upsell`;
  
  try {
    // Fetch from origin with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Forward CF-Access headers if we're calling protected origins
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Cloudflare-Worker/1.0',
    };
    
    // Add CF-Access headers when calling protected origins
    if (env.ORIGIN_URL.includes('tunnel.magicsell.ai') || env.ORIGIN_URL.includes('api.magicsell.ai')) {
      headers['CF-Access-Client-Id'] = '68d1ece1f2c023d9e41478db797fb493.access';
      headers['CF-Access-Client-Secret'] = '26e5b9ba395a2cbc2950a7524b93cfefa95906b9e727303701565a56eb7b7f86';
    }
    
    const originResponse = await fetch(originUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!originResponse.ok) {
      // Origin error - try to serve stale cache if available
      if (staleCache) {
        console.log('Origin error, serving stale cache');
        return createSuccessResponse(
          staleCache.data,
          'STALE',
          startTime,
          staleCache.etag
        );
      }
      throw new Error(`Origin returned ${originResponse.status}`);
    }
    
    // Parse origin response
    const data = await originResponse.json();
    const etag = originResponse.headers.get('etag') || generateEtag(data);
    
    // Cache the response asynchronously
    const cacheData: CachedResponse = {
      data,
      timestamp: Date.now(),
      etag,
    };
    
    // Use waitUntil for non-blocking cache write
    // 30 minute TTL for upsell data as it changes less frequently than cart state
    ctx.waitUntil(
      env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 1800, // 30 minutes TTL
      })
    );
    
    return createSuccessResponse(data, 'MISS', startTime, etag);
    
  } catch (error) {
    console.error('Origin fetch error:', error);
    console.error('Origin URL was:', originUrl);
    console.error('Request body was:', JSON.stringify(body));
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If origin fails and we have stale cache, serve it
    if (staleCache) {
      console.log('Origin timeout/error, serving stale cache');
      return createSuccessResponse(
        staleCache.data,
        'STALE',
        startTime,
        staleCache.etag
      );
    }
    
    // No cache available, return error with more details
    const errorMessage = error instanceof Error && error.message.includes('abort') 
      ? 'Origin timeout (10s)' 
      : 'Origin unavailable';
    return createErrorResponse(errorMessage, 503, startTime);
  }
}

/**
 * Create a successful response with proper headers
 */
function createSuccessResponse(
  data: any,
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'BYPASS',
  startTime: number,
  etag?: string
): Response {
  const responseTime = Date.now() - startTime;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Cache': cacheStatus,
    'X-Response-Time': `${responseTime}ms`,
    'X-Powered-By': 'Cloudflare-Worker',
    'Cache-Control': cacheStatus === 'HIT' ? 'public, max-age=60' : 'public, max-age=10',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Client-Id, CF-Access-Client-Secret, cf-access-client-id, cf-access-client-secret, Accept, Accept-Language, Cache-Control, DNT, Origin, Pragma, Priority, Referer, Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, User-Agent',
  });
  
  if (etag) {
    headers.set('ETag', etag);
  }
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}

/**
 * Create an error response
 */
function createErrorResponse(message: string, status: number, startTime: number): Response {
  const responseTime = Date.now() - startTime;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`,
        'X-Powered-By': 'Cloudflare-Worker',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Client-Id, CF-Access-Client-Secret, cf-access-client-id, cf-access-client-secret, Accept, Accept-Language, Cache-Control, DNT, Origin, Pragma, Priority, Referer, Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, User-Agent',
      },
    }
  );
}

/**
 * Fetch recommendations from think.magicsell.ai origin
 */
async function fetchRecommendationsFromOrigin(
  env: Env,
  shop: string,
  productHandle: string,
  cacheKey: string,
  staleCache: CachedResponse | null,
  startTime: number,
  ctx: ExecutionContext
): Promise<Response> {
  // Use THINK_ORIGIN_URL from environment config
  const originUrl = `${env.THINK_ORIGIN_URL}/recommendations/handle/${shop}/${productHandle}`;
  
  try {
    // Fetch from origin with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Cloudflare-Worker/1.0',
    };
    
    const originResponse = await fetch(originUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!originResponse.ok) {
      // Origin error - try to serve stale cache if available
      if (staleCache) {
        console.log('Origin error, serving stale cache');
        return createSuccessResponse(
          staleCache.data,
          'STALE',
          startTime,
          staleCache.etag
        );
      }
      throw new Error(`Origin returned ${originResponse.status}`);
    }
    
    // Parse origin response
    const data = await originResponse.json() as RecommendationsResponse;
    const etag = originResponse.headers.get('etag') || generateEtag(data);
    
    // Cache the response asynchronously
    const cacheData: CachedResponse = {
      data,
      timestamp: Date.now(),
      etag,
    };
    
    // Use waitUntil for non-blocking cache write
    ctx.waitUntil(
      env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 600, // 10 minutes TTL
      })
    );
    
    return createSuccessResponse(data, 'MISS', startTime, etag);
    
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    console.error('Origin URL was:', originUrl);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If origin fails and we have stale cache, serve it
    if (staleCache) {
      console.log('Origin timeout/error, serving stale cache');
      return createSuccessResponse(
        staleCache.data,
        'STALE',
        startTime,
        staleCache.etag
      );
    }
    
    // No cache available, return error with more details
    const errorMessage = error instanceof Error && error.message.includes('abort') 
      ? 'Origin timeout (10s)' 
      : 'Origin unavailable';
    return createErrorResponse(errorMessage, 503, startTime);
  }
}

/**
 * Generate a simple ETag for cache validation
 */
function generateEtag(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}