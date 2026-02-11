import Capacitor
import Foundation

@objc(HttpBridgePlugin)
public class HttpBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HttpBridgePlugin"
    public let jsName = "HttpBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    private func createSession() -> URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.httpMaximumConnectionsPerHost = 4
        config.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        config.urlCache = nil
        config.httpCookieStorage = nil
        if #available(iOS 17.0, *) {
            config.assumesHTTP3Capable = false
        }
        return URLSession(configuration: config, delegate: nil, delegateQueue: nil)
    }

    @objc func request(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("Invalid URL", "INVALID_URL")
            return
        }

        let method = call.getString("method") ?? "GET"
        let body = call.getString("body")

        var headersDict: [String: String] = [:]
        if let headersObj = call.getObject("headers") {
            for (key, value) in headersObj {
                if let strValue = value as? String {
                    headersDict[key] = strValue
                }
            }
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData

        for (key, value) in headersDict {
            request.setValue(value, forHTTPHeaderField: key)
        }

        if let body = body, let bodyData = body.data(using: .utf8) {
            request.httpBody = bodyData
        }

        let session = createSession()
        let task = session.dataTask(with: request) { data, response, error in
            defer { session.invalidateAndCancel() }

            if let error = error {
                let nsError = error as NSError
                call.reject(
                    error.localizedDescription,
                    "\(nsError.domain):\(nsError.code)",
                    error,
                    [
                        "code": nsError.code,
                        "domain": nsError.domain,
                        "description": error.localizedDescription
                    ]
                )
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                call.reject("No HTTP response", "NO_RESPONSE")
                return
            }

            let responseBody = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            var responseHeaders: [String: String] = [:]
            for (key, value) in httpResponse.allHeaderFields {
                responseHeaders[String(describing: key).lowercased()] = String(describing: value)
            }

            call.resolve([
                "status": httpResponse.statusCode,
                "data": responseBody,
                "headers": responseHeaders
            ])
        }
        task.resume()
    }
}
