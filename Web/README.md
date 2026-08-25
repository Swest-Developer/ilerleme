# Seyir — web sürümü

Tarayıcıda çalışan sürüm. **Derleme yok**: `index.html` çift tıklayınca açılıyor,
sunucu gerekmiyor. Telefonun tarayıcısında da çalışıyor.

```
Web/
  index.html    iskelet
  uslup.css     görünüm
  motor.js      kapsam hesapları + tatil tablosu  (Swift ve Scriptable ile aynı mantık)
  arayuz.js     kart çizimi, sayaç yönetimi
  sunucu.js     yalnızca yerel test için (node sunucu.js → localhost:8778)
```

## Ne yapıyor

**Zaman:** Bugün · Bu hafta · Bu ay · Bu yıl · Resmî tatil — hiçbir şey girmeden dolu.

**Sayaçlarım:** kendi eklediklerin. Tek alan var: tarih.
Gelecekse geri sayıyor, geçmişse ileri. Yön sorulmuyor.

**Beş tasarım:** dolan kap · yüzde · kalan · halka · nokta — üstteki şeritten seçiliyor,
altı renk seçeneğiyle birlikte.

Sayaçlar ve tercihler **tarayıcıda** (`localStorage`) duruyor. Sunucu yok, hesap yok,
veri cihazdan çıkmıyor.

## Kural

Tasarımlar kapsamı bilmez — hepsi yalnızca `motor.js`'in ürettiği `ilerleme`
yapısını çizer. Yeni kapsam eklemek tasarımlara dokunmadan yapılır.

## Web'e özel karar

Widget'ta dolum kutuyu tamamen dolduruyordu; web kartı daha geniş olduğu için
aynı yoğunluk yazıyı yutuyordu. Burada dolgu **%22 saydam**, ama seviye çizgisi
**tam renkte** — asıl okunması gereken şey o çizgi.

## Bakım borcu

`motor.js` → `TATIL_DINI` listesi **her yıl elle güncellenmeli.** Dini bayramlar
hicri takvime bağlı olduğu için hesaplanmıyor, yazılıyor.
Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.

## Sırada

- Kitap / dizi / anime rafı — asıl istenen kısım, web'de kapak ve arama kolay
- Yayına alma (Vercel)
