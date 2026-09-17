/**
 * Environment configuration and validation module for Skillo AI frontend.
 * Provides safe defaults for development and explicit resolution for production.
 */

export interface AppConfig {
  backendUrl: string;
  apiBaseUrl: string;
  isProduction: boolean;
  isBrowser: boolean;
}

/**
 * Normalizes a URL by removing trailing slashes and redundant whitespace.
 */
export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Resolves the target backend URL for server-side proxy rewrites and SSR.
 */
export function getBackendTargetUrl(): string {
  const envBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envBackend && envBackend.trim()) {
    return normalizeUrl(envBackend).replace(/\/api\/v1$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    // Production default target when deployed on Vercel
    return 'https://skillo-zawx.vercel.app';
  }

  return 'http://127.0.0.1:8000';
}

/**
 * Resolves the client-facing API Base URL.
 * - In browser: routes through same-origin relative proxy '/api/v1' unless explicit NEXT_PUBLIC_API_URL is set
 * - On server: routes directly to target backend /api/v1
 */
export function getApiBaseUrl(): string {
  const explicitPublicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (explicitPublicUrl && explicitPublicUrl.trim()) {
    const clean = normalizeUrl(explicitPublicUrl);
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }

  if (typeof window !== 'undefined') {
    // Browser environment: relative path routes through Next.js proxy (same-origin, 0 CORS overhead)
    return '/api/v1';
  }

  const backend = getBackendTargetUrl();
  return `${backend}/api/v1`;
}

export const config: AppConfig = {
  get backendUrl() {
    return getBackendTargetUrl();
  },
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  isProduction: process.env.NODE_ENV === 'production',
  isBrowser: typeof window !== 'undefined',
};
