import { describe, it, expect, beforeAll, vi } from 'vitest';
import worker from './index';

// Mock KV namespace
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

// Mock execution context
const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

// Mock environment
const mockEnv = {
  CACHE: mockKV as any,
  ORIGIN_URL: 'https://test-origin.com',
  ENVIRONMENT: 'test',
};

describe('Recommendation Product Worker', () => {
  beforeAll(() => {
    // Mock fetch for origin requests
    global.fetch = vi.fn();
  });

  describe('Request Validation', () => {
    it('should reject non-GET requests for product endpoint', async () => {
      const request = new Request('https://test.com/api/v2/recommendation/product', {
        method: 'POST',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(405);
      const body = await response.json();
      expect(body.error).toBe('Method not allowed');
    });

    it('should reject requests with missing required fields', async () => {
      const request = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it('should accept valid requests', async () => {
      // Mock cache miss
      mockKV.get.mockResolvedValueOnce(null);

      // Mock successful origin response
      (global.fetch as any).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              products: [],
              styles: [],
              config: {},
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const request = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Cache')).toBe('MISS');
    });
  });

  describe('Caching Behavior', () => {
    it('should return cached response when available', async () => {
      const cachedData = {
        data: {
          success: true,
          data: {
            products: ['cached-product'],
            styles: [],
            config: {},
          },
        },
        timestamp: Date.now() - 1000, // 1 second ago (not stale)
      };

      mockKV.get.mockResolvedValueOnce(cachedData);

      const request = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Cache')).toBe('HIT');
      const body = await response.json();
      expect(body.data.products).toContain('cached-product');
    });

    it('should fetch from origin when cache is stale', async () => {
      const staleData = {
        data: {
          success: true,
          data: {
            products: ['stale-product'],
            styles: [],
            config: {},
          },
        },
        timestamp: Date.now() - 3700000, // Over 1 hour ago (stale)
      };

      mockKV.get.mockResolvedValueOnce(staleData);
      
      // Mock successful origin response
      (global.fetch as any).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              products: ['fresh-product'],
              styles: [],
              config: {},
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const request = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Cache')).toBe('MISS');
      expect(mockCtx.waitUntil).toHaveBeenCalled(); // Cache write
    });

    it('should serve stale cache when origin fails', async () => {
      const staleData = {
        data: {
          success: true,
          data: {
            products: ['stale-product'],
            styles: [],
            config: {},
          },
        },
        timestamp: Date.now() - 3700000, // Stale
        etag: '"stale-etag"',
      };

      mockKV.get.mockResolvedValueOnce(staleData);
      
      // Mock origin failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Origin timeout'));

      const request = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Cache')).toBe('STALE');
      const body = await response.json();
      expect(body.data.products).toContain('stale-product');
    });
  });

  describe('Response Headers', () => {
    it('should include all required headers', async () => {
      mockKV.get.mockResolvedValueOnce(null);
      
      (global.fetch as any).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { products: [], styles: [], config: {} },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const request = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Powered-By')).toBe('Cloudflare-Worker');
      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for identical requests', async () => {
      mockKV.get.mockResolvedValue(null);
      (global.fetch as any).mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
      );

      const request1 = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart&excludeProductIds=3,2,1', {
        method: 'GET',
      });

      const request2 = new Request('https://test.com/api/v2/recommendation/product?shop=test.myshopify.com&productId=123456&type=cart&excludeProductIds=1,2,3', {
        method: 'GET',
      });

      await worker.fetch(request1, mockEnv, mockCtx);
      await worker.fetch(request2, mockEnv, mockCtx);

      // Both requests should use the same cache key
      const calls = mockKV.get.mock.calls;
      expect(calls[0][0]).toBe(calls[1][0]); // Same cache key
    });
  });
});