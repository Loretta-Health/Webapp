import UIKit
import Capacitor
import WebKit

class LorettaViewController: CAPBridgeViewController {

    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.suppressesIncrementalRendering = false
        return config
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
        print("[Loretta] NOTE: 'Server protocol violation 0x02' and 'Control stream closed' messages are benign iOS QUIC/HTTP3 fallback logs from WKWebView's transport layer. They do not affect app functionality.")
    }
}
