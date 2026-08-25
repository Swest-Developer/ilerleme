/* Seyir — web arayüzü
 *
 * Kartlar `motor.js`'in ürettiği `ilerleme` yapısını çiziyor; hangi kapsamdan
 * geldiğini bilmiyorlar. Sayaçlar tarayıcıda (localStorage) duruyor — sunucu yok.
 */

const DEPO_ANAHTAR = "seyir.v1";

const TASARIMLAR = [
  { id: "kap",   ad: "Dolan kap" },
  { id: "yuzde", ad: "Yüzde" },
  { id: "kalan", ad: "Kalan" },
  { id: "halka", ad: "Halka" },
  { id: "nokta", ad: "Nokta" },
];

const RENKLER = ["#ff7a45", "#5bc0be", "#9b6dff", "#f2c14e", "#e26a6a", "#e8e8ea"];

const HAZIR_SAYACLAR = [
  ["🎂", "Doğum günü"], ["✈️", "Tatil"], ["📝", "Sınav"],
  ["❤️", "Yıldönümü"], ["🚭", "Bıraktım"],
];

/* ---------------------------------------------------------------- durum */

const varsayilan = { tasarim: "kap", renk: RENKLER[0], sayaclar: [] };

function oku() {
  try {
    const ham = localStorage.getItem(DEPO_ANAHTAR);
    return ham ? { ...varsayilan, ...JSON.parse(ham) } : { ...varsayilan };
  } catch {
    return { ...varsayilan };        // bozuk veri arayüzü kilitlemesin
  }
}

function yaz() {
  try { localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(D)); } catch {}
}

let D = oku();

/* ---------------------------------------------------------------- yardımcı */

const el = (etiket, sinif, ic) => {
  const e = document.createElement(etiket);
  if (sinif) e.className = sinif;
  if (ic != null) e.innerHTML = ic;
  return e;
};

const yuzde = (i) => Math.round(i.oran * 100);
const kuyruk = (i) => i.sayi + " " + i.birim + (i.ileri ? "" : " kaldı");

/* ---------------------------------------------------------------- tasarımlar */

function ciz_kap(kart, i) {
  kart.classList.add("dolu");
  const d = el("div", "dolgu");
  d.style.height = (i.oran * 100).toFixed(2) + "%";
  kart.append(d, basSatiri(i), el("div", "bosluk"),
              el("div", "dev", "%" + yuzde(i)), el("div", "alt", kuyruk(i)));
}

function ciz_yuzde(kart, i) {
  const c = el("div", "cubuk");
  c.append(Object.assign(el("div"), { style: `width:${i.oran * 100}%` }));
  kart.append(basSatiri(i), el("div", "bosluk"),
              el("div", "dev", "%" + yuzde(i)), c, el("div", "alt", kuyruk(i)));
}

function ciz_kalan(kart, i) {
  const dev = el("div", "dev", String(i.sayi));
  dev.style.fontSize = i.sayi > 999 ? "38px" : i.sayi > 99 ? "48px" : "58px";
  kart.append(basSatiri(i), el("div", "bosluk"), dev,
              el("div", "alt", i.birim + (i.ileri ? "" : " kaldı")));
}

function ciz_halka(kart, i) {
  const r = 42, c = 2 * Math.PI * r;
  const kap = el("div", "halka");
  kap.innerHTML = `
    <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
      <circle cx="52" cy="52" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="9"/>
      <circle cx="52" cy="52" r="${r}" fill="none" stroke="var(--vurgu)" stroke-width="9"
              stroke-linecap="round" stroke-dasharray="${c}"
              stroke-dashoffset="${c * (1 - i.oran)}"/>
    </svg>
    <div class="ortada">%${yuzde(i)}</div>`;
  kart.append(basSatiri(i), kap, el("div", "alt", kuyruk(i)));
}

function ciz_nokta(kart, i) {
  const izgara = el("div", "noktalar");
  izgara.style.gridTemplateColumns = `repeat(${i.sutun}, 1fr)`;
  const simdi = Math.round(i.oran * i.adet);
  const parca = document.createDocumentFragment();
  for (let k = 0; k < i.adet; k++) {
    const n = el("i");
    if (k < simdi - 1) n.className = "gecti";
    else if (k === simdi - 1) n.className = "simdi";
    parca.append(n);
  }
  izgara.append(parca);
  kart.append(basSatiri(i), izgara, el("div", "alt", kuyruk(i)));
}

const CIZERLER = { kap: ciz_kap, yuzde: ciz_yuzde, kalan: ciz_kalan,
                   halka: ciz_halka, nokta: ciz_nokta };

function basSatiri(i) {
  const s = el("div", "bas");
  s.append(el("i"), document.createTextNode(i.ad));
  return s;
}

function kartYap(i, silId) {
  const kart = el("article", "kart");
  (CIZERLER[D.tasarim] || ciz_kap)(kart, i);

  if (silId) {
    const d = el("button", "sil", "×");
    d.title = "Sayacı sil";
    d.setAttribute("aria-label", i.kisaAd + " sayacını sil");
    d.onclick = () => {
      D.sayaclar = D.sayaclar.filter((s) => s.id !== silId);
      yaz(); cizHepsi();
    };
    kart.append(d);
  }
  return kart;
}

/* ---------------------------------------------------------------- çizim */

function cizHepsi() {
  document.documentElement.style.setProperty("--vurgu", D.renk);

  const izgara = document.getElementById("izgara");
  izgara.textContent = "";

  izgara.append(el("h2", null, "Zaman"));
  for (const k of KAPSAMLAR) izgara.append(kartYap(hesapla(k.id)));

  izgara.append(el("h2", null, "Sayaçlarım"));
  for (const s of D.sayaclar) izgara.append(kartYap(hesapla("sayac", s), s.id));

  const ekle = el("button", "ekle", "<b>+</b>Sayaç ekle");
  ekle.onclick = pencereAc;
  izgara.append(ekle);

  for (const b of document.querySelectorAll("#tasarimlar button"))
    b.setAttribute("aria-pressed", String(b.dataset.t === D.tasarim));
  for (const b of document.querySelectorAll("#renkler button"))
    b.setAttribute("aria-pressed", String(b.dataset.r === D.renk));
}

/* ---------------------------------------------------------------- sayaç ekleme */

const pencere = () => document.getElementById("pencere");

function pencereAc() {
  document.getElementById("s-ad").value = "";
  document.getElementById("s-tarih").value = "";
  onizlemeTazele();
  pencere().showModal();
  document.getElementById("s-ad").focus();
}

/** Yön kullanıcıya sorulmuyor; cümle tarihten çıkıyor. */
function onizlemeTazele() {
  const tarih = document.getElementById("s-tarih").value;
  const kutu = document.getElementById("onizleme");
  const kaydet = document.getElementById("s-kaydet");

  if (!tarih) {
    kutu.innerHTML = "Bir tarih seç — gerisini kendi hesaplar.";
    kaydet.disabled = true;
    return;
  }
  const i = hesapla("sayac", { ad: document.getElementById("s-ad").value || "Sayaç", tarih });
  kutu.innerHTML = i.ileri
    ? `<b>${i.sayi} gündür</b> sürüyor.`
    : `<b>${i.sayi} gün kaldı</b>.`;
  kaydet.disabled = false;
}

function sayacKaydet(olay) {
  olay.preventDefault();
  const ad = document.getElementById("s-ad").value.trim() || "Sayaç";
  const tarih = document.getElementById("s-tarih").value;
  if (!tarih) return;

  D.sayaclar.push({ id: String(Date.now()), ad, tarih });
  yaz();
  pencere().close();
  cizHepsi();
}

/* ---------------------------------------------------------------- kurulum */

function kurulum() {
  const t = document.getElementById("tasarimlar");
  for (const x of TASARIMLAR) {
    const b = el("button", null, x.ad);
    b.dataset.t = x.id;
    b.onclick = () => { D.tasarim = x.id; yaz(); cizHepsi(); };
    t.append(b);
  }

  const r = document.getElementById("renkler");
  for (const renk of RENKLER) {
    const b = el("button");
    b.dataset.r = renk;
    b.style.background = renk;
    b.title = renk;
    b.setAttribute("aria-label", "Renk " + renk);
    b.onclick = () => { D.renk = renk; yaz(); cizHepsi(); };
    r.append(b);
  }

  const h = document.getElementById("hazirlar");
  for (const [simge, ad] of HAZIR_SAYACLAR) {
    const b = el("button", null, simge + " " + ad);
    b.type = "button";
    b.onclick = () => {
      document.getElementById("s-ad").value = ad;
      document.getElementById("s-tarih").focus();
      onizlemeTazele();
    };
    h.append(b);
  }

  document.getElementById("s-form").addEventListener("submit", sayacKaydet);
  document.getElementById("s-ad").addEventListener("input", onizlemeTazele);
  document.getElementById("s-tarih").addEventListener("input", onizlemeTazele);
  document.getElementById("s-vazgec").onclick = () => pencere().close();

  cizHepsi();

  /* Gün kapsamı saat başı değişiyor; sayfa açık kalırsa bayat kalmasın. */
  setInterval(cizHepsi, 60_000);
}

document.addEventListener("DOMContentLoaded", kurulum);
