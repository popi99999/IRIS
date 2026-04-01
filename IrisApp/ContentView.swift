import SwiftUI

struct ContentView: View {
    @StateObject private var model = MarketplaceViewModel()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            MarketplaceWebView(webView: model.webView)
                .background(Color.black)

            if model.isLoading {
                loadingOverlay
            }

            if let errorMessage = model.errorMessage {
                errorOverlay(message: errorMessage)
            }
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            topBar
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            bottomBar
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("IRIS")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.white)
                HStack(spacing: 8) {
                    Text(model.shellSubtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                        .lineLimit(1)
                    Text(model.source.label)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.white.opacity(0.12))
                        .clipShape(Capsule())
                }
            }

            Spacer()

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
        .padding(.top, 10)
        .padding(.bottom, 10)
        .background(
            LinearGradient(
                colors: [
                    Color(red: 38 / 255, green: 22 / 255, blue: 73 / 255),
                    Color(red: 24 / 255, green: 11 / 255, blue: 51 / 255)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(.white.opacity(0.08))
                    .frame(height: 1)
            }
        )
    }

    private var bottomBar: some View {
        HStack(spacing: 8) {
            ForEach(MarketplaceViewModel.AppSection.allCases, id: \.self) { section in
                let isSelected = model.selectedSection == section
                Button {
                    model.openSection(section)
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: section.systemImage)
                            .font(.system(size: section == .sell ? 19 : 16, weight: .semibold))
                        Text(section.label)
                            .font(.caption2.weight(.semibold))
                            .lineLimit(1)
                    }
                    .foregroundStyle(isSelected ? .white : .white.opacity(0.62))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, section == .sell ? 12 : 10)
                    .background(
                        Group {
                            if isSelected {
                                LinearGradient(
                                    colors: [
                                        Color(red: 124 / 255, green: 58 / 255, blue: 237 / 255),
                                        Color(red: 87 / 255, green: 34 / 255, blue: 168 / 255)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            } else {
                                Color.white.opacity(0.04)
                            }
                        }
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(
            Color(red: 17 / 255, green: 8 / 255, blue: 38 / 255)
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(.white.opacity(0.08))
                        .frame(height: 1)
                }
        )
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
