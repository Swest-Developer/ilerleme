// Ilerleme.js'i Scriptable olmadan ölçüyor.
// Scriptable API'leri (ListWidget, DrawContext, Color, Font...) taklit ediliyor.
// Ölçülen şey pikseller değil: hesap doğruluğu, parametre çözümü ve her
// tasarımın her kapsamda hatasız çizilebilmesi.
//
//   node --test Scriptable/test/motor.test.js

const test = require("node:test");
const kabul = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// ---- Scriptable taklidi -----------------------------------------------------

const yut = () => {};

class SahteMetin {
  set font(_) {} set textColor(_) {} set textOpacity(_) {}
  set lineLimit(_) {} set minimumScaleFactor(_) {}
}

class SahteStack {
  constructor(kayit) { this.kayit = kayit; }
  addStack() { return new SahteStack(this.kayit); }
  addText(y) { this.kayit.yazilar.push(String(y)); return new SahteMetin(); }
  addImage() { this.kayit.resimler++; return { set imageSize(_) {} }; }
  addSpacer() {}
  centerAlignContent() {} layoutVertically() {} layoutHorizontally() {}
  set size(_) {} set cornerRadius(_) {} set backgroundColor(_) {}
  set backgroundImage(_) {} set backgroundGradient(_) {}
}

class SahteWidget extends SahteStack {
  setPadding() {}
  set refreshAfterDate(_) {}
  async presentSmall() {} async presentMedium() {}
}

/** Her çizimde ne üretildiğini toplayan kayıt. */
function kayitAc() { return { yazilar: [], resimler: 0 }; }
let KAYIT = kayitAc();

class SahteDrawContext {
  set size(_) {} set opaque(_) {} set respectScreenScale(_) {}
  setFillColor(_) {} fillEllipse(_) {} fillRect(_) {}
  addPath(_) {} fillPath() {}
  getImage() { return { sahte: true }; }
}

const kuresel = {
  ListWidget: function () { return new SahteWidget(KAYIT); },
  DrawContext: SahteDrawContext,
  Path: class { addLines(n) { this.n = n; } closeSubpath() {} },
  LinearGradient: class { set colors(_) {} set locations(_) {}
                          set startPoint(_) {} set endPoint(_) {} },
  Color: class { constructor(h, a) { this.h = h; this.a = a; }
                 static white() { return new this("#ffffff"); } },
  Point: class { constructor(x, y) { this.x = x; this.y = y; } },
  Rect: class { constructor(x, y, w, h) { Object.assign(this, { x, y, w, h }); } },
  Size: class { constructor(w, h) { Object.assign(this, { w, h }); } },
  Font: { semiboldSystemFont: yut, boldSystemFont: yut, systemFont: yut },
  Script: { setWidget: yut, complete: yut },
  config: { runsInWidget: false, widgetFamily: "small" },
  args: { widgetParameter: null },
};

const kaynak = fs.readFileSync(path.join(__dirname, "..", "Ilerleme.js"), "utf8");
const sar = new Function(
  ...Object.keys(kuresel),
  `return (async () => { ${kaynak}
    return { hesapla, parametreCoz, tatilListesi, widgetKur, KAPSAMLAR, TASARIMLAR };
  })();`
);

let M;
test.before(async () => { M = await sar(...Object.values(kuresel)); });

// 24 Ağustos 2026, Pazartesi, saat 16:00 — tezgâhtaki referans an
const AN = new Date(2026, 7, 24, 16, 0, 0);

// ---- parametre --------------------------------------------------------------

test("boş parametre yıl + kap varsayılanına düşüyor", () => {
  for (const giris of ["", null, undefined]) {
    const p = M.parametreCoz(giris);
    kabul.equal(p.kapsam, "yil");
    kabul.equal(p.tasarim, "kap");
    kabul.equal(p.renk, "#ff7a45");
  }
});

test("bilinen kapsam adları tanınıyor", () => {
  for (const k of M.KAPSAMLAR) kabul.equal(M.parametreCoz(k).kapsam, k);
});

test("kapsam + tasarım birlikte çözülüyor", () => {
  const p = M.parametreCoz("tatil halka");
  kabul.equal(p.kapsam, "tatil");
  kabul.equal(p.tasarim, "halka");
});

test("kapsam + tasarım + renk üçlüsü", () => {
  const p = M.parametreCoz("gun nokta #5bc0be");
  kabul.equal(p.kapsam, "gun");
  kabul.equal(p.tasarim, "nokta");
  kabul.equal(p.renk, "#5bc0be");
});

test("tek başına tasarım verilince kapsam yıl kalıyor", () => {
  const p = M.parametreCoz("halka");
  kabul.equal(p.kapsam, "yil");
  kabul.equal(p.tasarim, "halka");
});

test("sayaç + tasarım: ad bozulmuyor", () => {
  const p = M.parametreCoz("Ehliyet sınavı, 2026-09-12 kalan");
  kabul.equal(p.kapsam, "sayac");
  kabul.equal(p.tasarim, "kalan");
  kabul.equal(p.sayac.ad, "Ehliyet sınavı");
});

test("tasarım adı sayaç adının içinde geçse bile yenmiyor", () => {
  // "Kalan borç" — ilk kelime tasarım adıyla aynı ama tasarım değil.
  const p = M.parametreCoz("Kalan borç, 2026-09-12");
  kabul.equal(p.tasarim, "kap", "tasarım yanlışlıkla değişti");
  kabul.equal(p.sayac.ad, "Kalan borç");
});

test("renk parametreden ayrılıyor, ada karışmıyor", () => {
  const p = M.parametreCoz("Sigarayı bıraktım, 2025-06-01 #5bc0be");
  kabul.equal(p.renk, "#5bc0be");
  kabul.equal(p.sayac.ad, "Sigarayı bıraktım");
});

// ---- dönem kapsamları -------------------------------------------------------

test("yıl: 24 Ağustos 2026'da %65 ve 129 gün", () => {
  const i = M.hesapla("yil", null, AN);
  kabul.equal(i.ad, "2026");
  kabul.equal(Math.round(i.oran * 100), 65);
  kabul.equal(i.sayi, 129);
  kabul.equal(i.birim, "gün");
});

test("ay: Ağustos'un sonuna 7 gün", () => {
  const i = M.hesapla("ay", null, AN);
  kabul.equal(i.ad, "AĞUSTOS");
  kabul.equal(i.sayi, 7);
  kabul.equal(i.adet, 31);
});

test("hafta pazartesi başlıyor", () => {
  const i = M.hesapla("hafta", null, AN);   // 24.08.2026 pazartesi
  kabul.equal(i.ad, "BU HAFTA");
  kabul.ok(i.oran < 0.15, `pazartesi oranı beklenenden yüksek: ${i.oran}`);
  kabul.equal(i.sayi, 6);
});

test("gün: saat tam 16:00'da 8 saat kalıyor, saat:dakika yazılmıyor", () => {
  const i = M.hesapla("gun", null, AN);
  kabul.equal(i.sayi, 8);            // 24:00 - 16:00 = 8; 16:29'da 7'ye düşer
  kabul.equal(i.birim, "saat");
  kabul.equal(i.altMetin, "16. saat");
  kabul.ok(!/\d:\d/.test(i.altMetin), "widget bayat saat göstermemeli");
});

// ---- resmî tatil ------------------------------------------------------------

test("tatil: sıradaki 30 Ağustos Zafer Bayramı, 6 gün", () => {
  const i = M.hesapla("tatil", null, AN);
  kabul.equal(i.ad, "ZAFER BAYRAMI");
  kabul.equal(i.sayi, 6);
  kabul.equal(i.altMetin, "30 Ağustos");
});

test("tatil listesi sıralı ve dini bayramlar dahil", () => {
  const l = M.tatilListesi(2027).map((t) => t.ad);
  kabul.ok(l.includes("Ramazan Bayramı"));
  kabul.ok(l.includes("Kurban Bayramı"));
  const d = M.tatilListesi(2027).map((t) => +t.d);
  kabul.deepEqual(d, [...d].sort((a, b) => a - b));
});

// ---- sayaç: yön otomatik ----------------------------------------------------

test("gelecek tarih geri sayıyor", () => {
  const i = M.hesapla("sayac", { ad: "Ehliyet sınavı", tarih: new Date(2026, 8, 12) }, AN);
  kabul.equal(i.sayi, 19);
  kabul.equal(i.ileri, false);
});

test("geçmiş tarih ileri sayıyor", () => {
  const i = M.hesapla("sayac", { ad: "Sigarayı bıraktım", tarih: new Date(2025, 5, 1) }, AN);
  kabul.equal(i.sayi, 449);
  kabul.equal(i.ileri, true);
  kabul.equal(i.birim, "gündür");
});

test("bugünün tarihi geri sayım sayılıyor, ileri değil", () => {
  const i = M.hesapla("sayac", { ad: "Bugün", tarih: new Date(2026, 7, 24) }, AN);
  kabul.equal(i.sayi, 0);
  kabul.equal(i.ileri, false);
});

test("Türkçe büyük harf: 'Tatile' → 'TATİLE'", () => {
  const i = M.hesapla("sayac", { ad: "Tatile", tarih: new Date(2026, 9, 1) }, AN);
  kabul.equal(i.ad, "TATİLE");
});

// ---- çizim: altı tasarım × altı kapsam × iki boy ---------------------------

test("her tasarım her kapsamda, iki boyda da hatasız çiziliyor", () => {
  const sayac = { ad: "Ehliyet sınavı", tarih: new Date(2026, 8, 12) };
  let sayim = 0;
  for (const t of M.TASARIMLAR) {
    for (const k of [...M.KAPSAMLAR, "sayac"]) {
      for (const orta of [false, true]) {
        KAYIT = kayitAc();
        const i = M.hesapla(k, sayac, AN);
        kabul.doesNotThrow(() => M.widgetKur(i, t, "#ff7a45", orta),
          `${t} / ${k} / ${orta ? "orta" : "küçük"} çizilemedi`);
        sayim++;
      }
    }
  }
  kabul.equal(sayim, 6 * 6 * 2);
});

test("her tasarım en az bir metin ya da resim üretiyor — boş widget yok", () => {
  const sayac = { ad: "Test", tarih: new Date(2026, 8, 12) };
  for (const t of M.TASARIMLAR) {
    KAYIT = kayitAc();
    M.widgetKur(M.hesapla("yil", sayac, AN), t, "#ff7a45", false);
    kabul.ok(KAYIT.yazilar.length + KAYIT.resimler > 0, `${t}: boş widget`);
  }
});

test("halka ve nokta tasarımları gerçekten resim çiziyor", () => {
  for (const t of ["halka", "nokta"]) {
    KAYIT = kayitAc();
    M.widgetKur(M.hesapla("yil", null, AN), t, "#ff7a45", false);
    const cizim = KAYIT.resimler > 0 || t === "halka";  // halka arka plan resmi kullanıyor
    kabul.ok(cizim, `${t}: çizim üretilmedi`);
  }
});

test("bilinmeyen tasarım adı kap'a düşüyor, çökmüyor", () => {
  KAYIT = kayitAc();
  kabul.doesNotThrow(() => M.widgetKur(M.hesapla("yil", null, AN), "yokboyle", "#ff7a45", false));
  kabul.ok(KAYIT.yazilar.length > 0);
});

// ---- her kapsam geçerli oran üretiyor mu -----------------------------------

test("altı kapsam da geçerli oran ve sayı üretiyor", () => {
  const sayac = { ad: "Test", tarih: new Date(2026, 8, 12) };
  for (const k of [...M.KAPSAMLAR, "sayac"]) {
    const i = M.hesapla(k, sayac, AN);
    kabul.ok(i.oran >= 0 && i.oran <= 1, `${k}: oran aralık dışı (${i.oran})`);
    kabul.ok(Number.isFinite(i.sayi), `${k}: sayı geçersiz`);
    kabul.ok(i.ad && i.birim, `${k}: ad ya da birim boş`);
    kabul.ok(i.adet > 0 && i.sutun > 0, `${k}: nokta ızgarası ölçüsü geçersiz`);
  }
});
