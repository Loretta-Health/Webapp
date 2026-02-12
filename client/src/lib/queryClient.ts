import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import { getAuthToken, clearAuthToken } from "./nativeAuth";
import { toast } from "@/hooks/use-toast";

interface HttpBridgeResult {
  status: number;
  data: string;
  headers: Record<string, string>;
  elapsedMs?: number;
  url?: string;
}

interface HttpBridgeErrorData {
  errorCode: string;
  domain?: string;
  code?: number;
  detail?: string;
  localizedDescription?: string;
  elapsedMs?: number;
  url?: string;
  method?: string;
  isCancellation?: boolean;
  isTimeout?: boolean;
  isOffline?: boolean;
  isSSL?: boolean;
  isDNS?: boolean;
  isProtocolViolation?: boolean;
  isConnectionReset?: boolean;
  recoverable?: boolean;
  retryAfterMs?: number;
  underlyingErrors?: Array<{
    depth: number;
    errorCode: string;
    domain: string;
    code: number;
    detail: string;
    localizedDescription: string;
  }>;
  iosVersion?: string;
  deviceModel?: string;
}

interface HttpBridgePlugin {
  request(options: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<HttpBridgeResult>;
}

const HttpBridge = registerPlugin<HttpBridgePlugin>('HttpBridge');

export const isNativePlatform = () => Capacitor.getPlatform() !== 'web';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';

export function getApiUrl(path: string): string {
  const isNative = isNativePlatform();
  const baseUrl = isNative ? "https://loretta-care.replit.app" : "";
  return `${baseUrl}${path}`;
}

const NSURL_ERROR_CODES: Record<number, { code: string; desc: string; recoverable: boolean; retryMs: number }> = {
  [-999]:  { code: 'NSURL_CANCELLED', desc: 'Request was cancelled by the system or user', recoverable: false, retryMs: 0 },
  [-1000]: { code: 'NSURL_BAD_URL', desc: 'The URL string could not be parsed into a valid URL', recoverable: false, retryMs: 0 },
  [-1001]: { code: 'NSURL_TIMED_OUT', desc: 'The request exceeded the configured timeout interval', recoverable: true, retryMs: 2000 },
  [-1002]: { code: 'NSURL_UNSUPPORTED_URL', desc: 'The URL scheme is not supported by the system', recoverable: false, retryMs: 0 },
  [-1003]: { code: 'NSURL_CANNOT_FIND_HOST', desc: 'DNS resolution failed - the hostname could not be resolved to an IP address', recoverable: true, retryMs: 3000 },
  [-1004]: { code: 'NSURL_CANNOT_CONNECT_TO_HOST', desc: 'TCP connection to the server IP address was refused or unreachable', recoverable: true, retryMs: 2000 },
  [-1005]: { code: 'NSURL_CONNECTION_LOST', desc: 'An established TCP connection was dropped mid-transfer (ECONNRESET/EPIPE)', recoverable: true, retryMs: 500 },
  [-1006]: { code: 'NSURL_DNS_LOOKUP_FAILED', desc: 'DNS query returned an error or NXDOMAIN response', recoverable: true, retryMs: 3000 },
  [-1007]: { code: 'NSURL_TOO_MANY_REDIRECTS', desc: 'The server redirected more than the maximum allowed number of times', recoverable: false, retryMs: 0 },
  [-1008]: { code: 'NSURL_RESOURCE_UNAVAILABLE', desc: 'The requested resource is no longer available on the server', recoverable: false, retryMs: 0 },
  [-1009]: { code: 'NSURL_NOT_CONNECTED_TO_INTERNET', desc: 'The device has no active network interface (WiFi/cellular both off)', recoverable: false, retryMs: 0 },
  [-1010]: { code: 'NSURL_REDIRECT_TO_NONEXISTENT', desc: 'The server redirected to a URL that does not exist', recoverable: false, retryMs: 0 },
  [-1011]: { code: 'NSURL_BAD_SERVER_RESPONSE', desc: 'The server returned a response that could not be interpreted as valid HTTP', recoverable: true, retryMs: 1000 },
  [-1012]: { code: 'NSURL_USER_CANCELLED_AUTH', desc: 'The user cancelled an authentication challenge dialog', recoverable: false, retryMs: 0 },
  [-1013]: { code: 'NSURL_USER_AUTH_REQUIRED', desc: 'The server requires authentication credentials that were not provided', recoverable: false, retryMs: 0 },
  [-1014]: { code: 'NSURL_ZERO_BYTE_RESOURCE', desc: 'The server responded with a Content-Length of 0 or empty body where data was expected', recoverable: true, retryMs: 1000 },
  [-1015]: { code: 'NSURL_CANNOT_DECODE_RAW_DATA', desc: 'The raw response data could not be decoded with the expected content encoding', recoverable: false, retryMs: 0 },
  [-1016]: { code: 'NSURL_CANNOT_DECODE_CONTENT', desc: 'The response content could not be decoded (charset/encoding mismatch)', recoverable: false, retryMs: 0 },
  [-1017]: { code: 'NSURL_CANNOT_PARSE_RESPONSE', desc: 'HTTP response parsing failed - likely HTTP/2 HEADERS frame corruption or QUIC protocol violation after alt-svc upgrade', recoverable: true, retryMs: 1000 },
  [-1018]: { code: 'NSURL_INTERNATIONAL_ROAMING_OFF', desc: 'International data roaming is disabled in device settings', recoverable: false, retryMs: 0 },
  [-1019]: { code: 'NSURL_CALL_IS_ACTIVE', desc: 'A phone call is active and the carrier does not support simultaneous data', recoverable: false, retryMs: 0 },
  [-1020]: { code: 'NSURL_DATA_NOT_ALLOWED', desc: 'Cellular data is disabled in device settings or restricted by MDM policy', recoverable: false, retryMs: 0 },
  [-1021]: { code: 'NSURL_REQUEST_BODY_STREAM_EXHAUSTED', desc: 'The request body input stream was fully consumed before the upload completed', recoverable: false, retryMs: 0 },
  [-1022]: { code: 'NSURL_ATS_REQUIRES_SECURE', desc: 'App Transport Security policy blocked this request because it uses plain HTTP instead of HTTPS', recoverable: false, retryMs: 0 },
  [-1100]: { code: 'NSURL_FILE_DOES_NOT_EXIST', desc: 'The local file referenced by the URL does not exist on disk', recoverable: false, retryMs: 0 },
  [-1101]: { code: 'NSURL_FILE_IS_DIRECTORY', desc: 'The path points to a directory, not a file', recoverable: false, retryMs: 0 },
  [-1102]: { code: 'NSURL_NO_PERMISSIONS_TO_READ', desc: 'The app does not have read permissions for the requested file', recoverable: false, retryMs: 0 },
  [-1103]: { code: 'NSURL_DATA_LENGTH_EXCEEDS_MAX', desc: 'The response data exceeds the maximum allowed size', recoverable: false, retryMs: 0 },
  [-1104]: { code: 'NSURL_FILE_OUTSIDE_SAFE_AREA', desc: 'The file URL points outside the app sandbox', recoverable: false, retryMs: 0 },
  [-1200]: { code: 'NSURL_SECURE_CONNECTION_FAILED', desc: 'TLS handshake failed - could be protocol mismatch, cipher suite incompatibility, or ATS violation', recoverable: true, retryMs: 2000 },
  [-1201]: { code: 'NSURL_SERVER_CERT_BAD_DATE', desc: 'The server TLS certificate has expired or its notBefore date is in the future', recoverable: false, retryMs: 0 },
  [-1202]: { code: 'NSURL_SERVER_CERT_UNTRUSTED', desc: 'The server TLS certificate was signed by a CA not in the iOS trust store', recoverable: false, retryMs: 0 },
  [-1203]: { code: 'NSURL_SERVER_CERT_UNKNOWN_ROOT', desc: 'The root CA of the server certificate chain is not recognized by iOS', recoverable: false, retryMs: 0 },
  [-1204]: { code: 'NSURL_SERVER_CERT_NOT_YET_VALID', desc: 'The server TLS certificate notBefore date has not yet been reached', recoverable: false, retryMs: 0 },
  [-1205]: { code: 'NSURL_CLIENT_CERT_REJECTED', desc: 'The server rejected the client TLS certificate during mutual TLS authentication', recoverable: false, retryMs: 0 },
  [-1206]: { code: 'NSURL_CLIENT_CERT_REQUIRED', desc: 'The server requires a client TLS certificate (mutual TLS) but none was provided', recoverable: false, retryMs: 0 },
  [-1207]: { code: 'NSURL_CANNOT_LOAD_FROM_NETWORK', desc: 'The resource must be loaded from cache but no cached version exists', recoverable: false, retryMs: 0 },
  [-2000]: { code: 'NSURL_CANNOT_CREATE_FILE', desc: 'Failed to create the destination file for a download task', recoverable: false, retryMs: 0 },
  [-2001]: { code: 'NSURL_CANNOT_OPEN_FILE', desc: 'Failed to open the destination file for writing', recoverable: false, retryMs: 0 },
  [-2002]: { code: 'NSURL_CANNOT_CLOSE_FILE', desc: 'Failed to close the file handle after writing', recoverable: false, retryMs: 0 },
  [-2003]: { code: 'NSURL_CANNOT_WRITE_TO_FILE', desc: 'Write to the destination file failed (disk full or I/O error)', recoverable: false, retryMs: 0 },
  [-2004]: { code: 'NSURL_CANNOT_REMOVE_FILE', desc: 'Failed to remove an existing file before downloading replacement', recoverable: false, retryMs: 0 },
  [-2005]: { code: 'NSURL_CANNOT_MOVE_FILE', desc: 'Failed to move the downloaded temp file to the final destination', recoverable: false, retryMs: 0 },
  [-2006]: { code: 'NSURL_DOWNLOAD_DECODE_FAILED_MID', desc: 'Content decoding (gzip/brotli) failed partway through the download', recoverable: true, retryMs: 1000 },
  [-2007]: { code: 'NSURL_DOWNLOAD_DECODE_FAILED_END', desc: 'Content decoding (gzip/brotli) produced incomplete data at end of download', recoverable: true, retryMs: 1000 },
  [-3000]: { code: 'NSURL_BG_SESSION_NEEDS_SHARED_CONTAINER', desc: 'Background URLSession requires a shared app group container for downloads', recoverable: false, retryMs: 0 },
  [-3001]: { code: 'NSURL_BG_SESSION_IN_USE', desc: 'Another process is already using this background session identifier', recoverable: false, retryMs: 0 },
  [-3002]: { code: 'NSURL_BG_SESSION_DISCONNECTED', desc: 'The background session daemon disconnected unexpectedly', recoverable: true, retryMs: 2000 },
};

const SSL_ERROR_CODES: Record<number, { code: string; desc: string }> = {
  [-9800]: { code: 'SSL_PROTOCOL', desc: 'SSL/TLS protocol error during record layer processing' },
  [-9801]: { code: 'SSL_NEGOTIATION', desc: 'SSL/TLS version or cipher suite negotiation failed between client and server' },
  [-9802]: { code: 'SSL_FATAL_ALERT', desc: 'Server sent a TLS fatal alert (check server logs for alert description)' },
  [-9803]: { code: 'SSL_HANDSHAKE_FAIL', desc: 'TLS handshake did not complete - possible ClientHello/ServerHello mismatch' },
  [-9804]: { code: 'SSL_MODULE_ATTACH', desc: 'SecureTransport module failed to attach to the connection context' },
  [-9805]: { code: 'SSL_UNKNOWN_ROOT_CERT', desc: 'The certificate chain terminates at an unknown/untrusted root CA' },
  [-9806]: { code: 'SSL_NO_ROOT_CERT', desc: 'No root certificate was found in the certificate chain' },
  [-9807]: { code: 'SSL_CERT_EXPIRED', desc: 'A certificate in the chain has passed its notAfter expiry date' },
  [-9808]: { code: 'SSL_CERT_NOT_YET_VALID', desc: 'A certificate in the chain has a notBefore date in the future' },
  [-9809]: { code: 'SSL_CLOSED_GRACEFUL', desc: 'The TLS connection was closed with a proper close_notify alert' },
  [-9810]: { code: 'SSL_CLOSED_ABORT', desc: 'The TLS connection was reset without close_notify (TCP RST received)' },
  [-9811]: { code: 'SSL_CERT_CHAIN_INVALID', desc: 'Certificate chain validation failed - intermediate or root cert missing/invalid' },
  [-9812]: { code: 'SSL_BAD_CERT', desc: 'The server certificate itself is malformed, corrupted, or uses unsupported extensions' },
  [-9813]: { code: 'SSL_CRYPTO', desc: 'A cryptographic operation failed during TLS (signature verification, key exchange, etc.)' },
  [-9814]: { code: 'SSL_INTERNAL', desc: 'Internal error in the SecureTransport/BoringSSL implementation' },
  [-9815]: { code: 'SSL_CLOSED_NO_NOTIFY', desc: 'Connection closed by peer without sending TLS close_notify (truncation attack or server crash)' },
  [-9816]: { code: 'SSL_PEER_ACCESS_DENIED', desc: 'TLS peer sent access_denied alert - client not authorized' },
  [-9817]: { code: 'SSL_PEER_INSUFFICIENT_SECURITY', desc: 'TLS peer sent insufficient_security alert - cipher/protocol too weak' },
  [-9818]: { code: 'SSL_PEER_INTERNAL_ERROR', desc: 'TLS peer reported an internal error via alert' },
  [-9819]: { code: 'SSL_PEER_USER_CANCELLED', desc: 'TLS peer cancelled the handshake via user_cancelled alert' },
  [-9820]: { code: 'SSL_PEER_NO_RENEGOTIATION', desc: 'TLS peer refused renegotiation request' },
  [-9825]: { code: 'SSL_CONFIG_ERROR', desc: 'TLS configuration error in the SecureTransport context' },
  [-9826]: { code: 'SSL_UNSUPPORTED_EXTENSION', desc: 'TLS extension not supported by the peer' },
  [-9827]: { code: 'SSL_UNEXPECTED_MESSAGE', desc: 'Received an unexpected TLS handshake message (wrong message at this stage)' },
  [-9828]: { code: 'SSL_DECOMPRESSION_FAIL', desc: 'TLS record decompression failed' },
  [-9829]: { code: 'SSL_HANDSHAKE_RECORD_OVERFLOW', desc: 'TLS handshake record exceeded maximum allowed size' },
  [-9830]: { code: 'SSL_HOST_NAME_MISMATCH', desc: 'Server certificate CN/SAN does not match the requested hostname' },
  [-9831]: { code: 'SSL_WEAK_PEER_EPHEMERAL_DH', desc: 'Server offered a weak ephemeral Diffie-Hellman key (< 2048 bits)' },
  [-9836]: { code: 'SSL_ATS_VIOLATION', desc: 'Connection parameters violate App Transport Security policy' },
  [-9838]: { code: 'SSL_ATS_MIN_VERSION_VIOLATION', desc: 'Server TLS version is below the ATS minimum (TLS 1.2)' },
  [-9839]: { code: 'SSL_ATS_CIPHER_VIOLATION', desc: 'Server selected a cipher suite not allowed by ATS policy' },
  [-9840]: { code: 'SSL_ATS_MIN_KEY_SIZE_VIOLATION', desc: 'Server certificate key size is below ATS minimum (RSA 2048, ECC 256)' },
  [-9841]: { code: 'SSL_ATS_CERT_HASH_VIOLATION', desc: 'Server certificate uses a hash algorithm not allowed by ATS (must be SHA-256+)' },
  [-9842]: { code: 'SSL_ATS_CERT_TRUST_VIOLATION', desc: 'Server certificate trust evaluation failed under ATS requirements' },
};

const POSIX_ERROR_CODES: Record<number, { code: string; desc: string }> = {
  [1]:  { code: 'POSIX_EPERM', desc: 'Operation not permitted by the OS' },
  [2]:  { code: 'POSIX_ENOENT', desc: 'No such file or directory' },
  [9]:  { code: 'POSIX_EBADF', desc: 'Bad file descriptor' },
  [13]: { code: 'POSIX_EACCES', desc: 'Permission denied by the file system' },
  [22]: { code: 'POSIX_EINVAL', desc: 'Invalid argument passed to system call' },
  [28]: { code: 'POSIX_ENOSPC', desc: 'No space left on device' },
  [32]: { code: 'POSIX_EPIPE', desc: 'Broken pipe - write to a closed socket/connection' },
  [48]: { code: 'POSIX_EADDRINUSE', desc: 'Network address already in use' },
  [50]: { code: 'POSIX_ENETDOWN', desc: 'Network subsystem is down' },
  [51]: { code: 'POSIX_ENETUNREACH', desc: 'Network is unreachable from this device' },
  [52]: { code: 'POSIX_ENETRESET', desc: 'Network connection reset by the network layer' },
  [53]: { code: 'POSIX_ECONNABORTED', desc: 'Connection aborted by the local TCP stack' },
  [54]: { code: 'POSIX_ECONNRESET', desc: 'Connection reset by peer (server sent TCP RST)' },
  [57]: { code: 'POSIX_ENOTCONN', desc: 'Socket is not connected' },
  [60]: { code: 'POSIX_ETIMEDOUT', desc: 'Connection timed out at the TCP level' },
  [61]: { code: 'POSIX_ECONNREFUSED', desc: 'Connection refused by the server (no process listening on port)' },
  [64]: { code: 'POSIX_EHOSTDOWN', desc: 'Host is down (no ARP response)' },
  [65]: { code: 'POSIX_EHOSTUNREACH', desc: 'No route to host - routing table has no path' },
};

const WKWEBVIEW_ERROR_CODES: Record<number, { code: string; desc: string }> = {
  [1]:   { code: 'WK_UNKNOWN', desc: 'Unknown WKWebView error' },
  [2]:   { code: 'WK_WEB_CONTENT_TERMINATED', desc: 'WebKit content process was killed by the OS (memory pressure or watchdog)' },
  [3]:   { code: 'WK_WEBVIEW_INVALIDATED', desc: 'The WKWebView instance was deallocated while a request was in flight' },
  [4]:   { code: 'WK_JS_EXCEPTION', desc: 'JavaScript threw an exception during execution' },
  [5]:   { code: 'WK_JS_RESULT_UNSUPPORTED', desc: 'JavaScript returned a value type that cannot be marshalled to native' },
  [6]:   { code: 'WK_CONTENT_RULE_LIST_STORE', desc: 'Content rule list (ad blocker) store error' },
  [7]:   { code: 'WK_ATTRIBUTED_STRING_CONTENT', desc: 'Error loading attributed string content' },
  [8]:   { code: 'WK_NAVIGATION_APP_BOUND_DOMAIN', desc: 'Navigation to a non-app-bound domain was blocked' },
  [9]:   { code: 'WK_JS_APP_BOUND_DOMAIN', desc: 'JavaScript execution blocked on non-app-bound domain' },
  [102]: { code: 'WK_FRAME_LOAD_INTERRUPTED', desc: 'Frame load was interrupted by a navigation policy decision' },
};

const HTTP_STATUS_CODES: Record<number, { code: string; desc: string; recoverable: boolean; retryMs: number }> = {
  [400]: { code: 'HTTP_BAD_REQUEST', desc: 'Server rejected the request due to malformed syntax or invalid parameters', recoverable: false, retryMs: 0 },
  [401]: { code: 'HTTP_UNAUTHORIZED', desc: 'Authentication token is missing, expired, or invalid', recoverable: false, retryMs: 0 },
  [403]: { code: 'HTTP_FORBIDDEN', desc: 'Server understood the request but refuses to authorize it', recoverable: false, retryMs: 0 },
  [404]: { code: 'HTTP_NOT_FOUND', desc: 'The requested API endpoint or resource does not exist on this server', recoverable: false, retryMs: 0 },
  [405]: { code: 'HTTP_METHOD_NOT_ALLOWED', desc: 'The HTTP method used is not supported for this endpoint', recoverable: false, retryMs: 0 },
  [408]: { code: 'HTTP_REQUEST_TIMEOUT', desc: 'Server closed the connection because the request took too long to send', recoverable: true, retryMs: 2000 },
  [409]: { code: 'HTTP_CONFLICT', desc: 'Request conflicts with current server state (e.g. duplicate resource)', recoverable: false, retryMs: 0 },
  [410]: { code: 'HTTP_GONE', desc: 'The resource has been permanently removed from the server', recoverable: false, retryMs: 0 },
  [413]: { code: 'HTTP_PAYLOAD_TOO_LARGE', desc: 'Request body exceeds the server maximum allowed size', recoverable: false, retryMs: 0 },
  [414]: { code: 'HTTP_URI_TOO_LONG', desc: 'Request URL exceeds the server maximum allowed length', recoverable: false, retryMs: 0 },
  [415]: { code: 'HTTP_UNSUPPORTED_MEDIA_TYPE', desc: 'Server does not support the Content-Type of the request body', recoverable: false, retryMs: 0 },
  [422]: { code: 'HTTP_UNPROCESSABLE_ENTITY', desc: 'Request body was well-formed but contains semantic validation errors', recoverable: false, retryMs: 0 },
  [429]: { code: 'HTTP_TOO_MANY_REQUESTS', desc: 'Rate limit exceeded - too many requests in the given time window', recoverable: true, retryMs: 5000 },
  [431]: { code: 'HTTP_HEADER_FIELDS_TOO_LARGE', desc: 'Request header fields exceed server limits', recoverable: false, retryMs: 0 },
  [451]: { code: 'HTTP_UNAVAILABLE_FOR_LEGAL', desc: 'Resource unavailable for legal/regulatory reasons', recoverable: false, retryMs: 0 },
  [500]: { code: 'HTTP_INTERNAL_SERVER_ERROR', desc: 'Server encountered an unhandled exception or crash', recoverable: true, retryMs: 2000 },
  [502]: { code: 'HTTP_BAD_GATEWAY', desc: 'Reverse proxy/load balancer received an invalid response from the upstream server', recoverable: true, retryMs: 3000 },
  [503]: { code: 'HTTP_SERVICE_UNAVAILABLE', desc: 'Server is temporarily overloaded or in maintenance mode', recoverable: true, retryMs: 5000 },
  [504]: { code: 'HTTP_GATEWAY_TIMEOUT', desc: 'Reverse proxy/load balancer timed out waiting for the upstream server to respond', recoverable: true, retryMs: 5000 },
  [520]: { code: 'HTTP_CF_UNKNOWN_ERROR', desc: 'Cloudflare received an unknown error from the origin server', recoverable: true, retryMs: 3000 },
  [521]: { code: 'HTTP_CF_WEB_SERVER_DOWN', desc: 'Cloudflare cannot establish a TCP connection to the origin server', recoverable: true, retryMs: 5000 },
  [522]: { code: 'HTTP_CF_CONNECTION_TIMED_OUT', desc: 'Cloudflare TCP connection to the origin server timed out', recoverable: true, retryMs: 5000 },
  [523]: { code: 'HTTP_CF_ORIGIN_UNREACHABLE', desc: 'Cloudflare cannot reach the origin server (DNS or routing issue)', recoverable: true, retryMs: 5000 },
  [524]: { code: 'HTTP_CF_TIMEOUT_OCCURRED', desc: 'Cloudflare established TCP but the origin did not respond with HTTP in time', recoverable: true, retryMs: 5000 },
  [525]: { code: 'HTTP_CF_SSL_HANDSHAKE_FAILED', desc: 'Cloudflare could not complete SSL/TLS handshake with the origin server', recoverable: true, retryMs: 3000 },
  [526]: { code: 'HTTP_CF_INVALID_SSL_CERT', desc: 'Cloudflare could not validate the origin server SSL certificate', recoverable: false, retryMs: 0 },
};

const JS_ERROR_PATTERNS: Array<{ pattern: RegExp | string; code: string; desc: string; recoverable: boolean; retryMs: number }> = [
  { pattern: 'Load failed', code: 'WKFETCH_LOAD_FAILED', desc: 'WKWebView fetch() rejected with "Load failed" - typically caused by CORS preflight rejection, ATS policy block, or TCP connection failure in the WebKit networking stack', recoverable: true, retryMs: 1000 },
  { pattern: 'Failed to fetch', code: 'FETCH_FAILED', desc: 'Fetch API promise rejected - network unreachable, DNS failure, or CORS headers missing from server response', recoverable: true, retryMs: 1000 },
  { pattern: 'NetworkError when attempting to fetch resource', code: 'FETCH_NETWORK_ERROR', desc: 'Firefox-style network error during fetch - connection refused or CORS failure', recoverable: true, retryMs: 1000 },
  { pattern: 'The network connection was lost', code: 'IOS_CONNECTION_LOST', desc: 'iOS-specific: TCP connection dropped during data transfer', recoverable: true, retryMs: 500 },
  { pattern: 'A server with the specified hostname could not be found', code: 'IOS_DNS_FAILED', desc: 'iOS-specific: DNS resolution returned no results for this hostname', recoverable: true, retryMs: 3000 },
  { pattern: 'The Internet connection appears to be offline', code: 'IOS_OFFLINE', desc: 'iOS detected no active network interface', recoverable: false, retryMs: 0 },
  { pattern: 'The request timed out', code: 'IOS_TIMEOUT', desc: 'iOS URLSession request exceeded timeout interval', recoverable: true, retryMs: 2000 },
  { pattern: 'cancelled', code: 'REQUEST_CANCELLED', desc: 'The request was cancelled before completion', recoverable: false, retryMs: 0 },
  { pattern: 'AbortError', code: 'ABORT_ERROR', desc: 'Request was aborted via AbortController.abort() or navigation away', recoverable: false, retryMs: 0 },
  { pattern: 'Could not connect to the server', code: 'IOS_CONNECT_FAILED', desc: 'iOS could not establish TCP connection to the server', recoverable: true, retryMs: 2000 },
  { pattern: /CORS/i, code: 'CORS_BLOCKED', desc: 'Cross-Origin Resource Sharing policy blocked this request - server Access-Control-Allow-Origin header missing or mismatched', recoverable: false, retryMs: 0 },
  { pattern: 'Access-Control-Allow-Origin', code: 'CORS_ORIGIN_MISSING', desc: 'Server response is missing the Access-Control-Allow-Origin header required for cross-origin requests', recoverable: false, retryMs: 0 },
  { pattern: 'preflight', code: 'CORS_PREFLIGHT_FAILED', desc: 'CORS preflight OPTIONS request was rejected by the server', recoverable: false, retryMs: 0 },
  { pattern: /protocol.*violation/i, code: 'PROTOCOL_VIOLATION', desc: 'HTTP/2 or HTTP/3 protocol violation - likely caused by QUIC alt-svc upgrade failure or corrupted HEADERS frame', recoverable: true, retryMs: 1000 },
  { pattern: 'XHR network request failed', code: 'XHR_NETWORK_FAILED', desc: 'XMLHttpRequest onerror fired - connection failed at the network layer', recoverable: true, retryMs: 1000 },
  { pattern: 'XHR request timed out', code: 'XHR_TIMEOUT', desc: 'XMLHttpRequest exceeded the 30-second timeout', recoverable: true, retryMs: 2000 },
  { pattern: 'JSON', code: 'JSON_PARSE_ERROR', desc: 'Response body could not be parsed as valid JSON', recoverable: false, retryMs: 0 },
  { pattern: 'SyntaxError', code: 'RESPONSE_SYNTAX_ERROR', desc: 'Response parsing threw a SyntaxError - likely HTML error page returned instead of JSON', recoverable: false, retryMs: 0 },
  { pattern: 'All fetch methods failed', code: 'ALL_METHODS_EXHAUSTED', desc: 'All 4 iOS fetch tiers failed: HttpBridge, WKWebView fetch, XMLHttpRequest, and CapacitorHttp with 3 retries', recoverable: false, retryMs: 0 },
  { pattern: 'Unexpected end of input', code: 'JSON_TRUNCATED', desc: 'Response body was truncated mid-stream before complete JSON could be received', recoverable: true, retryMs: 1000 },
  { pattern: 'Unexpected token', code: 'JSON_UNEXPECTED_TOKEN', desc: 'Response body starts with unexpected character - likely HTML error page or proxy error instead of JSON', recoverable: false, retryMs: 0 },
  { pattern: 'not valid JSON', code: 'JSON_INVALID', desc: 'Response body is not valid JSON - server may have returned plain text or binary data', recoverable: false, retryMs: 0 },
  { pattern: 'body stream already read', code: 'BODY_ALREADY_CONSUMED', desc: 'Response body was already consumed by a previous .text() or .json() call', recoverable: false, retryMs: 0 },
  { pattern: 'body stream is locked', code: 'BODY_STREAM_LOCKED', desc: 'Response body ReadableStream is locked by another reader', recoverable: false, retryMs: 0 },
  { pattern: 'Content Security Policy', code: 'CSP_BLOCKED', desc: 'Content Security Policy directive blocked this request', recoverable: false, retryMs: 0 },
  { pattern: 'ERR_BLOCKED_BY_CLIENT', code: 'BLOCKED_BY_EXTENSION', desc: 'Request was blocked by a browser extension or ad blocker', recoverable: false, retryMs: 0 },
];

const APP_ERROR_CODES: Record<string, { code: string; desc: string; recoverable: boolean }> = {
  LOGIN_INVALID_CREDENTIALS: { code: 'APP_LOGIN_INVALID_CREDENTIALS', desc: 'The username/email or password provided is incorrect', recoverable: false },
  LOGIN_RESPONSE_PARSE_FAILED: { code: 'APP_LOGIN_RESPONSE_PARSE_FAILED', desc: 'Login succeeded at HTTP level but the server response could not be parsed as JSON - possible proxy interference or server misconfiguration', recoverable: true },
  LOGIN_TOKEN_STORE_FAILED: { code: 'APP_LOGIN_TOKEN_STORE_FAILED', desc: 'Login succeeded but the auth token could not be saved to device storage (Capacitor Preferences) - device storage may be full or permission denied', recoverable: false },
  LOGIN_NO_TOKEN_RETURNED: { code: 'APP_LOGIN_NO_TOKEN_RETURNED', desc: 'Login succeeded but server did not return an authToken in the response - native app requires token-based auth', recoverable: false },
  LOGIN_NO_USER_RETURNED: { code: 'APP_LOGIN_NO_USER_RETURNED', desc: 'Login response is missing user data - server may have returned partial response', recoverable: true },
  REGISTER_EMAIL_EXISTS: { code: 'APP_REGISTER_EMAIL_EXISTS', desc: 'An account with this email address already exists', recoverable: false },
  REGISTER_USERNAME_EXISTS: { code: 'APP_REGISTER_USERNAME_EXISTS', desc: 'This username is already taken by another account', recoverable: false },
  REGISTER_PASSWORD_WEAK: { code: 'APP_REGISTER_PASSWORD_WEAK', desc: 'Password does not meet minimum requirements (at least 6 characters)', recoverable: false },
  REGISTER_MISSING_FIELDS: { code: 'APP_REGISTER_MISSING_FIELDS', desc: 'Email and password are required fields for registration', recoverable: false },
  REGISTER_RESPONSE_PARSE_FAILED: { code: 'APP_REGISTER_RESPONSE_PARSE_FAILED', desc: 'Registration succeeded at HTTP level but the server response could not be parsed as JSON', recoverable: true },
  REGISTER_TOKEN_STORE_FAILED: { code: 'APP_REGISTER_TOKEN_STORE_FAILED', desc: 'Registration succeeded but the auth token could not be saved to device storage', recoverable: false },
  AUTH_TOKEN_EXPIRED: { code: 'APP_AUTH_TOKEN_EXPIRED', desc: 'The stored authentication token has expired or been invalidated on the server - user must log in again', recoverable: false },
  AUTH_TOKEN_MISSING: { code: 'APP_AUTH_TOKEN_MISSING', desc: 'No auth token found in device storage - user may have been logged out or token was cleared', recoverable: false },
  AUTH_TOKEN_CLEAR_FAILED: { code: 'APP_AUTH_TOKEN_CLEAR_FAILED', desc: 'Failed to clear the auth token from device storage during logout', recoverable: false },
  AUTH_SESSION_INVALID: { code: 'APP_AUTH_SESSION_INVALID', desc: 'Server rejected the current session - both session cookie and auth token are invalid', recoverable: false },
  RISK_INSUFFICIENT_DATA: { code: 'APP_RISK_INSUFFICIENT_DATA', desc: 'Not enough questionnaire answers to calculate risk score - at least 5 mapped features are required', recoverable: false },
  RISK_ML_UNAVAILABLE: { code: 'APP_RISK_ML_UNAVAILABLE', desc: 'The external ML prediction service (XGBoost diabetes model) is temporarily unavailable', recoverable: true },
  RISK_CALCULATION_FAILED: { code: 'APP_RISK_CALCULATION_FAILED', desc: 'Server-side risk calculation encountered an error while processing questionnaire data', recoverable: true },
  RISK_RESPONSE_PARSE_FAILED: { code: 'APP_RISK_RESPONSE_PARSE_FAILED', desc: 'Risk score calculation succeeded at HTTP level but the response could not be parsed as JSON', recoverable: true },
  RISK_RESPONSE_INVALID: { code: 'APP_RISK_RESPONSE_INVALID', desc: 'Risk score response is missing expected fields (overallScore or diabetesRisk) - ML model may have returned unexpected format', recoverable: true },
  RISK_SAVE_QUESTIONNAIRE_FAILED: { code: 'APP_RISK_SAVE_QUESTIONNAIRE_FAILED', desc: 'Failed to save questionnaire answers to server before risk calculation', recoverable: true },
  API_RESPONSE_NOT_JSON: { code: 'APP_API_RESPONSE_NOT_JSON', desc: 'Server returned a non-JSON response (likely HTML error page from reverse proxy, Cloudflare, or server crash)', recoverable: true },
  API_RESPONSE_EMPTY: { code: 'APP_API_RESPONSE_EMPTY', desc: 'Server returned an empty response body where JSON data was expected', recoverable: true },
  API_BODY_SERIALIZE_FAILED: { code: 'APP_API_BODY_SERIALIZE_FAILED', desc: 'Failed to serialize request data to JSON string for sending to server', recoverable: false },
  CAPACITOR_PREFS_FAILED: { code: 'APP_CAPACITOR_PREFS_FAILED', desc: 'Capacitor Preferences plugin operation failed - device storage issue', recoverable: false },
  CAPACITOR_PLUGIN_NOT_LOADED: { code: 'APP_CAPACITOR_PLUGIN_NOT_LOADED', desc: 'HttpBridge native plugin is not registered - plugin may not be compiled into the app binary', recoverable: false },
  VERIFICATION_CODE_INVALID: { code: 'APP_VERIFICATION_CODE_INVALID', desc: 'The email verification code entered is incorrect', recoverable: false },
  VERIFICATION_CODE_EXPIRED: { code: 'APP_VERIFICATION_CODE_EXPIRED', desc: 'The email verification code has expired - request a new one', recoverable: false },
  VERIFICATION_LOCKED_OUT: { code: 'APP_VERIFICATION_LOCKED_OUT', desc: 'Too many failed verification attempts - account temporarily locked', recoverable: false },
  PASSWORD_RESET_INVALID_CODE: { code: 'APP_PASSWORD_RESET_INVALID_CODE', desc: 'The password reset code is invalid or has already been used', recoverable: false },
  PASSWORD_RESET_CODE_EXPIRED: { code: 'APP_PASSWORD_RESET_CODE_EXPIRED', desc: 'The password reset code has expired - request a new one', recoverable: false },
};

export function classifyAppError(context: string, httpStatus: number, serverMessage: string): { code: string; desc: string; recoverable: boolean } {
  const msg = serverMessage.toLowerCase();

  if (context === 'login') {
    if (httpStatus === 401 || msg.includes('invalid') && (msg.includes('credential') || msg.includes('password') || msg.includes('username'))) {
      return APP_ERROR_CODES.LOGIN_INVALID_CREDENTIALS;
    }
  }

  if (context === 'register') {
    if (msg.includes('email') && msg.includes('exist')) return APP_ERROR_CODES.REGISTER_EMAIL_EXISTS;
    if (msg.includes('username') && msg.includes('exist')) return APP_ERROR_CODES.REGISTER_USERNAME_EXISTS;
    if (msg.includes('password') && (msg.includes('6 char') || msg.includes('least'))) return APP_ERROR_CODES.REGISTER_PASSWORD_WEAK;
    if (msg.includes('required') && (msg.includes('email') || msg.includes('password'))) return APP_ERROR_CODES.REGISTER_MISSING_FIELDS;
  }

  if (context === 'risk') {
    if (httpStatus === 400 && (msg.includes('not enough') || msg.includes('features'))) return APP_ERROR_CODES.RISK_INSUFFICIENT_DATA;
    if (httpStatus === 503 || msg.includes('unavailable') || msg.includes('temporarily')) return APP_ERROR_CODES.RISK_ML_UNAVAILABLE;
    if (httpStatus === 500) return APP_ERROR_CODES.RISK_CALCULATION_FAILED;
  }

  if (context === 'verify') {
    if (msg.includes('invalid') && msg.includes('code')) return APP_ERROR_CODES.VERIFICATION_CODE_INVALID;
    if (msg.includes('expired')) return APP_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
    if (httpStatus === 429 || msg.includes('locked') || msg.includes('too many')) return APP_ERROR_CODES.VERIFICATION_LOCKED_OUT;
  }

  if (context === 'password_reset') {
    if (msg.includes('invalid')) return APP_ERROR_CODES.PASSWORD_RESET_INVALID_CODE;
    if (msg.includes('expired')) return APP_ERROR_CODES.PASSWORD_RESET_CODE_EXPIRED;
  }

  if (httpStatus === 401) return APP_ERROR_CODES.AUTH_TOKEN_EXPIRED;

  return { code: `APP_${context.toUpperCase()}_HTTP_${httpStatus}`, desc: serverMessage || `HTTP ${httpStatus} error`, recoverable: httpStatus >= 500 };
}

export interface SafeJsonResult<T = any> {
  ok: boolean;
  data?: T;
  errorCode: string;
  errorDesc: string;
  rawText?: string;
}

export async function safeParseJSON<T = any>(response: Response, context: string): Promise<SafeJsonResult<T>> {
  let text: string;
  try {
    text = await response.text();
  } catch (readError: any) {
    const errMsg = readError?.message || String(readError);
    console.error(`[safeParseJSON:${context}] Failed to read response body: ${errMsg}`);
    if (errMsg.includes('already read') || errMsg.includes('already consumed')) {
      return { ok: false, errorCode: 'BODY_ALREADY_CONSUMED', errorDesc: 'Response body was already consumed by a previous read operation', rawText: '' };
    }
    if (errMsg.includes('locked')) {
      return { ok: false, errorCode: 'BODY_STREAM_LOCKED', errorDesc: 'Response body stream is locked by another reader', rawText: '' };
    }
    return { ok: false, errorCode: `APP_${context.toUpperCase()}_BODY_READ_FAILED`, errorDesc: `Failed to read response body: ${errMsg}`, rawText: '' };
  }

  if (!text || text.trim().length === 0) {
    console.error(`[safeParseJSON:${context}] Empty response body (status=${response.status})`);
    return { ok: false, errorCode: APP_ERROR_CODES.API_RESPONSE_EMPTY.code, errorDesc: APP_ERROR_CODES.API_RESPONSE_EMPTY.desc, rawText: text };
  }

  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data, errorCode: '', errorDesc: '', rawText: text };
  } catch (parseError: any) {
    const firstChar = text.charAt(0);
    const preview = text.substring(0, 200);
    console.error(`[safeParseJSON:${context}] JSON parse failed. First char: '${firstChar}', preview: ${preview}`);

    if (firstChar === '<') {
      return { ok: false, errorCode: APP_ERROR_CODES.API_RESPONSE_NOT_JSON.code, errorDesc: `Server returned HTML instead of JSON. Preview: ${preview.substring(0, 100)}`, rawText: text };
    }

    const parseMsg = parseError?.message || '';
    if (parseMsg.includes('Unexpected end')) {
      return { ok: false, errorCode: 'JSON_TRUNCATED', errorDesc: `Response was truncated (${text.length} chars received). Possible network interruption during transfer.`, rawText: text };
    }

    const ctxCode = context === 'login' ? APP_ERROR_CODES.LOGIN_RESPONSE_PARSE_FAILED
      : context === 'register' ? APP_ERROR_CODES.REGISTER_RESPONSE_PARSE_FAILED
      : context === 'risk' ? APP_ERROR_CODES.RISK_RESPONSE_PARSE_FAILED
      : { code: `APP_${context.toUpperCase()}_PARSE_FAILED`, desc: `Failed to parse ${context} response as JSON` };

    return { ok: false, errorCode: ctxCode.code, errorDesc: `${ctxCode.desc}. Parse error: ${parseMsg}. Body preview: ${preview.substring(0, 80)}`, rawText: text };
  }
}

type FetchTier = 'HttpBridge' | 'WKWebView' | 'XHR' | 'CapacitorHttp' | 'WebFetch' | 'AndroidCapHttp' | 'FetchInterceptor';

interface DiagnosticReport {
  errorCode: string;
  description: string;
  tier: FetchTier;
  platform: string;
  url: string;
  method: string;
  recoverable: boolean;
  retryAfterMs: number;
  elapsedMs?: number;
  rawError: string;
  nativeErrorData?: HttpBridgeErrorData;
  underlyingCodes?: string[];
  timestamp: string;
}

function extractHttpBridgeErrorData(error: any): HttpBridgeErrorData | undefined {
  if (!error) return undefined;
  if (error?.errorCode) return error as HttpBridgeErrorData;
  if (error?.data?.errorCode) return error.data as HttpBridgeErrorData;
  if (error?.message && typeof error.message === 'string') {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.errorCode) return parsed as HttpBridgeErrorData;
    } catch {}
  }
  return undefined;
}

function diagnoseFromNSURLCode(code: number): { errorCode: string; desc: string; recoverable: boolean; retryMs: number } | null {
  const nsurl = NSURL_ERROR_CODES[code];
  if (nsurl) return { errorCode: nsurl.code, desc: nsurl.desc, recoverable: nsurl.recoverable, retryMs: nsurl.retryMs };
  const ssl = SSL_ERROR_CODES[code];
  if (ssl) return { errorCode: ssl.code, desc: ssl.desc, recoverable: false, retryMs: 0 };
  const posix = POSIX_ERROR_CODES[code];
  if (posix) return { errorCode: posix.code, desc: posix.desc, recoverable: code === 54 || code === 60, retryMs: code === 54 ? 500 : code === 60 ? 2000 : 0 };
  return null;
}

function diagnoseNetworkError(error: any, tier: FetchTier, url: string, method: string, startTime?: number): DiagnosticReport {
  const platform = Capacitor.getPlatform();
  const elapsedMs = startTime ? Date.now() - startTime : undefined;
  const errorMessage = error?.message || String(error || 'Unknown error');
  const errorName = error?.name || '';
  const errorCode = error?.code;
  const nativeData = extractHttpBridgeErrorData(error);
  const timestamp = new Date().toISOString();

  let report: DiagnosticReport = {
    errorCode: 'UNDIAGNOSED',
    description: `Unclassified error: ${errorMessage}`,
    tier,
    platform,
    url,
    method,
    recoverable: false,
    retryAfterMs: 0,
    elapsedMs,
    rawError: errorMessage,
    nativeErrorData: nativeData,
    timestamp,
  };

  if (nativeData?.errorCode) {
    report.errorCode = nativeData.errorCode;
    report.description = nativeData.detail || nativeData.localizedDescription || errorMessage;
    report.recoverable = nativeData.recoverable ?? false;
    report.retryAfterMs = nativeData.retryAfterMs ?? 0;
    report.elapsedMs = nativeData.elapsedMs ?? elapsedMs;
    if (nativeData.underlyingErrors?.length) {
      report.underlyingCodes = nativeData.underlyingErrors.map(u => u.errorCode);
    }
    console.error(`[${tier}:${platform}] NATIVE ERROR ${report.errorCode}`, JSON.stringify(nativeData, null, 2));
    return report;
  }

  if (typeof errorCode === 'string' && errorCode.startsWith('HB_')) {
    report.errorCode = errorCode;
    report.description = errorMessage;
    const numericCode = error?.data?.code ?? error?.code;
    if (typeof numericCode === 'number') {
      const diagnosed = diagnoseFromNSURLCode(numericCode);
      if (diagnosed) {
        report.description = diagnosed.desc;
        report.recoverable = diagnosed.recoverable;
        report.retryAfterMs = diagnosed.retryMs;
      }
    }
    console.error(`[${tier}:${platform}] NATIVE ${report.errorCode}: ${report.description}`);
    return report;
  }

  if (typeof errorCode === 'number' || (typeof errorCode === 'string' && /^-?\d+$/.test(errorCode))) {
    const numCode = typeof errorCode === 'number' ? errorCode : parseInt(errorCode, 10);
    const diagnosed = diagnoseFromNSURLCode(numCode);
    if (diagnosed) {
      report.errorCode = diagnosed.errorCode;
      report.description = diagnosed.desc;
      report.recoverable = diagnosed.recoverable;
      report.retryAfterMs = diagnosed.retryMs;
      console.error(`[${tier}:${platform}] ERROR ${report.errorCode}: ${report.description} (code=${numCode})`);
      return report;
    }
  }

  const codeInMessage = errorMessage.match(/(?:code[=: ]*|^|NSURLError.*?)(-?\d{3,5})/i);
  if (codeInMessage) {
    const numCode = parseInt(codeInMessage[1], 10);
    const diagnosed = diagnoseFromNSURLCode(numCode);
    if (diagnosed) {
      report.errorCode = diagnosed.errorCode;
      report.description = `${diagnosed.desc} (extracted from: ${errorMessage})`;
      report.recoverable = diagnosed.recoverable;
      report.retryAfterMs = diagnosed.retryMs;
      console.error(`[${tier}:${platform}] ERROR ${report.errorCode}: ${report.description}`);
      return report;
    }
    report.errorCode = `UNKNOWN_NATIVE_${numCode}`;
    report.description = `Unrecognized native error code ${numCode}: ${errorMessage}`;
    console.error(`[${tier}:${platform}] ERROR ${report.errorCode}: ${report.description}`);
    return report;
  }

  for (const pattern of JS_ERROR_PATTERNS) {
    const matches = typeof pattern.pattern === 'string'
      ? (errorMessage.includes(pattern.pattern) || errorName.includes(pattern.pattern))
      : (pattern.pattern.test(errorMessage) || pattern.pattern.test(errorName));
    if (matches) {
      report.errorCode = pattern.code;
      report.description = pattern.desc;
      report.recoverable = pattern.recoverable;
      report.retryAfterMs = pattern.retryMs;
      console.error(`[${tier}:${platform}] ERROR ${report.errorCode}: ${report.description}`);
      return report;
    }
  }

  if (errorName === 'TypeError') {
    report.errorCode = 'TYPE_ERROR_NETWORK';
    report.description = `JavaScript TypeError in network layer: ${errorMessage}`;
    report.recoverable = true;
    report.retryAfterMs = 1000;
  }

  console.error(`[${tier}:${platform}] ${report.errorCode}: name=${errorName} message=${errorMessage} code=${errorCode}`, error);
  return report;
}

function diagnoseHttpError(status: number, url: string, method: string, tier: FetchTier): DiagnosticReport {
  const platform = Capacitor.getPlatform();
  const httpInfo = HTTP_STATUS_CODES[status];
  if (httpInfo) {
    return {
      errorCode: httpInfo.code,
      description: httpInfo.desc,
      tier,
      platform,
      url,
      method,
      recoverable: httpInfo.recoverable,
      retryAfterMs: httpInfo.retryMs,
      rawError: `HTTP ${status}`,
      timestamp: new Date().toISOString(),
    };
  }
  const category = status >= 500 ? 'SERVER' : status >= 400 ? 'CLIENT' : 'UNEXPECTED';
  return {
    errorCode: `HTTP_${category}_${status}`,
    description: `HTTP ${status} response from server`,
    tier,
    platform,
    url,
    method,
    recoverable: status >= 500,
    retryAfterMs: status >= 500 ? 2000 : 0,
    rawError: `HTTP ${status}`,
    timestamp: new Date().toISOString(),
  };
}

function formatDiagnosticLog(report: DiagnosticReport): string {
  const parts = [
    `[${report.tier}:${report.platform}]`,
    report.errorCode,
    report.description,
    `url=${report.url}`,
    `method=${report.method}`,
    `recoverable=${report.recoverable}`,
  ];
  if (report.elapsedMs !== undefined) parts.push(`elapsed=${report.elapsedMs}ms`);
  if (report.retryAfterMs > 0) parts.push(`retryAfter=${report.retryAfterMs}ms`);
  if (report.underlyingCodes?.length) parts.push(`chain=[${report.underlyingCodes.join(' > ')}]`);
  return parts.join(' | ');
}

async function nativeHttpRequest(
  url: string, 
  options: { 
    method?: string; 
    headers?: Record<string, string>; 
    body?: string;
  } = {}
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  const method = options.method || 'GET';
  const startTime = Date.now();
  console.log(`[AndroidCapHttp] ${method} ${url}`);
  
  try {
    const response = await CapacitorHttp.request({
      url,
      method,
      headers: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined,
    });
    
    console.log(`[AndroidCapHttp] ${response.status} in ${Date.now() - startTime}ms`);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error: any) {
    const report = diagnoseNetworkError(error, 'AndroidCapHttp', url, method, startTime);
    console.error('[AndroidCapHttp] FAILURE:', formatDiagnosticLog(report));
    const err = new Error(`Network Error: ${report.errorCode} - ${report.description}`);
    (err as any).diagnosticReport = report;
    throw err;
  }
}

// Store the original fetch for use in our wrapper
const originalFetch = window.fetch.bind(window);

function xhrRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    
    xhr.onload = function () {
      const elapsed = Date.now() - startTime;
      console.log(`[XHR] ${xhr.status} in ${elapsed}ms for ${method} ${url}`);
      const respHeaders = new Headers();
      const headerStr = xhr.getAllResponseHeaders();
      if (headerStr) {
        headerStr.trim().split(/[\r\n]+/).forEach((line: string) => {
          const idx = line.indexOf(': ');
          if (idx > 0) respHeaders.append(line.substring(0, idx), line.substring(idx + 2));
        });
      }
      resolve(new Response(xhr.responseText, { status: xhr.status, headers: respHeaders }));
    };
    
    xhr.onerror = function () {
      const elapsed = Date.now() - startTime;
      const err = new TypeError(`XHR network request failed after ${elapsed}ms`);
      (err as any).xhrState = xhr.readyState;
      (err as any).xhrStatus = xhr.status;
      reject(err);
    };
    
    xhr.ontimeout = function () {
      const elapsed = Date.now() - startTime;
      const err = new TypeError(`XHR request timed out after ${elapsed}ms (limit: 30000ms)`);
      (err as any).xhrState = xhr.readyState;
      reject(err);
    };
    
    xhr.onabort = function () {
      const elapsed = Date.now() - startTime;
      const err = new TypeError(`XHR request aborted after ${elapsed}ms`);
      reject(err);
    };
    
    xhr.timeout = 30000;
    xhr.send(body || null);
  });
}

async function iosFetchWithFallback(
  url: string,
  options: RequestInit & { headers: Record<string, string> }
): Promise<Response> {
  const method = options.method || 'GET';
  const body = options.body as string | undefined;
  const overallStart = Date.now();
  const tierReports: DiagnosticReport[] = [];
  
  console.log(`[iosFetch] START ${method} ${url}`);
  
  // Tier 1: HttpBridge (native Swift URLSession, fresh per request, HTTP/3 disabled)
  try {
    const t1Start = Date.now();
    const bridgeResult = await HttpBridge.request({
      url,
      method,
      headers: options.headers,
      body: body,
    });
    
    console.log(`[iosFetch] T1_HttpBridge OK ${bridgeResult.status} in ${Date.now() - t1Start}ms`);
    
    return new Response(bridgeResult.data, {
      status: bridgeResult.status,
      headers: new Headers(bridgeResult.headers || {}),
    });
  } catch (bridgeError: any) {
    const report = diagnoseNetworkError(bridgeError, 'HttpBridge', url, method, overallStart);
    tierReports.push(report);
    console.warn(`[iosFetch] T1_HttpBridge FAIL: ${formatDiagnosticLog(report)}`);
  }

  // Tier 2: WKWebView fetch (uses WebKit networking stack)
  try {
    const t2Start = Date.now();
    const res = await originalFetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
    console.log(`[iosFetch] T2_WKWebView OK ${res.status} in ${Date.now() - t2Start}ms`);
    return res;
  } catch (wkError: any) {
    const report = diagnoseNetworkError(wkError, 'WKWebView', url, method);
    tierReports.push(report);
    console.warn(`[iosFetch] T2_WKWebView FAIL: ${formatDiagnosticLog(report)}`);
  }

  // Tier 3: XMLHttpRequest (different JS API, may use different connection pool)
  try {
    const res = await xhrRequest(url, method, options.headers, body);
    console.log(`[iosFetch] T3_XHR OK ${res.status}`);
    return res;
  } catch (xhrError: any) {
    const report = diagnoseNetworkError(xhrError, 'XHR', url, method);
    tierReports.push(report);
    console.warn(`[iosFetch] T3_XHR FAIL: ${formatDiagnosticLog(report)}`);
  }

  // Tier 4: CapacitorHttp with retry (Capacitor's built-in native HTTP)
  let lastCapReport: DiagnosticReport | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const t4Start = Date.now();
      let parsedBody: any = undefined;
      if (body) {
        try { parsedBody = JSON.parse(body); } catch { parsedBody = body; }
      }
      
      const nativeRes = await CapacitorHttp.request({
        url,
        method,
        headers: options.headers,
        data: parsedBody,
      });
      
      console.log(`[iosFetch] T4_CapHttp attempt ${attempt} OK ${nativeRes.status} in ${Date.now() - t4Start}ms`);
      
      const responseBody = typeof nativeRes.data === 'string' 
        ? nativeRes.data 
        : JSON.stringify(nativeRes.data);
      
      return new Response(responseBody, {
        status: nativeRes.status,
        headers: new Headers(nativeRes.headers),
      });
    } catch (capError: any) {
      const report = diagnoseNetworkError(capError, 'CapacitorHttp', url, method);
      lastCapReport = report;
      tierReports.push(report);
      console.warn(`[iosFetch] T4_CapHttp attempt ${attempt}/3 FAIL: ${formatDiagnosticLog(report)}`);
      if (attempt < 3) {
        const backoff = report.retryAfterMs > 0 ? report.retryAfterMs : attempt * 500;
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  
  const totalElapsed = Date.now() - overallStart;
  const tierSummary = tierReports.map(r => `${r.tier}:${r.errorCode}`).join(' → ');
  
  console.error(`[iosFetch] ALL_TIERS_EXHAUSTED in ${totalElapsed}ms for ${method} ${url}`);
  console.error(`[iosFetch] Failure chain: ${tierSummary}`);
  console.error(`[iosFetch] Full diagnostic reports:`, JSON.stringify(tierReports, null, 2));
  
  const err = new Error(
    `ALL_METHODS_EXHAUSTED: All 4 iOS networking tiers failed for ${method} ${url} in ${totalElapsed}ms. ` +
    `Chain: ${tierSummary}. ` +
    `Last error: ${lastCapReport?.errorCode || tierReports[tierReports.length - 1]?.errorCode || 'unknown'} - ` +
    `${lastCapReport?.description || tierReports[tierReports.length - 1]?.description || 'unknown'}`
  );
  (err as any).diagnosticReports = tierReports;
  (err as any).totalElapsedMs = totalElapsed;
  throw err;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
  const method = options.method || 'GET';
  const startTime = Date.now();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (isNativePlatform()) {
    const token = await getAuthToken();
    if (token) {
      headers["X-Auth-Token"] = token;
    }
    
    if (isIOS()) {
      const res = await iosFetchWithFallback(fullUrl, {
        ...options,
        method,
        headers,
      });
      
      if (res.status === 401) {
        const hadToken = await getAuthToken();
        if (hadToken) {
          await clearAuthToken();
          toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        }
      }
      if (!res.ok) {
        const httpReport = diagnoseHttpError(res.status, fullUrl, method, 'HttpBridge');
        console.warn(`[authFetch:ios] ${formatDiagnosticLog(httpReport)}`);
      }
      return res;
    }
    
    console.log(`[authFetch:android] ${method} ${fullUrl}`);
    try {
      const nativeResponse = await CapacitorHttp.request({
        url: fullUrl,
        method,
        headers,
        data: options.body ? JSON.parse(options.body as string) : undefined,
      });
      
      console.log(`[authFetch:android] ${nativeResponse.status} in ${Date.now() - startTime}ms`);
      
      if (nativeResponse.status === 401) {
        const hadToken = await getAuthToken();
        if (hadToken) {
          await clearAuthToken();
          toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        }
      }
      
      const fakeResponse = new Response(JSON.stringify(nativeResponse.data), {
        status: nativeResponse.status,
        headers: new Headers(nativeResponse.headers),
      });
      
      if (!fakeResponse.ok) {
        const httpReport = diagnoseHttpError(nativeResponse.status, fullUrl, method, 'AndroidCapHttp');
        console.warn(`[authFetch:android] ${formatDiagnosticLog(httpReport)}`);
      }
      
      return fakeResponse;
    } catch (error: any) {
      const report = diagnoseNetworkError(error, 'AndroidCapHttp', fullUrl, method, startTime);
      console.error(`[authFetch:android] FAILURE: ${formatDiagnosticLog(report)}`);
      const err = new Error(`Network Error: ${report.errorCode} - ${report.description}`);
      (err as any).diagnosticReport = report;
      throw err;
    }
  }
  
  console.log(`[authFetch:web] ${method} ${fullUrl}`);
  try {
    const res = await originalFetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });
    console.log(`[authFetch:web] ${res.status} in ${Date.now() - startTime}ms`);
    if (!res.ok) {
      const httpReport = diagnoseHttpError(res.status, fullUrl, method, 'WebFetch');
      console.warn(`[authFetch:web] ${formatDiagnosticLog(httpReport)}`);
    }
    return res;
  } catch (error: any) {
    const report = diagnoseNetworkError(error, 'WebFetch', fullUrl, method, startTime);
    console.error(`[authFetch:web] FAILURE: ${formatDiagnosticLog(report)}`);
    const err = new Error(`Network Error: ${report.errorCode} - ${report.description}`);
    (err as any).diagnosticReport = report;
    throw err;
  }
}

function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    const isApiCall = url.startsWith('/api') || 
                      url.includes('/api/') || 
                      url.includes('loretta-care.replit.app/api');
    
    if (isApiCall && isNativePlatform()) {
      const existingHeaders = init?.headers as Record<string, string> | undefined;
      const headers: Record<string, string> = { ...(existingHeaders || {}) };
      
      if (!headers['X-Auth-Token'] && !headers['x-auth-token']) {
        const token = await getAuthToken();
        if (token) {
          headers['X-Auth-Token'] = token;
        }
      }
      
      const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
      const method = init?.method || 'GET';
      const startTime = Date.now();
      
      if (isIOS()) {
        return iosFetchWithFallback(fullUrl, {
          ...init,
          method,
          headers,
          body: init?.body as string | undefined,
        });
      }
      
      console.log(`[interceptor:android] ${method} ${fullUrl}`);
      try {
        const response = await CapacitorHttp.request({
          url: fullUrl,
          method,
          headers,
          data: init?.body ? JSON.parse(init.body as string) : undefined,
        });
        
        console.log(`[interceptor:android] ${response.status} in ${Date.now() - startTime}ms`);
        
        return new Response(JSON.stringify(response.data), {
          status: response.status,
          headers: new Headers(response.headers),
        });
      } catch (error: any) {
        const report = diagnoseNetworkError(error, 'FetchInterceptor', fullUrl, method, startTime);
        console.error(`[interceptor:android] FAILURE: ${formatDiagnosticLog(report)}`);
        const err = new Error(`Network Error: ${report.errorCode} - ${report.description}`);
        (err as any).diagnosticReport = report;
        throw err;
      }
    }
    
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
  const startTime = Date.now();
  
  if (isNativePlatform()) {
    if (isIOS()) {
      const res = await iosFetchWithFallback(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (res.status === 401) {
        const hadToken = await getAuthToken();
        if (hadToken) {
          await clearAuthToken();
          toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        }
      }
      
      if (!res.ok) {
        const httpReport = diagnoseHttpError(res.status, fullUrl, method, 'HttpBridge');
        console.warn(`[apiRequest:ios] ${formatDiagnosticLog(httpReport)}`);
        const text = await res.text();
        let errorMessage = text || res.statusText;
        try {
          const jsonError = JSON.parse(text);
          if (jsonError.message) {
            errorMessage = jsonError.message;
          }
        } catch {}
        throw new Error(errorMessage);
      }
      
      return res;
    }
    
    console.log(`[apiRequest:android] ${method} ${fullUrl}`);
    const nativeResponse = await nativeHttpRequest(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (nativeResponse.status === 401) {
      const hadToken = await getAuthToken();
      if (hadToken) {
        await clearAuthToken();
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
      }
    }
    
    const fakeResponse = new Response(JSON.stringify(nativeResponse.data), {
      status: nativeResponse.status,
      headers: new Headers(nativeResponse.headers),
    });
    
    if (!fakeResponse.ok) {
      const httpReport = diagnoseHttpError(nativeResponse.status, fullUrl, method, 'AndroidCapHttp');
      console.warn(`[apiRequest:android] ${formatDiagnosticLog(httpReport)}`);
      const errorText = typeof nativeResponse.data === 'string' 
        ? nativeResponse.data 
        : JSON.stringify(nativeResponse.data);
      throw new Error(`${nativeResponse.status}: ${errorText}`);
    }
    
    return fakeResponse;
  }
  
  console.log(`[apiRequest:web] ${method} ${fullUrl}`);
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`[apiRequest:web] ${res.status} in ${Date.now() - startTime}ms`);
    if (!res.ok) {
      const httpReport = diagnoseHttpError(res.status, fullUrl, method, 'WebFetch');
      console.warn(`[apiRequest:web] ${formatDiagnosticLog(httpReport)}`);
    }
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    if (error.message?.startsWith('Network Error:') || error.message?.startsWith('ALL_METHODS') || error.message?.startsWith('[') || error.message?.startsWith('{')) {
      throw error;
    }
    const report = diagnoseNetworkError(error, 'WebFetch', fullUrl, method, startTime);
    console.error(`[apiRequest:web] FAILURE: ${formatDiagnosticLog(report)}`);
    const err = new Error(`Network Error: ${report.errorCode} - ${report.description}`);
    (err as any).diagnosticReport = report;
    throw err;
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
    const startTime = Date.now();
    
    if (isNativePlatform()) {
      if (isIOS()) {
        const res = await iosFetchWithFallback(url, {
          method: 'GET',
          headers,
        });
        
        if (res.status === 401) {
          const hadToken = await getAuthToken();
          if (hadToken) {
            await clearAuthToken();
            toast({ title: "Session expired", description: "Please log in again to continue.", variant: "destructive" });
          }
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          throw new Error('401: Unauthorized');
        }
        
        if (!res.ok) {
          const httpReport = diagnoseHttpError(res.status, url, 'GET', 'HttpBridge');
          console.warn(`[queryFn:ios] ${formatDiagnosticLog(httpReport)}`);
          const text = await res.text();
          let errorMessage = text;
          try {
            const jsonError = JSON.parse(text);
            if (jsonError.message) errorMessage = jsonError.message;
          } catch {}
          throw new Error(errorMessage);
        }
        
        return await res.json();
      }
      
      console.log(`[queryFn:android] GET ${url}`);
      const nativeResponse = await nativeHttpRequest(url, {
        method: 'GET',
        headers,
      });
      
      console.log(`[queryFn:android] ${nativeResponse.status} in ${Date.now() - startTime}ms`);
      
      if (nativeResponse.status === 401) {
        const hadToken = await getAuthToken();
        if (hadToken) {
          await clearAuthToken();
          toast({ title: "Session expired", description: "Please log in again to continue.", variant: "destructive" });
        }
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('401: Unauthorized');
      }
      
      if (nativeResponse.status >= 400) {
        const httpReport = diagnoseHttpError(nativeResponse.status, url, 'GET', 'AndroidCapHttp');
        console.warn(`[queryFn:android] ${formatDiagnosticLog(httpReport)}`);
        throw new Error(`${nativeResponse.status}: ${JSON.stringify(nativeResponse.data)}`);
      }
      
      return nativeResponse.data;
    }
    
    console.log(`[queryFn:web] GET ${url}`);
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers,
      });

      console.log(`[queryFn:web] ${res.status} in ${Date.now() - startTime}ms`);
      if (!res.ok && res.status !== 401) {
        const httpReport = diagnoseHttpError(res.status, url, 'GET', 'WebFetch');
        console.warn(`[queryFn:web] ${formatDiagnosticLog(httpReport)}`);
      }
      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      if (error.message?.startsWith('Network Error:') || error.message?.startsWith('ALL_METHODS') || error.message?.startsWith('[') || error.message?.startsWith('{')) {
        throw error;
      }
      const report = diagnoseNetworkError(error, 'WebFetch', url, 'GET', startTime);
      console.error(`[queryFn:web] FAILURE: ${formatDiagnosticLog(report)}`);
      const err = new Error(`Network Error: ${report.errorCode} - ${report.description}`);
      (err as any).diagnosticReport = report;
      throw err;
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
