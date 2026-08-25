# Seyir — iOS widget uygulaması

Ana ekranda duran ilerleme widget'ı. **Seyir**: hem gidişat hem seyretmek —
zaman tarafını da, ileride gelecek kitap/dizi/anime tarafını da kapsıyor. Altı kapsam, tek motor:
**Gün · Hafta · Ay · Yıl · Resmî tatil · Sayaç**

Tasarım tezgâhı ayrı klasörde: `../widget-tezgah` (tarayıcıda açılıyor, derleme yok).

> **Uyarı:** Bu iskelet Windows'ta yazıldı, **hiç derlenmedi.** İlk turda hata
> çıkması normal; iskeletin işi hatasız olmak değil, sıfırdan başlamamak.

---

## Mac yok, para yok — kurulum böyle

Zincir: **kodu push et → GitHub'ın bedava Mac'i .ipa üretsin → Windows'tan
AltStore ile kendi telefonuna kur.**

### 1. Repo'yu GitHub'a public olarak koy

Public repo'da GitHub Actions macOS runner'ları **ücretsiz ve dakika sınırsız**.
Private repo'da macOS dakikası 10 katıyla düşülür — o yüzden public olmalı.

```bash
git init && git add . && git commit -m "ilk"
gh repo create seyir --public --source=. --push
```

### 2. Derleme kendiliğinden çalışır

`.github/workflows/ipa.yml` her push'ta çalışıp **imzasız** bir `Seyir.ipa`
üretiyor ve Actions sekmesindeki artifact'lere koyuyor. İndir.

### 3. Telefona kur

- Windows'a **AltServer** kur, iPhone'u bir kez USB ile eşle.
- `Seyir.ipa`'yı AltStore ile kur. Kendi (ücretsiz) Apple ID'nle imzalanıyor.
- Aynı Wi-Fi'dayken AltServer uygulamayı arka planda yeniliyor.

**Ücretsiz Apple ID sınırları:** sertifika 7 gün geçerli, aynı anda en fazla 3
sideload edilmiş uygulama. AltStore yenilemeyi kendi yaptığı için pratikte
takılmıyorsun.

### Ne zaman para gerekir

**99 $/yıl (Apple Developer Program)** yalnızca şunlar için:
App Store'a çıkmak · TestFlight · App Groups · sertifikanın 7 gün yerine 1 yıl sürmesi.

Kendi telefonunda kullanmak için **gerekmiyor.**

---

## Yapı

```
Ortak/          iki hedefe de derleniyor
  Cekirdek.swift    Kapsam, Ilerleme, Sayac, Tasarim, RenkSecimi
  Motor.swift       Tatiller tablosu + altı kapsamın hesabı
Uygulama/
  SeyirApp.swift    İlerleme listesi + ekleme rehberi
Widget/
  SeyirWidget.swift     AppIntent ayarı, zaman çizelgesi
  WidgetGovdesi.swift   Tasarımların SwiftUI karşılığı
.github/workflows/
  ipa.yml           Bedava macOS runner'da imzasız .ipa üretimi
```

**Kural:** tasarımlar kapsamı bilmez. Hepsi yalnızca `Ilerleme` yapısını çizer.
Yeni kapsam eklemek tasarımlara dokunmadan yapılır, yeni tasarım eklemek
kapsamlara dokunmadan.

---

## Kararlar ve gerekçeleri

**App Group YOK.** Ücretsiz Apple hesabında App Groups engelli. Bu yüzden sayacın
adı ve tarihi uygulamanın deposunda değil, **widget'ın kendi ayarında** duruyor
(`WidgetAyari`) — sistem onu widget'la birlikte saklıyor. Bedeli: sayaçlar uygulama
içinde liste hâlinde yönetilmiyor, her sayaç kendi widget'ında yaşıyor. Karşılığı:
proje tek kuruş harcamadan kendi telefonunda çalışıyor. Ücretli hesaba geçilirse
App Group eklenip liste açılır — motor değişmez.

**Tek widget, çok kapsam.** Galeri beş kopyayla dolmasın diye ayrı widget yok;
kapsam App Intents ile seçiliyor. Yan faydası: aynı ekrana farklı kapsamlarla
birden fazla kez konabiliyor.

**Sayaçta yön sorulmuyor.** `Sayac`'ta yön alanı yok. Tarih gelecekteyse geri
sayıyor ("19 gün kaldı"), geçmişteyse ileri ("449 gündür").

**Gün kapsamında saat:dakika yazılmıyor.** iOS widget'ının günlük yenileme bütçesi
~40-70, yani 15-60 dakikada bir. Dakika gösteren widget bayat kalır ve kullanıcı
bir daha güvenmez. Onun yerine "16. saat" yazıyor.

**Türkçe büyük harf.** `uppercased()` "Tatile" → "TATILE" veriyor; doğrusu "TATİLE".
Her yerde `String.buyukTR` kullanılıyor.

---

## Bakım borcu

`Motor.swift` → `Tatiller.dini` listesi **her yıl elle güncellenmeli.** Dini
bayramlar hicri takvime bağlı olduğu için hesaplanmıyor, yazılıyor.
Son doğrulama: 2027 Ramazan Bayramı 9-11 Mart, Kurban Bayramı 16-19 Mayıs.

## Yapılmadı

- Diğer altı tasarım (halka, nokta ızgarası, tipografik, çentikler, şerit, minimal
  çizgi) — tezgâhta var, SwiftUI'a çevrilmedi. `Tasarim` enum'una ekleyip
  `WidgetGovdesi`'ne bir `case` yazmak yeterli.
- `systemLarge` boyutu

- Kitap/dizi koleksiyonu — v2, ayrı iş
