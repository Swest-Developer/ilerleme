/* Seyir — raf: kitap, anime, manga, dizi, film
 *
 * Arama kaynakları anahtarsız ve ücretsiz olanlar:
 *   kitap        → Open Library  (kapak + medyan sayfa sayısı)
 *   anime, manga → AniList       (kapak + bölüm sayısı)
 *   dizi, film   → kaynak yok, elle giriliyor.
 *                  TMDB anahtar istiyor; anahtarı koda gömmek doğru değil.
 *
 * Ölçüldü (25.08.2026): Jikan/MyAnimeList 504 veriyor, o yüzden AniList seçildi.
 */

const ARAMA_BEKLEME = 400;   // tuşa basıldıktan sonra beklenen süre (ms)

/* ---------------------------------------------------------------- kaynaklar */

async function araOpenLibrary(sorgu) {
  const url = "https://openlibrary.org/search.json?limit=8&fields=title,author_name,cover_i,number_of_pages_median&q="
            + encodeURIComponent(sorgu);
  const y = await fetch(url);
  if (!y.ok) throw new Error("Open Library " + y.status);
  const d = await y.json();
  return (d.docs || []).map((k) => ({
    ad: k.title,
    altBilgi: (k.author_name || []).slice(0, 1).join(""),
    toplam: k.number_of_pages_median || 0,
    kapak: k.cover_i ? `https://covers.openlibrary.org/b/id/${k.cover_i}-M.jpg` : "",
  }));
}

async function araAniList(sorgu, tur) {
  const q = `query($q:String){Page(perPage:8){media(search:$q,type:${tur}){
      title{romaji english} episodes chapters coverImage{medium} startDate{year} }}}`;
  const y = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: q, variables: { q: sorgu } }),
  });
  if (!y.ok) throw new Error("AniList " + y.status);
  const d = await y.json();
  return (d?.data?.Page?.media || []).map((m) => ({
    ad: m.title.english || m.title.romaji,
    altBilgi: m.startDate?.year ? String(m.startDate.year) : "",
    toplam: (tur === "ANIME" ? m.episodes : m.chapters) || 0,
    kapak: m.coverImage?.medium || "",
  }));
}

async function rafAra(sorgu, tur) {
  if (tur === "kitap") return araOpenLibrary(sorgu);
  if (tur === "anime") return araAniList(sorgu, "ANIME");
  if (tur === "manga") return araAniList(sorgu, "MANGA");
  return [];                                   // dizi / film: elle
}

/* ---------------------------------------------------------------- pencere */

let rafTur = "kitap";
let aramaZaman = null;
let sonSorgu = "";

function rafPencere() { return document.getElementById("raf-pencere"); }

function rafPencereAc() {
  rafTur = "kitap";
  document.getElementById("r-sorgu").value = "";
  document.getElementById("r-sonuc").textContent = "";
  turDugmeleriniTazele();
  elleAlanlariTazele();
  rafPencere().showModal();
  document.getElementById("r-sorgu").focus();
}

function turDugmeleriniTazele() {
  for (const b of document.querySelectorAll("#r-turler button"))
    b.setAttribute("aria-pressed", String(b.dataset.tur === rafTur));
}

/** Dizi ve filmde arama kutusu yerine elle giriş gösteriliyor. */
function elleAlanlariTazele() {
  const kaynakli = ["kitap", "anime", "manga"].includes(rafTur);
  document.getElementById("r-arama-alani").hidden = !kaynakli;
  document.getElementById("r-elle-alani").hidden = kaynakli;
  document.getElementById("r-sonuc").hidden = !kaynakli;
  if (!kaynakli) {
    document.getElementById("r-ad").value = "";
    document.getElementById("r-toplam").value = rafTur === "film" ? "1" : "";
  }
}

function durumYaz(metin, sinif) {
  const k = document.getElementById("r-sonuc");
  k.textContent = "";
  k.append(el("p", "raf-durum " + (sinif || ""), metin));
}

async function aramayiCalistir() {
  const sorgu = document.getElementById("r-sorgu").value.trim();
  if (sorgu.length < 2) { document.getElementById("r-sonuc").textContent = ""; return; }
  if (sorgu === sonSorgu) return;
  sonSorgu = sorgu;

  durumYaz("Aranıyor…");
  try {
    const ham = await rafAra(sorgu, rafTur);
    const sonuclar = [...ham].sort((a, b) => (b.toplam ? 1 : 0) - (a.toplam ? 1 : 0));
    if (!sonuclar.length) {
      durumYaz("Sonuç yok. Elle eklemek için türü Dizi ya da Film seç.");
      return;
    }
    sonuclariCiz(sonuclar);
  } catch (hata) {
    /* Ağ yoksa ya da kaynak düştüyse arayüz kilitlenmesin. */
    durumYaz("Aramaya ulaşılamadı (" + hata.message + "). Elle ekleyebilirsin.", "hata");
  }
}

function sonuclariCiz(sonuclar) {
  const k = document.getElementById("r-sonuc");
  k.textContent = "";
  for (const s of sonuclar) {
    const satir = el("button", "raf-sonuc");
    satir.type = "button";

    const kapak = el("div", "raf-kapak");
    if (s.kapak) kapak.style.backgroundImage = `url("${s.kapak}")`;

    const bilgi = el("div", "raf-bilgi");
    bilgi.append(el("b", null, s.ad));
    const alt = [s.altBilgi, s.toplam ? s.toplam + " " + birimAdi(rafTur) : "sayı bilinmiyor"]
      .filter(Boolean).join(" · ");
    bilgi.append(el("span", null, alt));

    satir.append(kapak, bilgi);
    satir.onclick = () => rafaEkle({
      tur: rafTur, ad: s.ad, kapak: s.kapak,
      toplam: s.toplam || varsayilanToplam(rafTur), mevcut: 0,
    });
    k.append(satir);
  }
}

const birimAdi = (tur) => (RAF_TURLERI.find((t) => t.id === tur) || {}).birim || "birim";
/* Kaynak sayı vermezse tür bazlı makul bir varsayılan; kullanıcı kartta
   ilerletirken zaten düzeltilebilir olmalı, 12 sayfalık kitap olmaz. */
const varsayilanToplam = (tur) =>
  tur === "film" ? 1 : tur === "kitap" ? 300 : 12;

function rafaEkle(oge) {
  D.raf.push({ id: String(Date.now()) + Math.random().toString(36).slice(2, 6), ...oge });
  yaz();
  rafPencere().close();
  cizHepsi();
}

function elleKaydet(olay) {
  olay.preventDefault();
  const ad = document.getElementById("r-ad").value.trim();
  if (!ad) return;
  const toplam = Math.max(1, parseInt(document.getElementById("r-toplam").value, 10) || 1);
  rafaEkle({ tur: rafTur, ad, kapak: "", toplam, mevcut: 0 });
}

/* ---------------------------------------------------------------- ilerletme */

function rafIlerlet(id, adim) {
  const o = D.raf.find((x) => x.id === id);
  if (!o) return;
  o.mevcut = Math.max(0, Math.min(o.toplam, (Number(o.mevcut) || 0) + adim));
  yaz();
  cizHepsi();
}

function rafSil(id) {
  D.raf = D.raf.filter((x) => x.id !== id);
  yaz();
  cizHepsi();
}

/* ---------------------------------------------------------------- kurulum */

function rafKurulum() {
  const t = document.getElementById("r-turler");
  for (const tur of RAF_TURLERI) {
    const b = el("button", null, tur.ad);
    b.type = "button";
    b.dataset.tur = tur.id;
    b.onclick = () => {
      rafTur = tur.id;
      sonSorgu = "";
      turDugmeleriniTazele();
      elleAlanlariTazele();
      document.getElementById("r-sonuc").textContent = "";
      if (["kitap", "anime", "manga"].includes(rafTur)) aramayiCalistir();
    };
    t.append(b);
  }

  document.getElementById("r-sorgu").addEventListener("input", () => {
    clearTimeout(aramaZaman);
    aramaZaman = setTimeout(aramayiCalistir, ARAMA_BEKLEME);
  });
  document.getElementById("r-elle-form").addEventListener("submit", elleKaydet);
  document.getElementById("r-vazgec").onclick = () => rafPencere().close();
}
