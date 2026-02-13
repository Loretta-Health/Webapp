import Capacitor
import Foundation
import UIKit

@objc(HttpBridgePlugin)
public class HttpBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HttpBridgePlugin"
    public let jsName = "HttpBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    private static let nsURLErrorDescriptions: [Int: String] = [
        -999: "HB_CANCELLED",
        -1000: "HB_BAD_URL",
        -1001: "HB_TIMEOUT",
        -1002: "HB_UNSUPPORTED_URL",
        -1003: "HB_DNS_CANNOT_FIND_HOST",
        -1004: "HB_CANNOT_CONNECT_TO_HOST",
        -1005: "HB_CONNECTION_LOST",
        -1006: "HB_DNS_LOOKUP_FAILED",
        -1007: "HB_TOO_MANY_REDIRECTS",
        -1008: "HB_RESOURCE_UNAVAILABLE",
        -1009: "HB_NOT_CONNECTED_TO_INTERNET",
        -1010: "HB_REDIRECT_TO_NONEXISTENT",
        -1011: "HB_BAD_SERVER_RESPONSE",
        -1012: "HB_USER_CANCELLED_AUTH",
        -1013: "HB_USER_AUTH_REQUIRED",
        -1014: "HB_ZERO_BYTE_RESOURCE",
        -1015: "HB_CANNOT_DECODE_RAW_DATA",
        -1016: "HB_CANNOT_DECODE_CONTENT",
        -1017: "HB_CANNOT_PARSE_RESPONSE",
        -1018: "HB_INTERNATIONAL_ROAMING_OFF",
        -1019: "HB_CALL_IS_ACTIVE",
        -1020: "HB_DATA_NOT_ALLOWED",
        -1021: "HB_REQUEST_BODY_STREAM_EXHAUSTED",
        -1022: "HB_ATS_BLOCKED",
        -1100: "HB_FILE_DOES_NOT_EXIST",
        -1101: "HB_FILE_IS_DIRECTORY",
        -1102: "HB_NO_PERMISSIONS_TO_READ_FILE",
        -1103: "HB_DATA_LENGTH_EXCEEDS_MAX",
        -1104: "HB_FILE_OUTSIDE_SAFE_AREA",
        -1200: "HB_SECURE_CONNECTION_FAILED",
        -1201: "HB_SERVER_CERT_HAS_BAD_DATE",
        -1202: "HB_SERVER_CERT_UNTRUSTED",
        -1203: "HB_SERVER_CERT_UNKNOWN_ROOT",
        -1204: "HB_SERVER_CERT_NOT_YET_VALID",
        -1205: "HB_CLIENT_CERT_REJECTED",
        -1206: "HB_CLIENT_CERT_REQUIRED",
        -1207: "HB_CANNOT_LOAD_FROM_NETWORK",
        -2000: "HB_CANNOT_CREATE_FILE",
        -2001: "HB_CANNOT_OPEN_FILE",
        -2002: "HB_CANNOT_CLOSE_FILE",
        -2003: "HB_CANNOT_WRITE_TO_FILE",
        -2004: "HB_CANNOT_REMOVE_FILE",
        -2005: "HB_CANNOT_MOVE_FILE",
        -2006: "HB_DOWNLOAD_DECODING_FAILED_MID_STREAM",
        -2007: "HB_DOWNLOAD_DECODING_FAILED_TO_COMPLETE",
        -3000: "HB_BACKGROUND_SESSION_REQUIRES_SHARED_CONTAINER",
        -3001: "HB_BACKGROUND_SESSION_IN_USE",
        -3002: "HB_BACKGROUND_SESSION_WAS_DISCONNECTED",
    ]

    private static let cfNetworkErrorDescriptions: [Int: String] = [
        -9800: "HB_SSL_PROTOCOL_ERROR",
        -9801: "HB_SSL_NEGOTIATION_FAILED",
        -9802: "HB_SSL_FATAL_ALERT",
        -9803: "HB_SSL_HANDSHAKE_FAIL",
        -9804: "HB_SSL_MODULE_ATTACH_FAIL",
        -9805: "HB_SSL_UNKNOWN_ROOT_CERT",
        -9806: "HB_SSL_NO_ROOT_CERT",
        -9807: "HB_SSL_CERT_EXPIRED",
        -9808: "HB_SSL_CERT_NOT_YET_VALID",
        -9809: "HB_SSL_CLOSED_GRACEFUL",
        -9810: "HB_SSL_CLOSED_ABORT",
        -9811: "HB_SSL_CERT_CHAIN_INVALID",
        -9812: "HB_SSL_BAD_CERT",
        -9813: "HB_SSL_CRYPTO_ERROR",
        -9814: "HB_SSL_INTERNAL_ERROR",
        -9815: "HB_SSL_CLOSED_NO_NOTIFY",
        -9816: "HB_SSL_PEER_ACCESS_DENIED",
        -9817: "HB_SSL_PEER_INSUFFICIENT_SECURITY",
        -9818: "HB_SSL_PEER_INTERNAL_ERROR",
        -9819: "HB_SSL_PEER_USER_CANCELLED",
        -9820: "HB_SSL_PEER_NO_RENEGOTIATION",
        -9821: "HB_SSL_PEER_AUTH_COMPLETED",
        -9822: "HB_SSL_CLIENT_HELLO_RECEIVED",
        -9823: "HB_SSL_TRANSPORT_RESET",
        -9824: "HB_SSL_NETWORK_TIMEOUT",
        -9825: "HB_SSL_CONFIG_ERROR",
        -9826: "HB_SSL_UNSUPPORTED_EXTENSION",
        -9827: "HB_SSL_UNEXPECTED_MESSAGE",
        -9828: "HB_SSL_DECOMPRESSION_FAIL",
        -9829: "HB_SSL_HANDSHAKE_RECORD_OVERFLOW",
        -9830: "HB_SSL_HOST_NAME_MISMATCH",
        -9831: "HB_SSL_WEAK_PEER_EPHEMERAL_DH_KEY",
        -9832: "HB_SSL_CLIENT_CERT_REQUESTED",
        -9833: "HB_SSL_SERVER_UNWILLING_TO_NEGOTIATE",
        -9834: "HB_SSL_INSUFFICIENT_BUFFER_SIZE",
        -9836: "HB_SSL_ATS_VIOLATION",
        -9838: "HB_SSL_ATS_MINIMUM_VERSION_VIOLATION",
        -9839: "HB_SSL_ATS_CIPHER_SUITE_VIOLATION",
        -9840: "HB_SSL_ATS_MINIMUM_KEY_SIZE_VIOLATION",
        -9841: "HB_SSL_ATS_CERTIFICATE_HASH_ALGORITHM_VIOLATION",
        -9842: "HB_SSL_ATS_CERTIFICATE_TRUST_VIOLATION",
    ]

    private static let posixErrorDescriptions: [Int: String] = [
        1: "HB_POSIX_EPERM",
        2: "HB_POSIX_ENOENT",
        9: "HB_POSIX_EBADF",
        13: "HB_POSIX_EACCES",
        22: "HB_POSIX_EINVAL",
        28: "HB_POSIX_ENOSPC",
        32: "HB_POSIX_EPIPE",
        48: "HB_POSIX_EADDRINUSE",
        50: "HB_POSIX_ENETDOWN",
        51: "HB_POSIX_ENETUNREACH",
        52: "HB_POSIX_ENETRESET",
        53: "HB_POSIX_ECONNABORTED",
        54: "HB_POSIX_ECONNRESET",
        57: "HB_POSIX_ENOTCONN",
        60: "HB_POSIX_ETIMEDOUT",
        61: "HB_POSIX_ECONNREFUSED",
        64: "HB_POSIX_EHOSTDOWN",
        65: "HB_POSIX_EHOSTUNREACH",
    ]

    private func classifyError(_ nsError: NSError) -> (code: String, detail: String) {
        let domain = nsError.domain
        let code = nsError.code

        if domain == NSURLErrorDomain || domain == "kCFErrorDomainCFNetwork" {
            if let mapped = HttpBridgePlugin.nsURLErrorDescriptions[code] {
                return (mapped, "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
            }
            if let mapped = HttpBridgePlugin.cfNetworkErrorDescriptions[code] {
                return (mapped, "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
            }
            return ("HB_NSURL_UNKNOWN_\(code)", "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
        }

        if domain == NSOSStatusErrorDomain {
            if let mapped = HttpBridgePlugin.cfNetworkErrorDescriptions[code] {
                return (mapped, "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
            }
            return ("HB_OSSTATUS_\(code)", "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
        }

        if domain == NSPOSIXErrorDomain {
            if let mapped = HttpBridgePlugin.posixErrorDescriptions[code] {
                return (mapped, "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
            }
            return ("HB_POSIX_\(code)", "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
        }

        if domain == "NSCocoaErrorDomain" {
            return ("HB_COCOA_\(code)", "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
        }

        return ("HB_\(domain.uppercased().replacingOccurrences(of: ".", with: "_"))_\(code)", "domain=\(domain) code=\(code) desc=\(nsError.localizedDescription)")
    }

    private func extractUnderlyingErrors(_ nsError: NSError) -> [[String: Any]] {
        var chain: [[String: Any]] = []
        var current: NSError? = nsError.userInfo[NSUnderlyingErrorKey] as? NSError
        var depth = 0
        while let err = current, depth < 5 {
            let (uCode, uDetail) = classifyError(err)
            chain.append([
                "depth": depth,
                "errorCode": uCode,
                "domain": err.domain,
                "code": err.code,
                "detail": uDetail,
                "localizedDescription": err.localizedDescription,
            ])
            current = err.userInfo[NSUnderlyingErrorKey] as? NSError
            depth += 1
        }
        return chain
    }

    private func createSession() -> URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.httpMaximumConnectionsPerHost = 4
        config.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        config.urlCache = nil
        config.httpCookieStorage = nil
        config.httpShouldUsePipelining = false
        config.multipathServiceType = .none
        if #available(iOS 17.0, *) {
            config.assumesHTTP3Capable = false
        }
        if #available(iOS 14.5, *) {
            config.tlsMinimumSupportedProtocolVersion = .TLSv12
            config.tlsMaximumSupportedProtocolVersion = .TLSv13
        }
        return URLSession(configuration: config, delegate: nil, delegateQueue: nil)
    }

    @objc func request(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url") else {
            call.reject("Missing URL parameter", "HB_MISSING_URL", nil, [
                "errorCode": "HB_MISSING_URL",
                "detail": "The 'url' parameter was not provided in the plugin call",
                "recoverable": false,
            ])
            return
        }

        guard let url = URL(string: urlString) else {
            call.reject("URL could not be parsed", "HB_MALFORMED_URL", nil, [
                "errorCode": "HB_MALFORMED_URL",
                "detail": "The provided URL string is not a valid URL: \(urlString)",
                "inputUrl": urlString,
                "recoverable": false,
            ])
            return
        }

        guard let scheme = url.scheme, ["http", "https"].contains(scheme.lowercased()) else {
            call.reject("URL scheme not supported", "HB_UNSUPPORTED_SCHEME", nil, [
                "errorCode": "HB_UNSUPPORTED_SCHEME",
                "detail": "Only http and https schemes are supported. Got: \(url.scheme ?? "none")",
                "inputUrl": urlString,
                "scheme": url.scheme ?? "none",
                "recoverable": false,
            ])
            return
        }

        let method = (call.getString("method") ?? "GET").uppercased()
        let validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
        guard validMethods.contains(method) else {
            call.reject("Invalid HTTP method", "HB_INVALID_METHOD", nil, [
                "errorCode": "HB_INVALID_METHOD",
                "detail": "HTTP method '\(method)' is not supported. Valid methods: \(validMethods.joined(separator: ", "))",
                "inputMethod": method,
                "recoverable": false,
            ])
            return
        }

        let body = call.getString("body")

        var headersDict: [String: String] = [:]
        if let headersObj = call.getObject("headers") {
            for (key, value) in headersObj {
                if let strValue = value as? String {
                    headersDict[key] = strValue
                } else if let numValue = value as? NSNumber {
                    headersDict[key] = numValue.stringValue
                }
            }
        }

        if body != nil && headersDict["Content-Type"] == nil && headersDict["content-type"] == nil {
            headersDict["Content-Type"] = "application/json"
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData

        for (key, value) in headersDict {
            request.setValue(value, forHTTPHeaderField: key)
        }

        if let body = body {
            guard let bodyData = body.data(using: .utf8) else {
                call.reject("Body encoding failed", "HB_BODY_ENCODING_FAILED", nil, [
                    "errorCode": "HB_BODY_ENCODING_FAILED",
                    "detail": "The request body could not be encoded as UTF-8",
                    "bodyLength": body.count,
                    "recoverable": false,
                ])
                return
            }
            request.httpBody = bodyData
        }

        let session = createSession()
        let requestStartTime = Date()

        let task = session.dataTask(with: request) { [weak self] data, response, error in
            defer { session.invalidateAndCancel() }

            let elapsed = Date().timeIntervalSince(requestStartTime)
            let elapsedMs = Int(elapsed * 1000)

            if let error = error {
                let nsError = error as NSError
                let (errorCode, detail) = self?.classifyError(nsError) ?? ("HB_UNKNOWN", "unknown")
                let underlyingChain = self?.extractUnderlyingErrors(nsError) ?? []

                var isCancellation = nsError.code == NSURLErrorCancelled
                var isTimeout = nsError.code == NSURLErrorTimedOut
                var isOffline = nsError.code == NSURLErrorNotConnectedToInternet
                    || nsError.code == NSURLErrorDataNotAllowed
                    || nsError.code == NSURLErrorInternationalRoamingOff
                    || nsError.code == NSURLErrorCallIsActive
                var isSSL = (nsError.code >= -1206 && nsError.code <= -1200)
                    || (nsError.code <= -9800 && nsError.code >= -9842)
                var isDNS = nsError.code == NSURLErrorCannotFindHost
                    || nsError.code == NSURLErrorDNSLookupFailed
                var isProtocolViolation = nsError.code == NSURLErrorCannotParseResponse
                    || nsError.code == NSURLErrorBadServerResponse
                var isConnectionReset = nsError.code == NSURLErrorNetworkConnectionLost

                for underlying in underlyingChain {
                    if let uCode = underlying["code"] as? Int {
                        if uCode == 54 { isConnectionReset = true }
                        if uCode == 60 { isTimeout = true }
                        if uCode == 61 { isDNS = true }
                        if uCode <= -9800 && uCode >= -9842 { isSSL = true }
                    }
                }

                var recoverable = !isCancellation && !isOffline
                var retryAfterMs = 0
                if isTimeout { retryAfterMs = 2000; recoverable = true }
                if isConnectionReset { retryAfterMs = 500; recoverable = true }
                if isProtocolViolation { retryAfterMs = 1000; recoverable = true }
                if isDNS { retryAfterMs = 3000; recoverable = true }

                call.reject(
                    error.localizedDescription,
                    errorCode,
                    error,
                    [
                        "errorCode": errorCode,
                        "domain": nsError.domain,
                        "code": nsError.code,
                        "detail": detail,
                        "localizedDescription": error.localizedDescription,
                        "elapsedMs": elapsedMs,
                        "url": urlString,
                        "method": method,
                        "isCancellation": isCancellation,
                        "isTimeout": isTimeout,
                        "isOffline": isOffline,
                        "isSSL": isSSL,
                        "isDNS": isDNS,
                        "isProtocolViolation": isProtocolViolation,
                        "isConnectionReset": isConnectionReset,
                        "recoverable": recoverable,
                        "retryAfterMs": retryAfterMs,
                        "underlyingErrors": underlyingChain,
                        "iosVersion": UIDevice.current.systemVersion,
                        "deviceModel": UIDevice.current.model,
                    ]
                )
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                call.reject("No HTTP response received", "HB_NO_HTTP_RESPONSE", nil, [
                    "errorCode": "HB_NO_HTTP_RESPONSE",
                    "detail": "URLSession returned a non-HTTP response object or nil",
                    "elapsedMs": elapsedMs,
                    "url": urlString,
                    "method": method,
                    "responseType": response == nil ? "nil" : String(describing: type(of: response!)),
                    "recoverable": true,
                    "retryAfterMs": 1000,
                ])
                return
            }

            guard let data = data else {
                call.reject("No response data", "HB_NO_RESPONSE_DATA", nil, [
                    "errorCode": "HB_NO_RESPONSE_DATA",
                    "detail": "HTTP response had status \(httpResponse.statusCode) but data was nil",
                    "status": httpResponse.statusCode,
                    "elapsedMs": elapsedMs,
                    "url": urlString,
                    "method": method,
                    "recoverable": true,
                    "retryAfterMs": 1000,
                ])
                return
            }

            let responseBody: String
            if let utf8String = String(data: data, encoding: .utf8) {
                responseBody = utf8String
            } else if let asciiString = String(data: data, encoding: .ascii) {
                responseBody = asciiString
            } else {
                responseBody = data.base64EncodedString()
            }

            var responseHeaders: [String: String] = [:]
            for (key, value) in httpResponse.allHeaderFields {
                responseHeaders[String(describing: key).lowercased()] = String(describing: value)
            }

            call.resolve([
                "status": httpResponse.statusCode,
                "data": responseBody,
                "headers": responseHeaders,
                "elapsedMs": elapsedMs,
                "url": urlString,
            ])
        }
        task.resume()
    }
}
