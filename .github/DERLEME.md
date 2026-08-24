# Derleme akışı

`.github/workflows/ipa.yml` dosyası depoda değil — eklenmesi için `workflow`
yetkisi gerekiyor. Yerel kopyada duruyor; şu komutla yetki verilip gönderilir:

```bash
gh auth refresh -h github.com -s workflow
git push
```
