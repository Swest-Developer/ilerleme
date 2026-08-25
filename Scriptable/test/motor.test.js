// Ilerleme.js'in motorunu Scriptable olmadan ölçüyor.
// Scriptable API'leri (ListWidget, Color, Font...) taklit ediliyor; test edilen
// şey çizim değil, hesap: kapsamlar, sayaç yönü, parametre çözümü.
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
class SahteWidget {
  setPadding() {} addSpacer() {}
  addText() { return new SahteMetin(); }
  set backgroundGradient(_) {} set refreshAfterDate(_) {}
  async presentSmall() {}
}

const kuresel = {
  ListWidget: SahteWidget,
  LinearGradient: class { set colors(_) {} set locations(_) {}
                          set startPoint(_) {} set endPoint(_) {} },
  Color: class { constructor(h) { this.h = h; } static white() { return new this("#fff"); } },
  Point: class { constructor(x, y) { this.x = x; this.y = y; } },
  Font: { semiboldSystemFont: yut, boldSystemFont: yut, systemFont: yut },
  Script: { setWidget: yut, complete: yut },
  config: { runsInWidget: false, widgetFamily: "small" },
  args: { widgetParameter: null },
};

// Dosyayı olduğu gibi çalıştırıp iç fonksiyonlara erişiyoruz.
const kaynak = fs.readFileSync(path.join(__dirname, "..", "Ilerleme.js"), "utf8");
const sar = new Function(
  ...Object.keys(kuresel),
  `return (async () => { ${kaynak}\n; return { hesapla, parametreCoz, tatilListesi }; })();`
);
let M;
test.before(async () => { M = await sar(...Object.values(kuresel)); });

// 24 Ağustos 2026, Pazartesi, saat 16:00 — tezgâhtaki referans an
const AN = new Date(2026, 7, 24, 16, 0, 0);

// ---- parametre --------------------------------------------------------------

test("boş parametre yıla düşüyor", () => {
  kabul.equal(M.parametreCoz("").kapsam, "yil");
  kabul.equal(M.parametreCoz(null).kapsam, "yil");
});

test("bilinen kapsam adları tanınıyor", () => {
  for (const k of ["yil", "ay", "hafta", "gun", "tatil"])
    kabul.equal(M.parametreCoz(k).kapsam, k);
});

test("ad + tarih sayaca çevriliyor", () => {
  const p = M.parametreCoz("Ehliyet sınavı, 2026-09-12");
  kabul.equal(p.kapsam, "sayac");
  kabul.equal(p.sayac.ad, "Ehliyet sınavı");
  kabul.equal(p.sayac.tarih.getMonth(), 8);        // Eylül
  kabul.equal(p.sayac.tarih.getDate(), 12);
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
});

test("hafta pazartesi başlıyor — pazartesi %10'un altında", () => {
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
  kabul.equal(i.birim, "gün");
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

// ---- her kapsam çizilebiliyor mu -------------------------------------------

test("altı kapsam da geçerli oran üretiyor", () => {
  const sayac = { ad: "Test", tarih: new Date(2026, 8, 12) };
  for (const k of ["yil", "ay", "hafta", "gun", "tatil", "sayac"]) {
    const i = M.hesapla(k, sayac, AN);
    kabul.ok(i.oran >= 0 && i.oran <= 1, `${k}: oran aralık dışı (${i.oran})`);
    kabul.ok(Number.isFinite(i.sayi), `${k}: sayı geçersiz`);
    kabul.ok(i.ad && i.birim, `${k}: ad ya da birim boş`);
  }
});
