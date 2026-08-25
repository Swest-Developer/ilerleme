// Seyir — Scriptable widget'ı
//
// Swift sürümünün aynı motoru, JavaScript'e taşınmış hâli. Mac, sertifika ya da
// sideload gerektirmiyor: App Store'dan Scriptable kurup bu dosyayı yapıştırman yeterli.
//
// KULLANIM
//   Ana ekrana Scriptable widget'ı ekle → uzun bas → "Widget'ı Düzenle"
//   Script    : Seyir
//   Parameter : kapsam + (isteğe bağlı) tasarım + (isteğe bağlı) renk
//
//   KAPSAM   yil · ay · hafta · gun · tatil   ya da   "Ehliyet sınavı, 2026-09-12"
//   TASARIM  kap · yuzde · kalan · halka · nokta · cizgi        (varsayılan: kap)
//   RENK     #ff7a45 gibi bir kod                               (varsayılan: turuncu)
//
//   Örnekler:
//     yil
//     tatil halka
//     gun nokta #5bc0be
//     Ehliyet sınavı, 2026-09-12 kalan
//     Sigarayı bıraktım, 2025-06-01
//
//   Sayaçta yön sormuyoruz: tarih gelecekteyse geri sayar ("19 gün kaldı"),
//   geçmişteyse ileri sayar ("449 gündür").

// ---------------------------------------------------------------- sabitler

const VARSAYILAN_RENK = "#ff7a45";
const ZEMIN  = "#1b1b1f";
const SOLUK  = 0.55;
const GRI    = "#808080";

// iPhone 13 widget iç genişlikleri (kenar boşluğu düşülmüş hâli).
// Scriptable cihaza göre ölçü vermediği için tasarımda bunları esas alıyoruz.
const IC_KUCUK = 130;
const IC_ORTA  = 310;

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

const KAPSAMLAR = ["yil", "ay", "hafta", "gun", "tatil"];
const TASARIMLAR = ["kap", "yuzde", "kalan", "halka", "nokta", "cizgi"];

// ---------------------------------------------------------------- yardımcılar

const kirp = (a, alt, ust) => Math.max(alt, Math.min(ust, a));
const gunBasi = (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate());
const buyukTR = (s) => s.toLocaleUpperCase("tr-TR");
const kucukTR = (s) => s.toLocaleLowerCase("tr-TR");

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
//   { ad, oran, sayi, birim, ileri, altMetin, adet, sutun }
// adet/sutun yalnızca nokta ızgarası için: kapsamın kaç birimden oluştuğu.

function hesapla(kapsam, sayac, simdi) {
  const y = simdi.getFullYear();

  if (kapsam === "sayac") {
    if (!sayac) return { ad: "SAYAÇ", oran: 0, sayi: 0, birim: "gün",
                         ileri: false, altMetin: "Tarih gir", adet: 90, sutun: 10 };

    const fark = Math.round((gunBasi(sayac.tarih) - gunBasi(simdi)) / 864e5);

    if (fark < 0) {                                  // geçmiş tarih → ileri sayım
      const gecen = -fark, yilIci = gecen % 365;
      return {
        ad: buyukTR(sayac.ad), oran: yilIci / 365, sayi: gecen,
        birim: "gündür", ileri: true,
        altMetin: (365 - yilIci) + " gün sonra " + (Math.floor(gecen / 365) + 1) + ". yıl",
        adet: 365, sutun: 21,
      };
    }

    const pencere = 90;                              // sayaç kurulalı varsayılan pencere
    return {
      ad: buyukTR(sayac.ad), oran: kirp(1 - fark / pencere, 0, 1), sayi: fark,
      birim: "gün", ileri: false, altMetin: tarihYaz(sayac.tarih, true),
      adet: pencere, sutun: 10,
    };
  }

  if (kapsam === "tatil") {
    const bugun = gunBasi(simdi);
    const l = tatilListesi(y);
    const i = l.findIndex((t) => t.d >= bugun);
    const sonraki = l[i], onceki = l[Math.max(0, i - 1)];
    const toplam = Math.max(1, Math.round((sonraki.d - onceki.d) / 864e5));
    return {
      ad: buyukTR(sonraki.ad), oran: kirp((bugun - onceki.d) / (sonraki.d - onceki.d), 0, 1),
      sayi: Math.round((sonraki.d - bugun) / 864e5),
      birim: "gün", ileri: false, altMetin: tarihYaz(sonraki.d, false),
      adet: toplam, sutun: toplam > 60 ? 10 : 7,
    };
  }

  // dönem kapsamları: başı ve sonu belli, kullanıcı hiçbir şey girmiyor
  let bas, son, ad, saatlik = false, adet, sutun;

  if (kapsam === "gun") {
    bas = gunBasi(simdi); son = new Date(bas.getTime() + 864e5);
    ad = "BUGÜN"; saatlik = true; adet = 24; sutun = 6;
  } else if (kapsam === "hafta") {
    const g = (simdi.getDay() + 6) % 7;              // pazartesi = 0
    bas = new Date(gunBasi(simdi).getTime() - g * 864e5);
    son = new Date(bas.getTime() + 7 * 864e5);
    ad = "BU HAFTA"; adet = 7; sutun = 7;
  } else if (kapsam === "ay") {
    bas = new Date(y, simdi.getMonth(), 1);
    son = new Date(y, simdi.getMonth() + 1, 1);
    ad = buyukTR(AYLAR[simdi.getMonth()]);
    adet = Math.round((son - bas) / 864e5); sutun = 7;
  } else {
    bas = new Date(y, 0, 1); son = new Date(y + 1, 0, 1);
    ad = String(y);
    adet = Math.round((son - bas) / 864e5); sutun = 21;
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
    altMetin: saatlik ? simdi.getHours() + ". saat" : tarihYaz(simdi, false),
    adet, sutun,
  };
}

// ---------------------------------------------------------------- parametre

/** "Ehliyet sınavı, 2026-09-12 halka #5bc0be" gibi bir metni çözüyor. */
function parametreCoz(ham) {
  const sonuc = { kapsam: "yil", tasarim: "kap", sayac: null, renk: VARSAYILAN_RENK };
  if (!ham) return sonuc;

  let metin = String(ham).trim();

  const renk = metin.match(/#[0-9a-fA-F]{6}/);
  if (renk) { sonuc.renk = renk[0]; metin = metin.replace(renk[0], " "); }

  metin = metin.replace(/\s+/g, " ").trim();

  // Tasarım adı YALNIZCA son sözcükte ve küçük harfle aranıyor. Aksi hâlde
  // "Kalan borç, 2026-09-12" gibi bir sayaç adının ilk kelimesi tasarım
  // sanılıp siliniyordu.
  const parcalar = metin.split(" ").filter(Boolean);
  if (parcalar.length && TASARIMLAR.includes(parcalar[parcalar.length - 1])) {
    sonuc.tasarim = parcalar.pop();
    metin = parcalar.join(" ").trim();
  }

  const kucuk = kucukTR(metin);
  if (KAPSAMLAR.includes(kucuk)) { sonuc.kapsam = kucuk; return sonuc; }
  if (metin === "") return sonuc;                    // sadece tasarım/renk verilmiş

  // kalan her şey sayaç: "ad, YYYY-AA-GG"
  const tarih = metin.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (tarih) {
    sonuc.kapsam = "sayac";
    sonuc.sayac = {
      ad: metin.replace(tarih[0], "").replace(/[,;]\s*$/, "").replace(/\s+/g, " ").trim() || "Sayaç",
      tarih: new Date(+tarih[1], +tarih[2] - 1, +tarih[3]),
    };
  }
  return sonuc;
}

// ---------------------------------------------------------------- çizim parçaları

function metin(kap, yazi, punto, renk, opaklik, kalin) {
  const t = kap.addText(yazi);
  t.font = kalin ? Font.boldSystemFont(punto) : Font.systemFont(punto);
  t.textColor = new Color(renk);
  if (opaklik != null) t.textOpacity = opaklik;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.5;
  return t;
}

function baslik(kap, i, renk) {
  const s = kap.addStack();
  s.centerAlignContent();
  const nokta = s.addStack();
  nokta.size = new Size(6, 6);
  nokta.cornerRadius = 3;
  nokta.backgroundColor = new Color(renk);
  s.addSpacer(5);
  const t = s.addText(i.ad);
  t.font = Font.semiboldSystemFont(10.5);
  t.textColor = Color.white();
  t.textOpacity = SOLUK;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return s;
}

function altYazi(kap, i) {
  metin(kap, i.sayi + " " + i.birim + (i.ileri ? "" : " kaldı"), 11, "#ffffff", SOLUK, false);
}

/** Yatay ilerleme çubuğu — iç içe iki kutu, genişlik orana göre. */
function cubuk(kap, oran, renk, genislik, yukseklik) {
  const dis = kap.addStack();
  dis.size = new Size(genislik, yukseklik);
  dis.cornerRadius = yukseklik / 2;
  dis.backgroundColor = new Color(GRI, 0.28);
  dis.layoutHorizontally();
  const ic = dis.addStack();
  ic.size = new Size(Math.max(2, genislik * kirp(oran, 0, 1)), yukseklik);
  ic.cornerRadius = yukseklik / 2;
  ic.backgroundColor = new Color(renk);
  dis.addSpacer();
}

/** Halka: Scriptable'da yay çizimi yok, çokgenle yaklaşıyoruz. */
function halkaResmi(oran, renk, boy) {
  const dc = new DrawContext();
  dc.size = new Size(boy, boy);
  dc.opaque = false;
  dc.respectScreenScale = true;

  const m = boy / 2, dis = boy / 2 - 1, ic = dis - 9;

  const yay = (bitis, r, g, b, a) => {
    if (bitis <= 0.0005) return;
    const adim = Math.max(8, Math.round(120 * bitis));
    const noktalar = [];
    for (let k = 0; k <= adim; k++) {
      const t = -Math.PI / 2 + 2 * Math.PI * bitis * (k / adim);
      noktalar.push(new Point(m + dis * Math.cos(t), m + dis * Math.sin(t)));
    }
    for (let k = adim; k >= 0; k--) {
      const t = -Math.PI / 2 + 2 * Math.PI * bitis * (k / adim);
      noktalar.push(new Point(m + ic * Math.cos(t), m + ic * Math.sin(t)));
    }
    const yol = new Path();
    yol.addLines(noktalar);
    yol.closeSubpath();
    dc.setFillColor(new Color(g, a));
    dc.addPath(yol);
    dc.fillPath();
  };

  yay(1, dis, GRI, ic, 0.26);
  yay(kirp(oran, 0, 1), dis, renk, ic, 1);
  return dc.getImage();
}

/** Nokta ızgarası: geçen birimler dolu, şimdiki beyaz. */
function noktaResmi(i, renk, genislik, yukseklik) {
  const dc = new DrawContext();
  dc.size = new Size(genislik, yukseklik);
  dc.opaque = false;
  dc.respectScreenScale = true;

  const n = Math.max(1, i.adet), sutun = Math.max(1, i.sutun);
  const satir = Math.ceil(n / sutun);
  const bosluk = n <= 31 ? 4 : 2;
  const cap = Math.max(2, Math.min(
    (genislik - (sutun - 1) * bosluk) / sutun,
    (yukseklik - (satir - 1) * bosluk) / satir
  ));

  const simdi = Math.round(i.oran * n);
  for (let k = 0; k < n; k++) {
    const x = (k % sutun) * (cap + bosluk);
    const y = Math.floor(k / sutun) * (cap + bosluk);
    if (k < simdi - 1)      dc.setFillColor(new Color(renk));
    else if (k === simdi - 1) dc.setFillColor(Color.white());
    else                     dc.setFillColor(new Color(GRI, 0.26));
    dc.fillEllipse(new Rect(x, y, cap, cap));
  }
  return dc.getImage();
}

// ---------------------------------------------------------------- tasarımlar
//
// Hepsi yalnızca `i` (İlerleme) görüyor — hangi kapsamdan geldiğini bilmiyorlar.

function ciz_kap(w, i, renk, orta) {
  // Widget'ın kendisi çubuk: arka plan gradyanına sert durak koyuyoruz.
  const g = new LinearGradient();
  g.colors = [new Color(renk), new Color(ZEMIN)];
  const d = kirp(i.oran, 0.0001, 0.9999);
  g.locations = [d, d];
  g.startPoint = new Point(0, 1);
  g.endPoint = new Point(0, 0);
  w.backgroundGradient = g;

  baslik(w, i, renk);
  w.addSpacer();
  metin(w, "%" + Math.round(i.oran * 100), orta ? 46 : 40, "#ffffff", null, true);
  w.addSpacer(6);
  altYazi(w, i);
}

function ciz_yuzde(w, i, renk, orta) {
  w.backgroundColor = new Color(ZEMIN);
  baslik(w, i, renk);
  w.addSpacer();
  metin(w, "%" + Math.round(i.oran * 100), orta ? 52 : 46, "#ffffff", null, true);
  w.addSpacer(10);
  cubuk(w, i.oran, renk, orta ? IC_ORTA : IC_KUCUK, 6);
  w.addSpacer(8);
  altYazi(w, i);
}

function ciz_kalan(w, i, renk, orta) {
  w.backgroundColor = new Color(ZEMIN);
  baslik(w, i, renk);
  w.addSpacer();
  metin(w, String(i.sayi), i.sayi > 99 ? (orta ? 76 : 68) : (orta ? 90 : 82), "#ffffff", null, true);
  w.addSpacer(6);
  metin(w, i.birim + (i.ileri ? "" : " kaldı"), 11, "#ffffff", SOLUK, false);
}

function ciz_halka(w, i, renk, orta) {
  w.backgroundColor = new Color(ZEMIN);
  baslik(w, i, renk);
  w.addSpacer();

  const satir = w.addStack();
  satir.centerAlignContent();
  if (!orta) satir.addSpacer();

  const kutu = satir.addStack();
  kutu.size = new Size(orta ? 104 : 96, orta ? 104 : 96);
  kutu.backgroundImage = halkaResmi(i.oran, renk, 200);
  kutu.centerAlignContent();
  const iciSatir = kutu.addStack();
  iciSatir.addSpacer();
  const ici = iciSatir.addStack();
  ici.layoutVertically();
  metin(ici, "%" + Math.round(i.oran * 100), 24, "#ffffff", null, true);
  iciSatir.addSpacer();

  satir.addSpacer();

  if (orta) {
    // Orta boyda halkanın yanı boş kalmasın: bilgi sağa geçiyor.
    const sag = satir.addStack();
    sag.layoutVertically();
    metin(sag, String(i.sayi), 40, "#ffffff", null, true);
    sag.addSpacer(2);
    metin(sag, i.birim + (i.ileri ? "" : " kaldı"), 12, "#ffffff", SOLUK, false);
    sag.addSpacer(8);
    metin(sag, i.altMetin, 11, "#ffffff", SOLUK, false);
    satir.addSpacer();
  }

  w.addSpacer();
  if (!orta) altYazi(w, i);
}

function ciz_nokta(w, i, renk, orta) {
  w.backgroundColor = new Color(ZEMIN);
  baslik(w, i, renk);
  w.addSpacer(8);

  const g = orta ? IC_ORTA : IC_KUCUK;
  const y = orta ? 64 : 78;
  w.addImage(noktaResmi(i, renk, g, y)).imageSize = new Size(g, y);

  w.addSpacer();
  altYazi(w, i);
}

function ciz_cizgi(w, i, renk, orta) {
  w.backgroundColor = new Color(ZEMIN);

  const ust = w.addStack();
  ust.centerAlignContent();
  metin(ust, i.ad, orta ? 26 : 18, "#ffffff", null, false);
  ust.addSpacer();
  metin(ust, "%" + (i.oran * 100).toFixed(1), orta ? 15 : 13, "#ffffff", SOLUK, false);

  w.addSpacer(orta ? 18 : 12);
  cubuk(w, i.oran, renk, orta ? IC_ORTA : IC_KUCUK, 2);
  w.addSpacer(orta ? 16 : 10);

  const alt = w.addStack();
  alt.centerAlignContent();
  metin(alt, i.altMetin, 10.5, "#ffffff", SOLUK, false);
  alt.addSpacer();
  metin(alt, i.sayi + " " + i.birim + (i.ileri ? "" : " kaldı"), 10.5, "#ffffff", SOLUK, false);
}

const CIZERLER = {
  kap: ciz_kap, yuzde: ciz_yuzde, kalan: ciz_kalan,
  halka: ciz_halka, nokta: ciz_nokta, cizgi: ciz_cizgi,
};

// ---------------------------------------------------------------- kurulum

function widgetKur(i, tasarim, renk, orta) {
  const w = new ListWidget();
  w.setPadding(14, 14, 14, 14);
  (CIZERLER[tasarim] || ciz_kap)(w, i, renk, orta);
  return w;
}

// ---------------------------------------------------------------- giriş

const p = parametreCoz(typeof args !== "undefined" ? args.widgetParameter : null);
const veri = hesapla(p.kapsam, p.sayac, new Date());
const orta = typeof config !== "undefined" && config.widgetFamily === "medium";
const widget = widgetKur(veri, p.tasarim, p.renk, orta);

// Bir sonraki tam saatte tazelensin. Sistem bunu istek olarak görüyor, garanti değil —
// günlük yenileme bütçesi zaten sınırlı.
const sonraki = new Date();
sonraki.setMinutes(0, 0, 0);
sonraki.setHours(sonraki.getHours() + 1);
widget.refreshAfterDate = sonraki;

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await (orta ? widget.presentMedium() : widget.presentSmall());
}
Script.complete();
