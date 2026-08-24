import SwiftUI
import WidgetKit

/// Tasarımların SwiftUI karşılığı. Hepsi yalnızca `Ilerleme` görüyor —
/// hangi kapsamdan geldiğini bilmiyorlar. Tarayıcıdaki tezgâhla aynı mantık.
struct WidgetGovdesi: View {
    let giris: Giris

    @Environment(\.widgetFamily) private var boy

    private var i: Ilerleme { giris.ilerleme }
    private var vurgu: Color { giris.ayar.renk.renk }

    var body: some View {
        switch boy {
        case .accessoryCircular:    kilitDairesel
        case .accessoryRectangular: kilitDikdortgen
        default:                    anaEkran
        }
    }

    // MARK: ana ekran

    @ViewBuilder private var anaEkran: some View {
        switch giris.ayar.tasarim {
        case .dolanKap: dolanKap
        case .yuzde:    yuzde
        case .kalan:    kalan
        }
    }

    /// Widget'ın kendisi çubuk: kutu alttan yukarı doluyor.
    private var dolanKap: some View {
        ZStack(alignment: .bottom) {
            GeometryReader { g in
                vurgu
                    .frame(height: g.size.height * i.oran)
                    .frame(maxHeight: .infinity, alignment: .bottom)
            }
            icerik(buyukYazi: "%\(Int(i.yuzde.rounded()))", punto: 40)
        }
    }

    private var yuzde: some View {
        VStack(alignment: .leading, spacing: 0) {
            baslik
            Spacer(minLength: 0)
            Text("%\(Int(i.yuzde.rounded()))")
                .font(.system(size: 46, weight: .bold))
                .kerning(-2)
            Capsule()
                .fill(Color.gray.opacity(0.28))
                .frame(height: 6)
                .overlay(alignment: .leading) {
                    GeometryReader { g in
                        Capsule().fill(vurgu).frame(width: g.size.width * i.oran)
                    }
                }
                .padding(.vertical, 10)
            altYazi
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Tek sayı, başka hiçbir şey.
    private var kalan: some View {
        VStack(alignment: .leading, spacing: 0) {
            baslik
            Spacer(minLength: 0)
            Text("\(i.sayi)")
                .font(.system(size: i.sayi > 99 ? 68 : 82, weight: .bold))
                .kerning(-3)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
            Text(i.kuyruk)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: kilit ekranı

    private var kilitDairesel: some View {
        Gauge(value: i.oran) {
            Text(i.kisaAd)
        } currentValueLabel: {
            Text("\(Int(i.yuzde.rounded()))")
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }

    private var kilitDikdortgen: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(i.ad).font(.system(size: 10, weight: .semibold)).opacity(0.7)
            Text(String(format: "%%%.1f", i.yuzde))
                .font(.system(size: 22, weight: .heavy)).kerning(-0.8)
            Capsule().fill(.white.opacity(0.3)).frame(height: 3)
                .overlay(alignment: .leading) {
                    GeometryReader { g in
                        Capsule().fill(.white).frame(width: g.size.width * i.oran)
                    }
                }
        }
    }

    // MARK: parçalar

    private func icerik(buyukYazi: String, punto: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            baslik
            Spacer(minLength: 0)
            Text(buyukYazi)
                .font(.system(size: punto, weight: .bold))
                .kerning(-2)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            altYazi.padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var baslik: some View {
        HStack(spacing: 5) {
            Circle().fill(vurgu).frame(width: 6, height: 6)
            Text(i.ad)
                .font(.system(size: 10.5, weight: .semibold))
                .kerning(0.8)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .foregroundStyle(.secondary)
    }

    private var altYazi: some View {
        Text("\(i.sayi) \(i.kuyruk)")
            .font(.system(size: 11))
            .foregroundStyle(.secondary)
            .lineLimit(1)
    }
}
