import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { getAuthToken, clearAuthToken } from "./nativeAuth";
import { toast } from "@/hooks/use-toast";

export const isNativePlatform = () => Capacitor.getPlatform() !== 'web';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';

export function getApiUrl(path: string): string {
  const isNative = isNativePlatform();
  const baseUrl = isNative ? "https://loretta-care.replit.app" : "";
  return `${baseUrl}${path}`;
}

// Comprehensive iOS/Network error code mapping
const ERROR_CODES: Record<string, string> = {
  // NSURLErrorDomain codes
  '-1001': 'TIMEOUT: Request timed out (NSURLErrorTimedOut)',
  '-1003': 'DNS_FAILED: Cannot find host (NSURLErrorCannotFindHost)',
  '-1004': 'CONNECT_FAILED: Cannot connect to host (NSURLErrorCannotConnectToHost)',
  '-1009': 'OFFLINE: No internet connection (NSURLErrorNotConnectedToInternet)',
  '-1011': 'BAD_RESPONSE: Bad server response (NSURLErrorBadServerResponse)',
  '-1012': 'AUTH_CANCELLED: User cancelled authentication (NSURLErrorUserCancelledAuthentication)',
  '-1022': 'ATS_BLOCKED: App Transport Security blocked request (NSURLErrorAppTransportSecurityRequiresSecureConnection)',
  '-1200': 'SSL_HANDSHAKE: Secure connection failed (NSURLErrorSecureConnectionFailed)',
  '-1201': 'SSL_CERT_EXPIRED: Server certificate expired (NSURLErrorServerCertificateHasBadDate)',
  '-1202': 'SSL_CERT_UNTRUSTED: Server certificate untrusted (NSURLErrorServerCertificateUntrusted)',
  '-1203': 'SSL_CERT_WRONG_HOST: Server certificate wrong host (NSURLErrorServerCertificateHasUnknownRoot)',
  '-1204': 'SSL_CERT_NOT_YET_VALID: Server certificate not yet valid (NSURLErrorServerCertificateNotYetValid)',
  '-1205': 'SSL_CLIENT_CERT_REJECTED: Client certificate rejected (NSURLErrorClientCertificateRejected)',
  '-1206': 'SSL_CLIENT_CERT_REQUIRED: Client certificate required (NSURLErrorClientCertificateRequired)',
  '-999': 'CANCELLED: Request cancelled (NSURLErrorCancelled)',
  '-1000': 'BAD_URL: Bad URL (NSURLErrorBadURL)',
  '-1002': 'UNSUPPORTED_URL: Unsupported URL (NSURLErrorUnsupportedURL)',
  '-1005': 'CONNECTION_LOST: Network connection lost (NSURLErrorNetworkConnectionLost)',
  '-1006': 'DNS_LOOKUP_FAILED: DNS lookup failed (NSURLErrorDNSLookupFailed)',
  '-1007': 'TOO_MANY_REDIRECTS: Too many redirects (NSURLErrorHTTPTooManyRedirects)',
  '-1008': 'RESOURCE_UNAVAILABLE: Resource unavailable (NSURLErrorResourceUnavailable)',
  '-1010': 'REDIRECTED_ELSEWHERE: Redirected to non-existent location (NSURLErrorRedirectToNonExistentLocation)',
  '-1013': 'AUTH_REQUIRED: Authentication required (NSURLErrorUserAuthenticationRequired)',
  '-1014': 'ZERO_BYTE_RESOURCE: Zero byte resource (NSURLErrorZeroByteResource)',
  '-1015': 'CANNOT_DECODE_RAW: Cannot decode raw data (NSURLErrorCannotDecodeRawData)',
  '-1016': 'CANNOT_DECODE_CONTENT: Cannot decode content data (NSURLErrorCannotDecodeContentData)',
  '-1017': 'CANNOT_PARSE_RESPONSE: Cannot parse response (NSURLErrorCannotParseResponse)',
  '-1100': 'FILE_NOT_FOUND: File does not exist (NSURLErrorFileDoesNotExist)',
  
  // CFNetwork/SSL error codes
  '-9800': 'SSL_PROTOCOL_ERROR: SSL protocol error (errSSLProtocol)',
  '-9801': 'SSL_NEGOTIATION_FAILED: SSL negotiation failed (errSSLNegotiation)',
  '-9802': 'SSL_FATAL_ALERT: Fatal SSL alert (errSSLFatalAlert)',
  '-9803': 'SSL_HANDSHAKE_FAIL: SSL handshake failure (errSSLHandshakeFail)',
  '-9804': 'SSL_MODULE_ATTACH: SSL module attach failure (errSSLModuleAttach)',
  '-9805': 'SSL_UNKNOWN_ROOT_CERT: Unknown root certificate (errSSLUnknownRootCert)',
  '-9806': 'SSL_NO_ROOT_CERT: No root certificate (errSSLNoRootCert)',
  '-9807': 'SSL_CERT_EXPIRED: Certificate expired (errSSLCertExpired)',
  '-9808': 'SSL_CERT_NOT_YET_VALID: Certificate not yet valid (errSSLCertNotYetValid)',
  '-9809': 'SSL_CLOSED_GRACEFUL: Connection closed gracefully (errSSLClosedGraceful)',
  '-9810': 'SSL_CLOSED_ABORT: Connection closed abnormally (errSSLClosedAbort)',
  '-9811': 'SSL_XCER_CHAIN_INVALID: Invalid certificate chain (errSSLXCertChainInvalid)',
  '-9812': 'SSL_BAD_CERT: Bad certificate (errSSLBadCert)',
  '-9813': 'SSL_CRYPTO_ERROR: Crypto error (errSSLCrypto)',
  '-9814': 'SSL_INTERNAL_ERROR: Internal SSL error (errSSLInternal)',
  '-9815': 'SSL_CLOSED_NO_NOTIFY: Connection closed without notify (errSSLClosedNoNotify)',
  '-9816': 'SSL_PEER_ACCESS_DENIED: Peer access denied (errSSLPeerAccessDenied)',
  '-9830': 'SSL_HOST_MISMATCH: Host name mismatch (errSSLHostNameMismatch)',
  '-9831': 'SSL_WEAK_PEER_KEY: Peer has weak ephemeral DH key (errSSLPeerHandshakeFail)',
  
  // WKWebView error codes (WKErrorDomain)
  '1': 'WK_UNKNOWN: Unknown WKWebView error',
  '2': 'WK_WEB_CONTENT_PROCESS_TERMINATED: Web content process terminated',
  '3': 'WK_WEB_VIEW_INVALIDATED: WebView invalidated',
  '4': 'WK_JAVA_SCRIPT_EXCEPTION_OCCURRED: JavaScript exception occurred',
  '5': 'WK_JAVA_SCRIPT_RESULT_TYPE_IS_UNSUPPORTED: JavaScript result type unsupported',
  '102': 'WK_FRAME_LOAD_INTERRUPTED_BY_POLICY_CHANGE: Frame load interrupted by policy change',
  
  // Common string patterns
  'Load failed': 'LOAD_FAILED: WKWebView failed to load - likely CORS, ATS, or network issue',
  'Failed to fetch': 'FETCH_FAILED: Fetch API failed - network or CORS issue',
  'TypeError': 'TYPE_ERROR: Network request failed at JavaScript level',
  'NetworkError': 'NETWORK_ERROR: Generic network error',
  'AbortError': 'ABORT_ERROR: Request was aborted',
  'CORS': 'CORS_ERROR: Cross-Origin Request Blocked',
};

// HTTP status code descriptions
const HTTP_STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST: Server rejected the request',
  401: 'UNAUTHORIZED: Authentication required or token invalid',
  403: 'FORBIDDEN: Access denied - check permissions',
  404: 'NOT_FOUND: Endpoint does not exist',
  405: 'METHOD_NOT_ALLOWED: HTTP method not supported',
  408: 'REQUEST_TIMEOUT: Server timed out waiting for request',
  409: 'CONFLICT: Request conflicts with current state',
  422: 'UNPROCESSABLE_ENTITY: Validation failed',
  429: 'TOO_MANY_REQUESTS: Rate limited',
  500: 'INTERNAL_SERVER_ERROR: Server crashed',
  502: 'BAD_GATEWAY: Upstream server error',
  503: 'SERVICE_UNAVAILABLE: Server temporarily down',
  504: 'GATEWAY_TIMEOUT: Upstream server timeout',
};

function diagnoseNetworkError(error: any): string {
  const errorName = error?.name || '';
  const errorMessage = error?.message || '';
  const errorCode = error?.code;
  const underlyingError = error?.cause || error?.underlyingError;
  
  console.error('[NetworkDiag] Full error object:', JSON.stringify({
    name: errorName,
    message: errorMessage,
    code: errorCode,
    stack: error?.stack?.substring(0, 500),
    cause: underlyingError ? {
      name: underlyingError?.name,
      message: underlyingError?.message,
      code: underlyingError?.code
    } : undefined
  }, null, 2));
  
  // Check for error code in our mapping
  if (errorCode && ERROR_CODES[String(errorCode)]) {
    return `[${ERROR_CODES[String(errorCode)]}] Code: ${errorCode}`;
  }
  
  // Check for error message patterns
  for (const [pattern, description] of Object.entries(ERROR_CODES)) {
    if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
      return `[${description}] ${errorMessage}`;
    }
  }
  
  // Extract any numeric code from the error message
  const codeMatch = errorMessage.match(/-?\d{3,5}/);
  if (codeMatch) {
    const extractedCode = codeMatch[0];
    if (ERROR_CODES[extractedCode]) {
      return `[${ERROR_CODES[extractedCode]}] ${errorMessage}`;
    }
    return `[UNKNOWN_CODE:${extractedCode}] ${errorMessage}`;
  }
  
  // Fallback
  return `[UNDIAGNOSED] name=${errorName} message=${errorMessage} code=${errorCode}`;
}

function diagnoseHttpError(status: number): string {
  return HTTP_STATUS_CODES[status] || `HTTP_${status}: Unknown HTTP error`;
}

// Native HTTP request using CapacitorHttp (bypasses WKWebView fetch/HTTP3 issues)
async function nativeHttpRequest(
  url: string, 
  options: { 
    method?: string; 
    headers?: Record<string, string>; 
    body?: string;
  } = {}
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  const method = options.method || 'GET';
  console.log('[nativeHttp] Request:', method, url);
  
  const response = await CapacitorHttp.request({
    url,
    method,
    headers: options.headers || {},
    data: options.body ? JSON.parse(options.body) : undefined,
  });
  
  console.log('[nativeHttp] Response status:', response.status);
  return {
    status: response.status,
    data: response.data,
    headers: response.headers,
  };
}

// Native HTTP with retry for transient errors (QUIC/HTTP3 failures)
async function nativeHttpWithRetry(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
  maxRetries: number = 2,
  label: string = 'nativeHttp'
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await nativeHttpRequest(url, options);
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = Math.min(500 * Math.pow(2, attempt), 2000);
        console.warn(`[${label}] Retry ${attempt + 1}/${maxRetries} after ${delay}ms - ${error?.message || error}`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        const diagnosis = diagnoseNetworkError(error);
        console.error(`[${label}] FAILURE:`, diagnosis);
        throw new Error(`Network Error: ${diagnosis}`);
      }
    }
  }
  throw lastError;
}

// Store the original fetch for use in our wrapper
const originalFetch = window.fetch.bind(window);

const RETRYABLE_ERROR_CODES = new Set([
  'NSURLErrorDomain',
  '-1005',
  '-1001',
  '-1004',
  '-1009',
]);

function isRetryableError(error: any): boolean {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return (
    RETRYABLE_ERROR_CODES.has(code) ||
    message.includes('network connection was lost') ||
    message.includes('CONNECTION_LOST') ||
    message.includes('timed out') ||
    message.includes('Could not connect') ||
    message.includes('Socket is not connected')
  );
}

// Unified fetch wrapper that includes auth token for native apps
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (isNativePlatform()) {
    const token = await getAuthToken();
    if (token) {
      headers["X-Auth-Token"] = token;
    }
    
    // Use CapacitorHttp for both iOS and Android (native URLSession/OkHttp)
    const platform = isIOS() ? 'iOS' : 'Android';
    console.log(`[authenticatedFetch] ${platform} - using CapacitorHttp`);
    try {
      const nativeResponse = await nativeHttpWithRetry(fullUrl, {
        method,
        headers,
        body: options.body ? (options.body as string) : undefined,
      }, 2, `authenticatedFetch-${platform}`);
      
      console.log(`[authenticatedFetch] ${platform} response status:`, nativeResponse.status);
      
      // Handle 401 on native
      if (nativeResponse.status === 401) {
        const hadToken = await getAuthToken();
        if (hadToken) {
          console.log('[authenticatedFetch] 401 received - clearing invalid token');
          await clearAuthToken();
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
        }
      }
      
      const fakeResponse = new Response(JSON.stringify(nativeResponse.data), {
        status: nativeResponse.status,
        headers: new Headers(nativeResponse.headers),
      });
      
      return fakeResponse;
    } catch (error: any) {
      const diagnosis = diagnoseNetworkError(error);
      console.error(`[authenticatedFetch] ${platform} FAILURE:`, diagnosis);
      throw new Error(`Network Error: ${diagnosis}`);
    }
  }
  
  // Web platform uses regular fetch
  try {
    console.log('[authenticatedFetch] Requesting:', fullUrl);
    console.log('[authenticatedFetch] Platform:', Capacitor.getPlatform());
    console.log('[authenticatedFetch] Headers:', JSON.stringify(headers));
    const res = await originalFetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });
    console.log('[authenticatedFetch] Response status:', res.status);
    if (!res.ok) {
      console.warn('[authenticatedFetch] HTTP Error:', diagnoseHttpError(res.status));
    }
    return res;
  } catch (error: any) {
    const diagnosis = diagnoseNetworkError(error);
    console.error('[authenticatedFetch] NETWORK FAILURE:', diagnosis);
    throw new Error(`Network Error: ${diagnosis}`);
  }
}

// Global fetch interceptor - safety net for any missed direct fetch() calls
// This patches window.fetch to automatically use CapacitorHttp for API calls on native platforms
function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only intercept API calls (starting with /api or the production URL)
    const isApiCall = url.startsWith('/api') || 
                      url.includes('/api/') || 
                      url.includes('loretta-care.replit.app/api');
    
    if (isApiCall && isNativePlatform()) {
      const existingHeaders = init?.headers as Record<string, string> | undefined;
      const headers: Record<string, string> = { ...(existingHeaders || {}) };
      
      // Add auth token if not present
      if (!headers['X-Auth-Token'] && !headers['x-auth-token']) {
        const token = await getAuthToken();
        if (token) {
          headers['X-Auth-Token'] = token;
        }
      }
      
      // Fix URL if it's a relative /api path
      const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
      const method = init?.method || 'GET';
      
      // Use CapacitorHttp for both iOS and Android with retry
      const platform = isIOS() ? 'iOS' : 'Android';
      console.log(`[FetchInterceptor] ${platform} - using CapacitorHttp:`, url);
      try {
        const response = await nativeHttpWithRetry(fullUrl, {
          method,
          headers,
          body: init?.body ? (init.body as string) : undefined,
        }, 2, `FetchInterceptor-${platform}`);
        
        console.log(`[FetchInterceptor] ${platform} response status:`, response.status);
        
        return new Response(JSON.stringify(response.data), {
          status: response.status,
          headers: new Headers(response.headers),
        });
      } catch (error: any) {
        console.error(`[FetchInterceptor] ${platform} request failed:`, error);
        throw error;
      }
    }
    
    // For non-API calls or web platform, use original fetch
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
      // Preserve the full JSON in the error message so handlers can parse additional fields
      // (e.g., featuresProvided, featuresRequired for risk score calculation errors)
      errorMessage = text;
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
  
  // Use native HTTP for native platforms
  if (isNativePlatform()) {
    // Use CapacitorHttp for both iOS and Android with retry
    const platform = isIOS() ? 'iOS' : 'Android';
    console.log(`[apiRequest] ${platform} - using CapacitorHttp`);
    const nativeResponse = await nativeHttpWithRetry(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    }, 2, `apiRequest-${platform}`);
    
    // Handle 401 on native
    if (nativeResponse.status === 401) {
      const hadToken = await getAuthToken();
      if (hadToken) {
        console.log('[apiRequest] 401 received with stored token - clearing invalid token');
        await clearAuthToken();
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
      }
    }
    
    const fakeResponse = new Response(JSON.stringify(nativeResponse.data), {
      status: nativeResponse.status,
      headers: new Headers(nativeResponse.headers),
    });
    
    if (!fakeResponse.ok) {
      console.warn('[apiRequest] HTTP Error:', diagnoseHttpError(nativeResponse.status));
      const errorText = typeof nativeResponse.data === 'string' 
        ? nativeResponse.data 
        : JSON.stringify(nativeResponse.data);
      throw new Error(`${nativeResponse.status}: ${errorText}`);
    }
    
    return fakeResponse;
  }
  
  // Web platform uses regular fetch
  try {
    console.log('[apiRequest] Requesting:', method, fullUrl);
    console.log('[apiRequest] Platform:', Capacitor.getPlatform());
    console.log('[apiRequest] Headers:', JSON.stringify(headers));
    if (data) {
      console.log('[apiRequest] Body:', JSON.stringify(data).substring(0, 200));
    }
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log('[apiRequest] Response status:', res.status);
    if (!res.ok) {
      console.warn('[apiRequest] HTTP Error:', diagnoseHttpError(res.status));
    }
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // Check if this is already a diagnosed error (from throwIfResNotOk) or a JSON error response
    if (error.message?.startsWith('Network Error:') || error.message?.startsWith('[') || error.message?.startsWith('{')) {
      throw error;
    }
    const diagnosis = diagnoseNetworkError(error);
    console.error('[apiRequest] NETWORK FAILURE:', diagnosis);
    throw new Error(`Network Error: ${diagnosis}`);
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
    
    // Use CapacitorHttp for both iOS and Android with retry
    if (isNativePlatform()) {
      const platform = isIOS() ? 'iOS' : 'Android';
      console.log(`[getQueryFn] ${platform} - using CapacitorHttp`);
      const nativeResponse = await nativeHttpWithRetry(url, {
        method: 'GET',
        headers,
      }, 2, `getQueryFn-${platform}`);
      
      console.log(`[getQueryFn] ${platform} response status:`, nativeResponse.status);
      
      if (nativeResponse.status === 401) {
        const hadToken = await getAuthToken();
        if (hadToken) {
          console.log('[getQueryFn] 401 received - clearing invalid token');
          await clearAuthToken();
          toast({
            title: "Session expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
        }
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('401: Unauthorized');
      }
      
      if (nativeResponse.status >= 400) {
        console.warn('[getQueryFn] HTTP Error:', diagnoseHttpError(nativeResponse.status));
        throw new Error(`${nativeResponse.status}: ${JSON.stringify(nativeResponse.data)}`);
      }
      
      return nativeResponse.data;
    }
    
    // Web platform uses regular fetch
    try {
      console.log('[getQueryFn] Requesting:', url);
      console.log('[getQueryFn] Platform:', Capacitor.getPlatform());
      console.log('[getQueryFn] Headers:', JSON.stringify(headers));
      const res = await fetch(url, {
        credentials: "include",
        headers,
      });

      console.log('[getQueryFn] Response status:', res.status);
      if (!res.ok && res.status !== 401) {
        console.warn('[getQueryFn] HTTP Error:', diagnoseHttpError(res.status));
      }
      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      // Check if this is already a diagnosed error
      if (error.message?.startsWith('Network Error:') || error.message?.startsWith('[')) {
        throw error;
      }
      const diagnosis = diagnoseNetworkError(error);
      console.error('[getQueryFn] NETWORK FAILURE:', diagnosis);
      throw new Error(`Network Error: ${diagnosis}`);
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
