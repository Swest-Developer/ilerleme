# Scriptable sürümü — Mac'siz, parasız, kurulumsuz

Swift sürümünün aynı motoru JavaScript'e taşınmış hâli. Ana ekranda **gerçek bir
widget** olarak çalışıyor; Mac, sertifika, sideload ya da 99 $ gerektirmiyor.

**Sınırı:** bu bağımsız bir uygulama değil, Scriptable'ın içinde çalışan bir script.
App Store'a çıkamaz, ayarı metin parametresiyle yapılır. Ürünleştirmek için Swift
sürümü duruyor — bu, bugün telefonunda çalışan sürüm.

---

## Kurulum

1. App Store'dan **Scriptable**'ı indir (ücretsiz)
2. Telefonun tarayıcısında şu adresi aç:
   `https://raw.githubusercontent.com/Swest-Developer/ilerleme/main/Scriptable/Ilerleme.js`
3. Sayfadaki metnin tamamını seç ve kopyala
4. Scriptable → sağ üstteki **+** → açılan boş script'e yapıştır
5. Sağ üstteki ayarlardan adını **Ilerleme** yap, kaydet
6. Ana ekranda boş bir yere uzun bas → **+** → **Scriptable** → boyutu seç, ekle
7. Eklenen widget'a uzun bas → **Widget'ı Düzenle**
   - **Script**: Ilerleme
   - **When Interacting**: Run Script
   - **Parameter**: aşağıdaki tablodan biri

## Parameter ne yazılır

| Yazacağın | Widget ne gösterir |
|---|---|
| *(boş)* | Yılın yüzdesi |
| `yil` | Yılın yüzdesi |
| `ay` | İçinde bulunduğun ay |
| `hafta` | Bu hafta (pazartesi başlar) |
| `gun` | Bugün |
| `tatil` | Bir sonraki resmî tatile kalan |
| `Ehliyet sınavı, 2026-09-12` | Sayaç — **19 gün kaldı** |
| `Sigarayı bıraktım, 2025-06-01` | Sayaç — **449 gündür** |

**Yön sorulmuyor:** tarih ileriyse geri sayar, geride kaldıysa ileri sayar.

**Renk:** parametrenin sonuna renk kodu ekle → `tatil #5bc0be`

Birden fazla widget koyup her birine ayrı parametre verebilirsin.

---

## Test

```bash
node --test Scriptable/test/motor.test.js
```

Scriptable API'leri taklit edilerek motor ölçülüyor: kapsam hesapları, sayaç yönü,
parametre çözümü, Türkçe büyük harf, tatil tablosunun sıralı olması.

## Bakım borcu

`Ilerleme.js` → `TATIL_DINI` listesi **her yıl elle güncellenmeli.** Dini bayramlar
hicri takvime bağlı olduğu için hesaplanmıyor, yazılıyor.
Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.
