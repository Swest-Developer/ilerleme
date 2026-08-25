import SwiftUI

@main
struct SeyirApp: App {
    var body: some Scene {
        WindowGroup { KokEkran() }
    }
}

struct KokEkran: View {
    var body: some View {
        TabView {
            IlerlemeEkrani()
                .tabItem { Label("İlerleme", systemImage: "square.dashed") }
            RehberEkrani()
                .tabItem { Label("Nasıl eklenir", systemImage: "questionmark.circle") }
        }
        .tint(RenkSecimi.turuncu.renk)
        .preferredColorScheme(.dark)
    }
}

// MARK: - İlerleme

/// Ana ekran. **İlk gün bile dolu** — yıl, ay, hafta, gün ve tatil her zaman bir
/// değere sahip, kullanıcı hiçbir şey girmeden içerisi doludur. Takip
/// uygulamalarının çoğu ilk açılışta boş olduğu için siliniyor.
///
/// v1'de burada sayaç listesi YOK: sayaç widget'ın kendi ayarında yaşıyor
/// (bkz. `Sayac` yorumu). Ücretli hesaba geçilip App Group eklenince liste açılır.
struct IlerlemeEkrani: View {
    private let zaman: [Kapsam] = [.yil, .ay, .hafta, .gun, .tatil]

    /// Ekran açıkken saatin ilerlemesi görünsün diye dakikada bir tazeleniyor.
    @State private var an = Date()
    private let saat = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(zaman, id: \.self) { k in
                        Satir(ilerleme: Motor.hesapla(kapsam: k, simdi: an))
                    }
                } footer: {
                    Text("Sayaç eklemek için widget'ı ana ekrana koy, basılı tut ve "
                         + "\"Widget'ı Düzenle\" de. Kapsam olarak Sayaç'ı seçip "
                         + "bir tarih ver — gerisini kendi hesaplar.")
                }
            }
            .navigationTitle("İlerleme")
            .onReceive(saat) { an = $0 }
        }
    }
}

private struct Satir: View {
    let ilerleme: Ilerleme

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 3) {
                Text(ilerleme.kisaAd).font(.system(size: 15, weight: .semibold))
                Text("\(ilerleme.sayi) \(ilerleme.kuyruk)")
                    .font(.system(size: 11.5))
                    .foregroundStyle(.secondary)
                ProgressView(value: ilerleme.oran)
                    .tint(RenkSecimi.turuncu.renk)
                    .padding(.top, 4)
            }
            Spacer()
            Text("%\(Int(ilerleme.yuzde.rounded()))")
                .font(.system(size: 19, weight: .bold))
                .monospacedDigit()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Rehber

/// İlk oturumda widget ana ekrana konmazsa kullanıcı geri gelmiyor.
/// Bu yüzden karşılama ekranı "hoş geldin" değil, iş yaptırıyor.
struct RehberEkrani: View {
    private let adimlar: [(String, String)] = [
        ("Ana ekranda boş bir yere basılı tut",
         "İkonlar titremeye başlayacak."),
        ("Sol üstteki + düğmesine bas",
         "Widget galerisi açılır."),
        ("Listede İlerleme'yi bul, boyutunu seç, ekle",
         ""),
        ("Widget'a basılı tutup \"Widget'ı Düzenle\" de",
         "Kapsam seç: yıl, ay, hafta, gün, resmî tatil ya da sayaç. "
         + "Birden fazla widget koyup her birine ayrı kapsam verebilirsin."),
        ("Sayaç için bir ad ve tarih yaz",
         "Tarih ileriyse geri sayar, geride kaldıysa \"kaç gündür\" sayar. "
         + "Yön seçmene gerek yok.")
    ]

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Uygulamayı bir daha açmana gerek yok — widget kendi kendine güncelleniyor.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                ForEach(Array(adimlar.enumerated()), id: \.offset) { indeks, adim in
                    HStack(alignment: .top, spacing: 14) {
                        Text("\(indeks + 1)")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(.black)
                            .frame(width: 26, height: 26)
                            .background(Circle().fill(RenkSecimi.turuncu.renk))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(adim.0).font(.system(size: 14, weight: .semibold))
                            if !adim.1.isEmpty {
                                Text(adim.1).font(.system(size: 12))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Ana ekrana ekle")
        }
    }
}
