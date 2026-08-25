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

Üç parça: **kapsam** + *(isteğe bağlı)* **tasarım** + *(isteğe bağlı)* **renk**.
Bu sırayla yazılır, tasarım ve renk atlanabilir.

### Kapsam

| Yazacağın | Widget ne gösterir |
|---|---|
| *(boş)* veya `yil` | Yılın yüzdesi |
| `ay` | İçinde bulunduğun ay |
| `hafta` | Bu hafta (pazartesi başlar) |
| `gun` | Bugün |
| `tatil` | Bir sonraki resmî tatile kalan |
| `Ehliyet sınavı, 2026-09-12` | Sayaç — **19 gün kaldı** |
| `Sigarayı bıraktım, 2025-06-01` | Sayaç — **449 gündür** |

**Yön sorulmuyor:** tarih ileriyse geri sayar, geride kaldıysa ileri sayar.

### Tasarım

| Ad | Görünüm |
|---|---|
| `kap` *(varsayılan)* | Widget'ın kendisi alttan yukarı doluyor |
| `yuzde` | Dev yüzde + ilerleme çubuğu |
| `kalan` | Tek sayı, başka hiçbir şey |
| `halka` | Dairesel ilerleme |
| `nokta` | Kapsamın her birimi bir nokta; bugün beyaz |
| `cizgi` | En sade: ad, ince çizgi, iki uç |

### Renk

Sona bir renk kodu ekle: `#5bc0be` · `#9b6dff` · `#f2c14e` · `#e26a6a` · `#e8e8ea`

### Örnekler

```
yil
tatil halka
gun nokta #5bc0be
ay cizgi
Ehliyet sınavı, 2026-09-12 kalan
Sigarayı bıraktım, 2025-06-01 halka #9b6dff
```

Birden fazla widget koyup her birine ayrı parametre verebilirsin.

**Boy:** küçük ve orta boy ayrı tasarlandı. Orta boyda halka tasarımı sağına
bilgi sütunu açıyor, diğerleri geniş kutuyu kullanacak şekilde büyüyor.

**Not:** tasarım adı yalnızca parametrenin **son sözcüğünde** ve küçük harfle
aranıyor. Bu sayede "Kalan borç, 2026-09-12" gibi bir sayaç adı bozulmuyor.

---

## Test

```bash
node --test Scriptable/test/motor.test.js
```

Scriptable API'leri taklit edilerek ölçülüyor: kapsam hesapları, sayaç yönü,
parametre çözümü, Türkçe büyük harf, tatil tablosunun sıralı olması ve
**altı tasarımın altı kapsamda iki boyda da hatasız çizilmesi** (72 kombinasyon).

## Bakım borcu

`Ilerleme.js` → `TATIL_DINI` listesi **her yıl elle güncellenmeli.** Dini bayramlar
hicri takvime bağlı olduğu için hesaplanmıyor, yazılıyor.
Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.
