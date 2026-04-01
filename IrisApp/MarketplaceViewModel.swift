import Foundation
import WebKit

@MainActor
final class MarketplaceViewModel: NSObject, ObservableObject {
    private static let storageShim = """
    (function () {
      function createStorage() {
        var store = {};
        return {
          getItem: function (key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
          },
          setItem: function (key, value) {
            store[String(key)] = String(value);
          },
          removeItem: function (key) {
            delete store[String(key)];
          },
          clear: function () {
            store = {};
          },
          key: function (index) {
            return Object.keys(store)[index] || null;
          },
          get length() {
            return Object.keys(store).length;
          }
        };
      }

      function ensureStorage(name) {
        var fallback = createStorage();
        try {
          var storage = window[name];
          var probeKey = "__iris_probe__";
          storage.setItem(probeKey, "1");
          storage.removeItem(probeKey);
        } catch (error) {
          Object.defineProperty(window, name, {
            configurable: true,
            enumerable: true,
            value: fallback
          });
        }
      }

      ensureStorage("localStorage");
      ensureStorage("sessionStorage");
    })();
    """

    enum Source: CaseIterable {
        case bundled
        case live

        var label: String {
            switch self {
            case .bundled:
                return "App"
            case .live:
                return "Live"
            }
        }
    }

    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var pageTitle = "IRIS"
    @Published var source: Source = .bundled

    let webView: WKWebView
    private let liveURL = URL(string: "https://popi99999.github.io/IRIS/")!

    override init() {
        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        let storageShimScript = WKUserScript(
            source: Self.storageShim,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        userContentController.addUserScript(storageShimScript)
        configuration.userContentController = userContentController
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
        loadMarketplace(source: .bundled)
    }

    func loadMarketplace(source requestedSource: Source? = nil) {
        let nextSource = requestedSource ?? source
        switch nextSource {
        case .live:
            source = .live
            errorMessage = nil
            isLoading = true
            webView.load(URLRequest(url: liveURL))
        case .bundled:
            loadBundledMarketplace()
        }
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

    func switchSource(_ nextSource: Source) {
        loadMarketplace(source: nextSource)
    }

    func reload() {
        if webView.url == nil {
            loadMarketplace()
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
