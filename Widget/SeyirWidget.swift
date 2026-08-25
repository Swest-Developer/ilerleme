import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Widget ayarı

/// Kullanıcı widget'a basılı tutup "Widget'ı Düzenle" dediğinde çıkan ekran.
///
/// Beş ayrı widget yerine TEK widget var, kapsamı buradan seçiliyor — böylece
/// galeri kopyalarla dolmuyor ve aynı ekrana farklı kapsamlarla birden fazla
/// kez konabiliyor.
///
/// **Sayaç bilgisi de burada duruyor.** Uygulamanın deposunda değil, çünkü widget
/// ayrı bir süreç ve ortak depo (App Group) ücretsiz Apple hesabında engelli.
/// Böylece v1 tek kuruş harcamadan kendi telefonuna kurulabiliyor.
struct WidgetAyari: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Seyir"
    static var description = IntentDescription("Ana ekranında neyi göstereceğini seç.")

    @Parameter(title: "Kapsam", default: .yil)
    var kapsam: Kapsam

    @Parameter(title: "Tasarım", default: .dolanKap)
    var tasarim: Tasarim

    @Parameter(title: "Renk", default: .turuncu)
    var renk: RenkSecimi

    // --- yalnızca kapsam "Sayaç" iken kullanılıyor ---

    @Parameter(title: "Sayacın adı", default: "Sayaç")
    var sayacAdi: String

    /// Tek alan, yön yok. Gelecekteyse geri sayıyor, geçmişteyse ileri.
    @Parameter(title: "Tarih")
    var sayacTarihi: Date?

    /// Ayardan gelen iki alanı motorun anladığı yapıya çeviriyor.
    var sayac: Sayac? {
        guard let sayacTarihi else { return nil }
        return Sayac(ad: sayacAdi.isEmpty ? "Sayaç" : sayacAdi, tarih: sayacTarihi)
    }
}

// MARK: - Zaman çizelgesi

struct Giris: TimelineEntry {
    let date: Date
    let ilerleme: Ilerleme
    let ayar: WidgetAyari
}

struct Saglayici: AppIntentTimelineProvider {

    func placeholder(in context: Context) -> Giris {
        Giris(date: Date(),
              ilerleme: Motor.hesapla(kapsam: .yil),
              ayar: WidgetAyari())
    }

    func snapshot(for configuration: WidgetAyari, in context: Context) async -> Giris {
        giris(configuration, Date())
    }

    func timeline(for configuration: WidgetAyari, in context: Context) async -> Timeline<Giris> {
        let simdi = Date()

        // Gün kapsamı saatte bir değişiyor, diğerleri günde bir. Günlük yenileme
        // bütçesi ~40-70 olduğu için boşa yenileme yapmıyoruz.
        let adet = configuration.kapsam == .gun ? 12 : 3
        let adim: TimeInterval = configuration.kapsam == .gun ? 3600 : 86400

        let girisler = (0..<adet).map { i in
            giris(configuration, simdi.addingTimeInterval(Double(i) * adim))
        }

        let sinir = Motor.sonrakiSinir(kapsam: configuration.kapsam, simdi: simdi)
        return Timeline(entries: girisler, policy: .after(sinir))
    }

    private func giris(_ ayar: WidgetAyari, _ an: Date) -> Giris {
        Giris(date: an,
              ilerleme: Motor.hesapla(kapsam: ayar.kapsam, sayac: ayar.sayac, simdi: an),
              ayar: ayar)
    }
}

// MARK: - Widget

@main
struct SeyirWidgetBundle: WidgetBundle {
    var body: some Widget { SeyirWidget() }
}

struct SeyirWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "SeyirWidget",
                               intent: WidgetAyari.self,
                               provider: Saglayici()) { giris in
            WidgetGovdesi(giris: giris)
                .containerBackground(for: .widget) {
                    Color.black.opacity(0.72)
                }
        }
        .configurationDisplayName("Seyir")
        .description("Yıl, ay, hafta, gün, resmî tatil ya da kendi sayacın.")
        .supportedFamilies([.systemSmall, .systemMedium,
                            .accessoryCircular, .accessoryRectangular])
    }
}
