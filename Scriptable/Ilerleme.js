// İlerleme — Scriptable widget'ı
//
// Swift sürümünün aynı motoru, JavaScript'e taşınmış hâli. Mac, sertifika ya da
// sideload gerektirmiyor: App Store'dan Scriptable kurup bu dosyayı yapıştırman yeterli.
//
// KULLANIM
//   Ana ekrana Scriptable widget'ı ekle → uzun bas → "Widget'ı Düzenle"
//   Script  : Ilerleme
//   Parameter alanına şunlardan birini yaz:
//
//     (boş)                      → yıl
//     yil | ay | hafta | gun     → o dönem
//     tatil                      → bir sonraki resmî tatil
//     Ehliyet sınavı, 2026-09-12 → sayaç (ad, tarih)
//
//   Sayaçta yön sormuyoruz: tarih gelecekteyse geri sayar ("19 gün kaldı"),
//   geçmişteyse ileri sayar ("449 gündür").
//
//   Renk değiştirmek için: parametrenin sonuna " #5bc0be" gibi bir renk ekle.

// ---------------------------------------------------------------- ayarlar

const VARSAYILAN_RENK = "#ff7a45";
const ZEMIN           = "#1b1b1f";
const SOLUK           = 0.55;

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
               "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

// Resmî tatiller. Sabit tarihliler her yıl tekrar ediyor; dini bayramlar hicri
// takvime bağlı olduğu için tek tek yazılıyor — TABLO HER YIL GÜNCELLENMELİ.
// Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.
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

// ---------------------------------------------------------------- yardımcılar

const kirp = (a, alt, ust) => Math.max(alt, Math.min(ust, a));
const gunBasi = (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate());
const buyukTR = (s) => s.toLocaleUpperCase("tr-TR");

/** Türkçe "12 Eylül 2026" biçimi. */
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

// ---------------------------------------------------------------- motor
//
// Her kapsam aynı yapıyı döndürüyor; çizim tarafı kapsamı bilmiyor.
//   { ad, oran, sayi, birim, ileri, altMetin }

function hesapla(kapsam, sayac, simdi) {
  const y = simdi.getFullYear();

  if (kapsam === "sayac") {
    if (!sayac) return { ad: "SAYAÇ", oran: 0, sayi: 0, birim: "gün",
                         ileri: false, altMetin: "Tarih gir" };

    const fark = Math.round((gunBasi(sayac.tarih) - gunBasi(simdi)) / 864e5);

    if (fark < 0) {                                  // geçmiş tarih → ileri sayım
      const gecen = -fark, yilIci = gecen % 365;
      return {
        ad: buyukTR(sayac.ad), oran: yilIci / 365, sayi: gecen,
        birim: "gündür", ileri: true,
        altMetin: (365 - yilIci) + " gün sonra " + (Math.floor(gecen / 365) + 1) + ". yıl",
      };
    }

    const pencere = 90;                              // sayaç kurulalı varsayılan pencere
    return {
      ad: buyukTR(sayac.ad), oran: kirp(1 - fark / pencere, 0, 1), sayi: fark,
      birim: "gün", ileri: false, altMetin: tarihYaz(sayac.tarih, true),
    };
  }

  if (kapsam === "tatil") {
    const bugun = gunBasi(simdi);
    const l = tatilListesi(y);
    const i = l.findIndex((t) => t.d >= bugun);
    const sonraki = l[i], onceki = l[Math.max(0, i - 1)];
    const toplam = Math.max(1, sonraki.d - onceki.d);
    return {
      ad: buyukTR(sonraki.ad), oran: kirp((bugun - onceki.d) / toplam, 0, 1),
      sayi: Math.round((sonraki.d - bugun) / 864e5),
      birim: "gün", ileri: false, altMetin: tarihYaz(sonraki.d, false),
    };
  }

  // dönem kapsamları: başı ve sonu belli, kullanıcı hiçbir şey girmiyor
  let bas, son, ad, saatlik = false;

  if (kapsam === "gun") {
    bas = gunBasi(simdi); son = new Date(bas.getTime() + 864e5);
    ad = "BUGÜN"; saatlik = true;
  } else if (kapsam === "hafta") {
    const g = (simdi.getDay() + 6) % 7;              // pazartesi = 0
    bas = new Date(gunBasi(simdi).getTime() - g * 864e5);
    son = new Date(bas.getTime() + 7 * 864e5);
    ad = "BU HAFTA";
  } else if (kapsam === "ay") {
    bas = new Date(y, simdi.getMonth(), 1);
    son = new Date(y, simdi.getMonth() + 1, 1);
    ad = buyukTR(AYLAR[simdi.getMonth()]);
  } else {
    bas = new Date(y, 0, 1); son = new Date(y + 1, 0, 1);
    ad = String(y);
  }

  const oran = kirp((simdi - bas) / (son - bas), 0, 1);
  const kalanMs = son - simdi;

  // Gün kapsamında saat:dakika YAZMIYORUZ. Widget dakikada bir yenilenmiyor;
  // bayat bir saat göstermektense saat dilimini yazmak dürüst.
  return {
    ad, oran,
    sayi: Math.max(0, Math.floor(kalanMs / (saatlik ? 36e5 : 864e5))),
    birim: saatlik ? "saat" : "gün",
    ileri: false,
    altMetin: saatlik ? simdi.getHours() + ". saat"
                      : tarihYaz(simdi, false),
  };
}

// ---------------------------------------------------------------- parametre

/** "Ehliyet sınavı, 2026-09-12 #5bc0be" gibi bir metni çözüyor. */
function parametreCoz(ham) {
  const sonuc = { kapsam: "yil", sayac: null, renk: VARSAYILAN_RENK };
  if (!ham) return sonuc;

  let metin = String(ham).trim();

  const renk = metin.match(/#[0-9a-fA-F]{6}/);
  if (renk) { sonuc.renk = renk[0]; metin = metin.replace(renk[0], "").trim(); }

  const bilinen = ["yil", "ay", "hafta", "gun", "tatil"];
  const kucuk = metin.toLocaleLowerCase("tr-TR");
  if (bilinen.includes(kucuk)) { sonuc.kapsam = kucuk; return sonuc; }

  // kalan her şey sayaç: "ad, YYYY-AA-GG"
  const tarih = metin.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (tarih) {
    sonuc.kapsam = "sayac";
    sonuc.sayac = {
      ad: metin.replace(tarih[0], "").replace(/[,;]\s*$/, "").trim() || "Sayaç",
      tarih: new Date(+tarih[1], +tarih[2] - 1, +tarih[3]),
    };
  }
  return sonuc;
}

// ---------------------------------------------------------------- çizim
//
// "Dolan kap": widget'ın kendisi çubuk, alttan yukarı doluyor.
// Scriptable'da arka plan gradyanına sert durak koyarak yapılıyor.

function widgetKur(i, renk, kucuk) {
  const w = new ListWidget();
  w.setPadding(14, 14, 14, 14);

  const g = new LinearGradient();
  g.colors = [new Color(renk), new Color(ZEMIN)];
  const d = kirp(i.oran, 0.0001, 0.9999);
  g.locations = [d, d];                 // sert geçiş = dolum sınırı
  g.startPoint = new Point(0, 1);       // alttan
  g.endPoint = new Point(0, 0);         // yukarı
  w.backgroundGradient = g;

  const bas = w.addText(i.ad);
  bas.font = Font.semiboldSystemFont(10.5);
  bas.textColor = Color.white();
  bas.textOpacity = SOLUK;
  bas.lineLimit = 1;
  bas.minimumScaleFactor = 0.7;

  w.addSpacer();

  const buyuk = w.addText("%" + Math.round(i.oran * 100));
  buyuk.font = Font.boldSystemFont(kucuk ? 40 : 46);
  buyuk.textColor = Color.white();
  buyuk.minimumScaleFactor = 0.6;
  buyuk.lineLimit = 1;

  w.addSpacer(6);

  const alt = w.addText(i.sayi + " " + i.birim + (i.ileri ? "" : " kaldı"));
  alt.font = Font.systemFont(11);
  alt.textColor = Color.white();
  alt.textOpacity = SOLUK;
  alt.lineLimit = 1;

  return w;
}

// ---------------------------------------------------------------- giriş

const p = parametreCoz(typeof args !== "undefined" ? args.widgetParameter : null);
const veri = hesapla(p.kapsam, p.sayac, new Date());
const widget = widgetKur(veri, p.renk, config.widgetFamily !== "medium");

// Bir sonraki tam saatte tazelensin. Sistem bunu bir istek olarak görüyor,
// garanti değil — günlük yenileme bütçesi zaten sınırlı.
const sonraki = new Date();
sonraki.setMinutes(0, 0, 0);
sonraki.setHours(sonraki.getHours() + 1);
widget.refreshAfterDate = sonraki;

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();      // uygulamada çalıştırınca önizleme
}
Script.complete();
