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

    enum AppSection: CaseIterable, Hashable {
        case home
        case shop
        case sell
        case saved
        case profile

        var label: String {
            switch self {
            case .home:
                return "Home"
            case .shop:
                return "Shop"
            case .sell:
                return "Vendi"
            case .saved:
                return "Preferiti"
            case .profile:
                return "Profilo"
            }
        }

        var systemImage: String {
            switch self {
            case .home:
                return "house"
            case .shop:
                return "bag"
            case .sell:
                return "plus.circle"
            case .saved:
                return "heart"
            case .profile:
                return "person"
            }
        }

        var subtitle: String {
            switch self {
            case .home:
                return "Scopri IRIS"
            case .shop:
                return "Esplora lo shop"
            case .sell:
                return "Pubblica e gestisci"
            case .saved:
                return "I tuoi salvati"
            case .profile:
                return "Buyer, seller e account"
            }
        }

        var script: String {
            switch self {
            case .home:
                return """
                if (typeof showPage === 'function') { showPage('buy'); }
                if (typeof showBuyView === 'function') { showBuyView('home'); }
                """
            case .shop:
                return """
                if (typeof showPage === 'function') { showPage('buy'); }
                if (typeof showBuyView === 'function') { showBuyView('shop'); }
                """
            case .sell:
                return """
                if (typeof showPage === 'function') { showPage('sell'); }
                """
            case .saved:
                return """
                if (typeof showPage === 'function') { showPage('buy'); }
                if (typeof showBuyView === 'function') { showBuyView('fav'); }
                """
            case .profile:
                return """
                if (typeof showPage === 'function') { showPage('buy'); }
                if (typeof showBuyView === 'function') { showBuyView('profile'); }
                if (typeof setProfileArea === 'function') { setProfileArea('account', 'overview'); }
                """
            }
        }
    }

    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var pageTitle = "IRIS"
    @Published var source: Source = .bundled
    @Published var selectedSection: AppSection = .home

    let webView: WKWebView
    private let liveURL = URL(string: "https://popi99999.github.io/IRIS/")!
    private var pendingSection: AppSection?

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
        webView.scrollView.keyboardDismissMode = .interactive
        webView.backgroundColor = .clear
        webView.isOpaque = false
        self.webView = webView

        super.init()

        self.webView.navigationDelegate = self
        pendingSection = selectedSection
        loadMarketplace(source: .bundled)
    }

    var shellTitle: String {
        selectedSection.label
    }

    var shellSubtitle: String {
        selectedSection.subtitle
    }

    func loadMarketplace(source requestedSource: Source? = nil) {
        let nextSource = requestedSource ?? source
        pendingSection = selectedSection
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

    func openSection(_ section: AppSection) {
        selectedSection = section
        pendingSection = section
        guard webView.url != nil else { return }
        runPendingSectionNavigation()
    }

    func reload() {
        pendingSection = selectedSection
        if webView.url == nil {
            loadMarketplace()
        } else {
            webView.reload()
        }
    }

    private func runPendingSectionNavigation() {
        let section = pendingSection ?? selectedSection
        let script = """
        (function() {
          try {
            document.documentElement.classList.add('iris-native-app');
            document.body.classList.add('iris-native-app');
            var style = document.getElementById('iris-native-app-style');
            if (!style) {
              style = document.createElement('style');
              style.id = 'iris-native-app-style';
              style.textContent = `
                #sellTopbar {
                  display: none !important;
                }
                #page-sell {
                  padding-top: 1.25rem !important;
                }
              `;
              document.head.appendChild(style);
            }
            if (typeof skipIntro === 'function') {
              try { skipIntro(); } catch (error) {}
            }
            \(section.script)
            return 'ok';
          } catch (error) {
            return 'error:' + (error && error.message ? error.message : String(error));
          }
        })();
        """

        webView.evaluateJavaScript(script) { [weak self] _, _ in
            self?.pendingSection = nil
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
        runPendingSectionNavigation()
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
