import Foundation

// MARK: - Resmî tatiller

/// Sabit tarihliler her yıl kendini tekrar ediyor. Dini bayramlar hicri takvime
/// bağlı olduğu için elle yazılmak zorunda — **bu tablo her yıl güncellenmeli.**
/// Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.
enum Tatiller {

    struct Tatil {
        let ad: String
        let tarih: Date
    }

    private static let sabit: [(ad: String, ay: Int, gun: Int)] = [
        ("Yılbaşı", 1, 1),
        ("Ulusal Egemenlik ve Çocuk Bayramı", 4, 23),
        ("Emek ve Dayanışma Günü", 5, 1),
        ("Gençlik ve Spor Bayramı", 5, 19),
        ("Demokrasi ve Millî Birlik Günü", 7, 15),
        ("Zafer Bayramı", 8, 30),
        ("Cumhuriyet Bayramı", 10, 29)
    ]

    /// Dini bayramların ilk günleri. Yıl geçtikçe buraya ekleme yapılacak.
    private static let dini: [(ad: String, iso: String)] = [
        ("Ramazan Bayramı", "2027-03-09"),
        ("Kurban Bayramı",  "2027-05-16")
    ]

    static func liste(cevresinde tarih: Date, takvim: Calendar) -> [Tatil] {
        let yil = takvim.component(.year, from: tarih)
        var sonuc: [Tatil] = []

        for y in (yil - 1)...(yil + 1) {
            for t in sabit {
                var b = DateComponents()
                b.year = y; b.month = t.ay; b.day = t.gun
                if let d = takvim.date(from: b) {
                    sonuc.append(Tatil(ad: t.ad, tarih: d))
                }
            }
        }

        let bicim = DateFormatter()
        bicim.calendar = takvim
        bicim.timeZone = takvim.timeZone
        bicim.dateFormat = "yyyy-MM-dd"
        for t in dini {
            if let d = bicim.date(from: t.iso) {
                sonuc.append(Tatil(ad: t.ad, tarih: d))
            }
        }

        return sonuc.sorted { $0.tarih < $1.tarih }
    }
}

// MARK: - Motor

/// Tek motor, altı kapsam. Tarayıcıdaki tezgâhın (`widget-tezgah`) birebir karşılığı.
enum Motor {

    static var takvim: Calendar {
        var t = Calendar(identifier: .gregorian)
        t.locale = Locale(identifier: "tr_TR")
        t.firstWeekday = 2                      // pazartesi
        return t
    }

    static func hesapla(kapsam: Kapsam,
                        sayac: Sayac? = nil,
                        simdi: Date = Date()) -> Ilerleme {
        let t = takvim
        switch kapsam {
        case .gun:
            return donem(.day, simdi: simdi, takvim: t,
                         ad: "BUGÜN", kisaAd: "Bugün", saatlik: true)
        case .hafta:
            return donem(.weekOfYear, simdi: simdi, takvim: t,
                         ad: "BU HAFTA", kisaAd: "Bu hafta", saatlik: false)
        case .ay:
            let ad = ayAdi(simdi, t)
            return donem(.month, simdi: simdi, takvim: t,
                         ad: ad.buyuk, kisaAd: ad.duz, saatlik: false)
        case .yil:
            let y = String(t.component(.year, from: simdi))
            return donem(.year, simdi: simdi, takvim: t,
                         ad: y, kisaAd: y, saatlik: false)
        case .tatil:
            return tatil(simdi: simdi, takvim: t)
        case .sayac:
            return self.sayacIlerlemesi(sayac, simdi: simdi, takvim: t)
        }
    }

    // MARK: dönem kapsamları

    private static func donem(_ bilesen: Calendar.Component,
                              simdi: Date, takvim t: Calendar,
                              ad: String, kisaAd: String,
                              saatlik: Bool) -> Ilerleme {
        guard let aralik = t.dateInterval(of: bilesen, for: simdi) else {
            return Ilerleme(ad: ad, kisaAd: kisaAd, oran: 0, sayi: 0,
                            birim: saatlik ? "saat" : "gün", ileri: false, altMetin: "")
        }

        let oran = simdi.timeIntervalSince(aralik.start) / aralik.duration
        let kalanSaniye = aralik.end.timeIntervalSince(simdi)
        let sayi = saatlik ? Int(kalanSaniye / 3600) : Int(kalanSaniye / 86400)

        // Gün kapsamında saat:dakika YAZILMIYOR. Widget bütçesi 15-60 dakikada bir
        // yeniliyor; dakika gösteren widget bayat kalır ve kullanıcı güvenmez.
        let alt: String
        if saatlik {
            alt = "\(t.component(.hour, from: simdi)). saat"
        } else {
            alt = "\(t.component(.day, from: simdi)) \(ayAdi(simdi, t).duz)"
        }

        return Ilerleme(ad: ad, kisaAd: kisaAd,
                        oran: min(max(oran, 0), 1), sayi: max(sayi, 0),
                        birim: saatlik ? "saat" : "gün", ileri: false, altMetin: alt)
    }

    // MARK: resmî tatil

    private static func tatil(simdi: Date, takvim t: Calendar) -> Ilerleme {
        let bugun = t.startOfDay(for: simdi)
        let liste = Tatiller.liste(cevresinde: simdi, takvim: t)

        guard let indeks = liste.firstIndex(where: { $0.tarih >= bugun }) else {
            return Ilerleme(ad: "TATİL", kisaAd: "Tatil", oran: 0, sayi: 0,
                            birim: "gün", ileri: false, altMetin: "")
        }
        let sonraki = liste[indeks]
        let onceki  = liste[max(0, indeks - 1)]

        let toplam = max(1.0, sonraki.tarih.timeIntervalSince(onceki.tarih))
        let oran = min(max(bugun.timeIntervalSince(onceki.tarih) / toplam, 0), 1)
        let kalan = t.dateComponents([.day], from: bugun, to: sonraki.tarih).day ?? 0

        return Ilerleme(ad: sonraki.ad.buyukTR, kisaAd: sonraki.ad,
                        oran: oran, sayi: kalan, birim: "gün", ileri: false,
                        altMetin: bicimle(sonraki.tarih, "d MMMM", t))
    }

    // MARK: sayaç — yön otomatik

    private static func sayacIlerlemesi(_ s: Sayac?,
                                        simdi: Date, takvim t: Calendar) -> Ilerleme {
        guard let s else {
            return Ilerleme(ad: "SAYAÇ", kisaAd: "Sayaç", oran: 0, sayi: 0,
                            birim: "gün", ileri: false, altMetin: "Bir sayaç seç")
        }

        let fark = s.fark(simdi, t)

        if fark < 0 {                                   // geçmiş tarih → ileri sayım
            let gecen = -fark
            let yilIci = gecen % 365
            return Ilerleme(ad: s.ad.buyukTR, kisaAd: s.ad,
                            oran: Double(yilIci) / 365.0, sayi: gecen,
                            birim: "gündür", ileri: true,
                            altMetin: "\(365 - yilIci) gün sonra \(gecen / 365 + 1). yıl")
        }

        let pencere = 90.0                              // sayaç kurulalı varsayılan pencere
        let oran = min(max(1 - Double(fark) / pencere, 0), 1)

        return Ilerleme(ad: s.ad.buyukTR, kisaAd: s.ad, oran: oran, sayi: fark,
                        birim: "gün", ileri: false,
                        altMetin: bicimle(s.tarih, "d MMMM yyyy", t))
    }

    // MARK: yardımcılar

    private static func bicimle(_ tarih: Date, _ kalip: String, _ t: Calendar) -> String {
        let bicim = DateFormatter()
        bicim.calendar = t
        bicim.locale = t.locale
        bicim.setLocalizedDateFormatFromTemplate(kalip)
        return bicim.string(from: tarih)
    }

    private static func ayAdi(_ tarih: Date, _ t: Calendar) -> (duz: String, buyuk: String) {
        let bicim = DateFormatter()
        bicim.calendar = t
        bicim.locale = t.locale
        bicim.dateFormat = "LLLL"
        let ad = bicim.string(from: tarih)
        return (ad, ad.buyukTR)
    }

    /// Widget'ın bir sonraki yenilenme anı. Günlük bütçe ~40-70 yenileme olduğu için
    /// kapsam neyse o sınıra kadar bekliyoruz — boşa yenileme yapmıyoruz.
    static func sonrakiSinir(kapsam: Kapsam, simdi: Date = Date()) -> Date {
        let t = takvim
        switch kapsam {
        case .gun:
            return t.date(byAdding: .hour, value: 1, to: simdi)
                ?? simdi.addingTimeInterval(3600)
        default:
            let yarin = t.date(byAdding: .day, value: 1, to: simdi)
                ?? simdi.addingTimeInterval(86400)
            return t.startOfDay(for: yarin)
        }
    }
}
