import Foundation
import SwiftUI
import AppIntents

// MARK: - Kapsam

/// Widget'ın neyi gösterdiği. Tasarımlar kapsamı BİLMEZ — hepsi aynı `Ilerleme`
/// yapısını çizer, kapsam sadece o yapıyı üretir. Yeni kapsam eklemek tasarımlara
/// dokunmadan yapılır.
enum Kapsam: String, AppEnum, CaseIterable {
    case gun, hafta, ay, yil, tatil, sayac

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Kapsam")

    static var caseDisplayRepresentations: [Kapsam: DisplayRepresentation] = [
        .gun:   "Bugün",
        .hafta: "Bu hafta",
        .ay:    "Bu ay",
        .yil:   "Bu yıl",
        .tatil: "Resmî tatil",
        .sayac: "Sayaç"
    ]
}

/// Bir kapsamın o andaki hâli. Widget görünümleri yalnızca bunu görür.
struct Ilerleme {
    let ad: String          // büyük harfli başlık: "2026", "AĞUSTOS"
    let kisaAd: String      // düz hâli: "Ağustos"
    let oran: Double        // 0...1
    let sayi: Int           // kalan — ileri sayımda geçen
    let birim: String       // "gün" / "saat" / "gündür"
    let ileri: Bool         // true ise "kaldı" yazılmaz
    let altMetin: String

    var yuzde: Double { oran * 100 }
    var kuyruk: String { ileri ? birim : "\(birim) kaldı" }
}

// MARK: - Sayaç

/// Kullanıcının sayacı.
///
/// **Yön alanı yok, bilerek.** Kullanıcıya "geri sayım mı ileri sayım mı" diye
/// sormuyoruz; tarih gelecekteyse geri sayıyor, geçmişteyse ileri.
///
/// **Nerede saklanıyor:** hiçbir yerde. v1'de sayacın adı ve tarihi widget'ın kendi
/// ayarında (`WidgetAyari`) duruyor, sistem onu widget'la birlikte saklıyor.
/// Bu sayede App Group'a — dolayısıyla 99 $/yıl'lık ücretli hesaba — ihtiyaç yok.
/// Bedeli: sayaçlar uygulama içinde liste hâlinde yönetilmiyor, her sayaç kendi
/// widget'ında yaşıyor. Ücretli hesaba geçilince App Group eklenip liste açılabilir.
struct Sayac: Identifiable, Hashable {
    var id: UUID = UUID()
    var ad: String
    var tarih: Date

    /// Gelecekteyse pozitif (kalan gün), geçmişteyse negatif.
    func fark(_ simdi: Date, _ takvim: Calendar) -> Int {
        let bugun = takvim.startOfDay(for: simdi)
        let hedef = takvim.startOfDay(for: tarih)
        return takvim.dateComponents([.day], from: bugun, to: hedef).day ?? 0
    }
}

// MARK: - Tasarım ve renk

enum Tasarim: String, AppEnum, CaseIterable {
    case dolanKap, yuzde, kalan

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Tasarım")

    static var caseDisplayRepresentations: [Tasarim: DisplayRepresentation] = [
        .dolanKap: "Dolan kap",
        .yuzde:    "Yüzde",
        .kalan:    "Kalan"
    ]
}

enum RenkSecimi: String, AppEnum, CaseIterable {
    case turuncu, deniz, mor, sari, kirmizi, beyaz

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Renk")

    static var caseDisplayRepresentations: [RenkSecimi: DisplayRepresentation] = [
        .turuncu: "Turuncu", .deniz: "Deniz", .mor: "Mor",
        .sari: "Sarı", .kirmizi: "Kırmızı", .beyaz: "Beyaz"
    ]

    var renk: Color {
        switch self {
        case .turuncu: return Color(red: 1.00, green: 0.48, blue: 0.27)
        case .deniz:   return Color(red: 0.36, green: 0.75, blue: 0.75)
        case .mor:     return Color(red: 0.61, green: 0.43, blue: 1.00)
        case .sari:    return Color(red: 0.95, green: 0.76, blue: 0.31)
        case .kirmizi: return Color(red: 0.89, green: 0.42, blue: 0.42)
        case .beyaz:   return Color(white: 0.91)
        }
    }
}

extension String {
    /// Türkçe büyük harf. Düz `uppercased()` "Tatile" → "TATILE" yapıyor, doğrusu "TATİLE".
    var buyukTR: String { uppercased(with: Locale(identifier: "tr_TR")) }
}
