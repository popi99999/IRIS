import Foundation
import WebKit

@MainActor
final class MarketplaceViewModel: NSObject, ObservableObject {
    enum Source {
        case live
        case bundled

        var label: String {
            switch self {
            case .live:
                return "Live"
            case .bundled:
                return "Offline copy"
            }
        }
    }

    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var pageTitle = "IRIS"
    @Published var source: Source = .live

    let webView: WKWebView
    private let liveURL = URL(string: "https://popi99999.github.io/IRIS/")!

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.backgroundColor = .clear
        webView.isOpaque = false
        self.webView = webView

        super.init()

        self.webView.navigationDelegate = self
        loadMarketplace(preferLive: true)
    }

    func loadMarketplace(preferLive: Bool) {
        if preferLive {
            source = .live
            errorMessage = nil
            isLoading = true
            webView.load(URLRequest(url: liveURL))
            return
        }

        loadBundledMarketplace()
    }

    private func loadBundledMarketplace() {
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true) else {
            errorMessage = "Cartella Web non trovata nel bundle app."
            isLoading = false
            return
        }

        let indexURL = webRoot.appendingPathComponent("index.html")
        guard FileManager.default.fileExists(atPath: indexURL.path) else {
            errorMessage = "index.html non trovato nel bundle app."
            isLoading = false
            return
        }

        source = .bundled
        errorMessage = nil
        isLoading = true
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
    }

    func reload() {
        if webView.url == nil {
            loadMarketplace(preferLive: true)
        } else {
            webView.reload()
        }
    }
}

extension MarketplaceViewModel: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isLoading = true
        errorMessage = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
        pageTitle = webView.title ?? "IRIS"
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if source == .live {
            loadBundledMarketplace()
            return
        }

        isLoading = false
        errorMessage = error.localizedDescription
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if source == .live {
            loadBundledMarketplace()
            return
        }

        isLoading = false
        errorMessage = error.localizedDescription
    }
}
