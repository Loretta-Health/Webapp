import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { getAuthToken } from "./nativeAuth";

export const isNativePlatform = () => Capacitor.getPlatform() !== 'web';

export function getApiUrl(path: string): string {
  const isNative = isNativePlatform();
  const baseUrl = isNative ? "https://loretta-care.replit.app" : "";
  return `${baseUrl}${path}`;
}

// Store the original fetch for use in our wrapper
const originalFetch = window.fetch.bind(window);

// Unified fetch wrapper that includes auth token for native apps
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (isNativePlatform()) {
    const token = await getAuthToken();
    if (token) {
      headers["X-Auth-Token"] = token;
    }
  }
  
  try {
    const res = await originalFetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });
    return res;
  } catch (error: any) {
    if (error.message === 'Load failed' || error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    throw error;
  }
}

// Global fetch interceptor - safety net for any missed direct fetch() calls
// This patches window.fetch to automatically add auth tokens for API calls on native platforms
function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only intercept API calls (starting with /api or the production URL)
    const isApiCall = url.startsWith('/api') || 
                      url.includes('/api/') || 
                      url.includes('loretta-care.replit.app/api');
    
    if (isApiCall && isNativePlatform()) {
      // Check if X-Auth-Token is already present
      const existingHeaders = init?.headers as Record<string, string> | undefined;
      const hasAuthToken = existingHeaders?.['X-Auth-Token'] || existingHeaders?.['x-auth-token'];
      
      if (!hasAuthToken) {
        // Add the auth token automatically
        const token = await getAuthToken();
        if (token) {
          const headers: Record<string, string> = {
            ...(existingHeaders || {}),
            'X-Auth-Token': token,
          };
          
          // Also fix the URL if it's a relative /api path
          const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
          
          return originalFetch(fullUrl, {
            ...init,
            headers,
            credentials: 'include',
          });
        }
      }
    }
    
    // For non-API calls or when token is already present, use original fetch
    return originalFetch(input, init);
  };
}

// Initialize the interceptor immediately
setupFetchInterceptor();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let errorMessage = text;
    
    try {
      const jsonError = JSON.parse(text);
      if (jsonError.message) {
        errorMessage = jsonError.message;
      }
    } catch {
      errorMessage = text || res.statusText || 'An error occurred';
    }
    
    throw new Error(errorMessage);
  }
}

async function getRequestHeaders(includeContentType: boolean = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  if (isNativePlatform()) {
    const token = await getAuthToken();
    if (token) {
      headers["X-Auth-Token"] = token;
    }
  }
  
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = getApiUrl(url);
  const headers = await getRequestHeaders(!!data);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    if (error.message === 'Load failed' || error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = getApiUrl(queryKey.join("/") as string);
    const headers = await getRequestHeaders(false);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      if (error.message === 'Load failed' || error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
