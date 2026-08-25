/* Seyir — motor
 *
 * Scriptable ve Swift sürümleriyle AYNI mantık. Tek kural değişmedi:
 * çizim tarafı kapsamı bilmez, herkes aynı `ilerleme` yapısını alır.
 *
 *   { ad, kisaAd, oran, sayi, birim, ileri, altMetin, adet, sutun }
 */

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
               "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

/* Resmî tatiller. Sabit tarihliler her yıl tekrar ediyor; dini bayramlar hicri
   takvime bağlı olduğu için tek tek yazılıyor — TABLO HER YIL GÜNCELLENMELİ.
   Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs. */
const TATIL_SABIT = [
  ["Yılbaşı", 0, 1],
  ["Ulusal Egemenlik ve Çocuk Bayramı", 3, 23],
  ["Emek ve Dayanışma Günü", 4, 1],
  ["Gençlik ve Spor Bayramı", 4, 19],
  ["Demokrasi ve Millî Birlik Günü", 6, 15],
  ["Zafer Bayramı", 7, 30],
  ["Cumhuriyet Bayramı", 9, 29],
];
const TATIL_DINI = [
  ["Ramazan Bayramı", "2027-03-09"],
  ["Kurban Bayramı",  "2027-05-16"],
];

const KAPSAMLAR = [
  { id: "gun",   ad: "Bugün" },
  { id: "hafta", ad: "Bu hafta" },
  { id: "ay",    ad: "Bu ay" },
  { id: "yil",   ad: "Bu yıl" },
  { id: "tatil", ad: "Resmî tatil" },
];

const kirp = (a, alt, ust) => Math.max(alt, Math.min(ust, a));
const gunBasi = (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate());
const buyukTR = (s) => s.toLocaleUpperCase("tr-TR");

function tarihYaz(t, yilDahil) {
  return t.getDate() + " " + AYLAR[t.getMonth()] + (yilDahil ? " " + t.getFullYear() : "");
}

function tatilListesi(yil) {
  const l = [];
  for (const y of [yil - 1, yil, yil + 1])
    for (const [ad, a, g] of TATIL_SABIT) l.push({ ad, d: new Date(y, a, g) });
  for (const [ad, iso] of TATIL_DINI) {
    const [y, a, g] = iso.split("-").map(Number);
    l.push({ ad, d: new Date(y, a - 1, g) });
  }
  return l.sort((x, y) => x.d - y.d);
}

/** Sayacın yönü SORULMUYOR: gelecekse geri, geçmişse ileri sayar. */
function sayacIlerlemesi(sayac, simdi) {
  const fark = Math.round((gunBasi(new Date(sayac.tarih)) - gunBasi(simdi)) / 864e5);

  if (fark < 0) {
    const gecen = -fark, yilIci = gecen % 365;
    return {
      ad: buyukTR(sayac.ad), kisaAd: sayac.ad,
      oran: yilIci / 365, sayi: gecen, birim: "gündür", ileri: true,
      altMetin: (365 - yilIci) + " gün sonra " + (Math.floor(gecen / 365) + 1) + ". yıl",
      adet: 365, sutun: 21,
    };
  }

  const pencere = 90;                    // sayaç kurulalı varsayılan pencere
  return {
    ad: buyukTR(sayac.ad), kisaAd: sayac.ad,
    oran: kirp(1 - fark / pencere, 0, 1), sayi: fark, birim: "gün", ileri: false,
    altMetin: tarihYaz(new Date(sayac.tarih), true),
    adet: pencere, sutun: 10,
  };
}

function hesapla(kapsam, sayac, simdi = new Date()) {
  const y = simdi.getFullYear();

  if (kapsam === "sayac") {
    if (!sayac) return { ad: "SAYAÇ", kisaAd: "Sayaç", oran: 0, sayi: 0,
                         birim: "gün", ileri: false, altMetin: "Tarih gir",
                         adet: 90, sutun: 10 };
    return sayacIlerlemesi(sayac, simdi);
  }

  if (kapsam === "tatil") {
    const bugun = gunBasi(simdi);
    const l = tatilListesi(y);
    const i = l.findIndex((t) => t.d >= bugun);
    const sonraki = l[i], onceki = l[Math.max(0, i - 1)];
    const toplam = Math.max(1, Math.round((sonraki.d - onceki.d) / 864e5));
    return {
      ad: buyukTR(sonraki.ad), kisaAd: sonraki.ad,
      oran: kirp((bugun - onceki.d) / (sonraki.d - onceki.d), 0, 1),
      sayi: Math.round((sonraki.d - bugun) / 864e5),
      birim: "gün", ileri: false, altMetin: tarihYaz(sonraki.d, false),
      adet: toplam, sutun: toplam > 60 ? 10 : 7,
    };
  }

  let bas, son, ad, kisaAd, saatlik = false, adet, sutun;

  if (kapsam === "gun") {
    bas = gunBasi(simdi); son = new Date(bas.getTime() + 864e5);
    ad = "BUGÜN"; kisaAd = "Bugün"; saatlik = true; adet = 24; sutun = 6;
  } else if (kapsam === "hafta") {
    const g = (simdi.getDay() + 6) % 7;                  // pazartesi = 0
    bas = new Date(gunBasi(simdi).getTime() - g * 864e5);
    son = new Date(bas.getTime() + 7 * 864e5);
    ad = "BU HAFTA"; kisaAd = "Bu hafta"; adet = 7; sutun = 7;
  } else if (kapsam === "ay") {
    bas = new Date(y, simdi.getMonth(), 1);
    son = new Date(y, simdi.getMonth() + 1, 1);
    ad = buyukTR(AYLAR[simdi.getMonth()]); kisaAd = AYLAR[simdi.getMonth()];
    adet = Math.round((son - bas) / 864e5); sutun = 7;
  } else {
    bas = new Date(y, 0, 1); son = new Date(y + 1, 0, 1);
    ad = String(y); kisaAd = String(y);
    adet = Math.round((son - bas) / 864e5); sutun = 21;
  }

  const oran = kirp((simdi - bas) / (son - bas), 0, 1);
  const kalanMs = son - simdi;

  /* Web'de dakika gösterebilirdik ama üç sürüm aynı dili konuşsun diye
     burada da saat dilimi yazıyoruz. */
  return {
    ad, kisaAd, oran,
    sayi: Math.max(0, Math.floor(kalanMs / (saatlik ? 36e5 : 864e5))),
    birim: saatlik ? "saat" : "gün",
    ileri: false,
    altMetin: saatlik ? simdi.getHours() + ". saat" : tarihYaz(simdi, false),
    adet, sutun,
  };
}

/* Node testleri için; tarayıcıda global kalıyor. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { hesapla, tatilListesi, KAPSAMLAR, AYLAR, tarihYaz };
}
