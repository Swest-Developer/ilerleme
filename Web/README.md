# Seyir — web sürümü

Tarayıcıda çalışan sürüm. **Derleme yok**: `index.html` çift tıklayınca açılıyor,
sunucu gerekmiyor. Telefonun tarayıcısında da çalışıyor.

```
Web/
  index.html    iskelet
  uslup.css     görünüm
  motor.js      kapsam hesapları + tatil tablosu + raf ilerlemesi
  arayuz.js     kart çizimi, sayaç yönetimi
  raf.js        kitap/anime/manga araması, raf yönetimi
  sunucu.js     yalnızca yerel test için (node sunucu.js → localhost:8778)
```

## Ne yapıyor

**Zaman:** Bugün · Bu hafta · Bu ay · Bu yıl · Resmî tatil — hiçbir şey girmeden dolu.

**Sayaçlarım:** kendi eklediklerin. Tek alan var: tarih.
Gelecekse geri sayıyor, geçmişse ileri. Yön sorulmuyor.

**Raf:** kitap, anime, manga, dizi, film. Kapak ve bölüm/sayfa sayısı aramadan
geliyor; karttaki düğmelerle ilerletiyorsun (kitapta +10 / +25, diğerlerinde +1).

**Beş tasarım:** dolan kap · yüzde · kalan · halka · nokta — üstteki şeritten seçiliyor,
altı renk seçeneğiyle birlikte.

Sayaçlar ve tercihler **tarayıcıda** (`localStorage`) duruyor. Sunucu yok, hesap yok,
veri cihazdan çıkmıyor.

## Kural

Tasarımlar kapsamı bilmez — hepsi yalnızca `motor.js`'in ürettiği `ilerleme`
yapısını çizer. Yeni kapsam eklemek tasarımlara dokunmadan yapılır.

**Raf da aynı yapıya çevriliyor:** 278/724 sayfa da, 7/28 bölüm de, yılın %65'i de
aynı `oran`. Bu yüzden raf zamanla aynı dili konuşuyor.

## Arama kaynakları

| Tür | Kaynak | Anahtar |
|---|---|---|
| Kitap | Open Library | gerekmiyor |
| Anime · Manga | AniList (GraphQL) | gerekmiyor |
| Dizi · Film | yok — elle giriliyor | — |

Dizi ve film için anahtarsız ücretsiz bir kaynak bulunamadı; TMDB anahtar istiyor
ve anahtarı koda gömmek doğru değil. **Ölçüldü (25.08.2026):** Jikan/MyAnimeList
504 veriyor, o yüzden anime tarafında AniList seçildi.

Arama başarısız olursa arayüz kilitlenmiyor — hata yazılıp elle ekleme öneriliyor.

## Web'e özel karar

Widget'ta dolum kutuyu tamamen dolduruyordu; web kartı daha geniş olduğu için
aynı yoğunluk yazıyı yutuyordu. Burada dolgu **%22 saydam**, ama seviye çizgisi
**tam renkte** — asıl okunması gereken şey o çizgi.

## Bakım borcu

`motor.js` → `TATIL_DINI` listesi **her yıl elle güncellenmeli.** Dini bayramlar
hicri takvime bağlı olduğu için hesaplanmıyor, yazılıyor.
Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.

## Sırada

- Raf öğesinin toplamını sonradan düzeltmek (kaynak yanlış sayı verirse)
- Bitenler için ayrı bölüm / durum (sürüyor · bitti · bırakıldı)
- Yayına alma (Vercel)
