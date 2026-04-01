import SwiftUI

struct ContentView: View {
    @StateObject private var model = MarketplaceViewModel()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            MarketplaceWebView(webView: model.webView)
                .ignoresSafeArea()

            if model.isLoading {
                loadingOverlay
            }

            if let errorMessage = model.errorMessage {
                errorOverlay(message: errorMessage)
            }
        }
        .overlay(alignment: .top) {
            topBar
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("IRIS")
                    .font(.headline)
                    .foregroundStyle(.white)
                HStack(spacing: 8) {
                    Text(model.pageTitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.65))
                        .lineLimit(1)
                    Text(model.source.label)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.86))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(.white.opacity(0.12))
                        .clipShape(Capsule())
                }
            }

            Spacer()

            HStack(spacing: 8) {
                sourceButton(.bundled)
                sourceButton(.live)
            }

            Button {
                model.reload()
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(.white.opacity(0.1))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(.ultraThinMaterial)
    }

    private func sourceButton(_ source: MarketplaceViewModel.Source) -> some View {
        let isSelected = model.source == source
        return Button {
            model.switchSource(source)
        } label: {
            Text(source.label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(isSelected ? .black : .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? .white : .white.opacity(0.1))
                .clipShape(Capsule())
        }
    }

    private var loadingOverlay: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(.white)
            Text("Sto caricando il marketplace nell’app...")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.75))
        }
        .padding(20)
        .background(.black.opacity(0.55))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func errorOverlay(message: String) -> some View {
        VStack(spacing: 12) {
            Text("Non riesco ad aprire il marketplace")
                .font(.headline)
                .foregroundStyle(.white)
            Text(message)
                .font(.footnote)
                .multilineTextAlignment(.center)
                .foregroundStyle(.white.opacity(0.72))
            Button("Riprova") {
                model.reload()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(24)
        .background(.black.opacity(0.82))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding(24)
    }
}

#Preview {
    ContentView()
}
