/// <reference types="@cloudflare/workers-types" />

declare global {
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: {
      expirationTtl?: number;
      expiration?: number;
      metadata?: any;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
      prefix?: string;
      limit?: number;
      cursor?: string;
    }): Promise<{
      keys: { name: string; expiration?: number; metadata?: any }[];
      list_complete: boolean;
      cursor?: string;
    }>;
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
}

export {};