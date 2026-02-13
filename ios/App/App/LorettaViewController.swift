import UIKit
import Capacitor
import WebKit

class LorettaViewController: CAPBridgeViewController {

    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.suppressesIncrementalRendering = false
        return config
    }

    override open func viewDidLoad() {
        clearAltSvcCache()
        super.viewDidLoad()
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()

        guard let webView = self.webView else { return }

        webView.allowsLinkPreview = false
        webView.allowsBackForwardNavigationGestures = false

        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }

        print("[Loretta] LorettaViewController loaded")
        print("[Loretta] iOS \(UIDevice.current.systemVersion) | \(UIDevice.current.model)")
    }

    private func clearAltSvcCache() {
        let dataStore = WKWebsiteDataStore.default()
        let dataTypes: Set<String> = [
            WKWebsiteDataTypeServiceWorkerRegistrations,
            WKWebsiteDataTypeFetchCache,
        ]
        dataStore.removeData(ofTypes: dataTypes, modifiedSince: Date.distantPast) {
            print("[Loretta] Cleared WKWebView fetch cache and service workers")
        }

        URLCache.shared.removeAllCachedResponses()
        print("[Loretta] Cleared URLCache (Alt-Svc cache)")
    }
}
