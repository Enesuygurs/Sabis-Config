# SABİS Config

Sakarya Üniversitesi SABİS (OBS) sistemini özelleştiren ve ek özellikler ekleyen bir Chrome eklentisi.

## Özellikler

- **Öğrenci Bilgileri** — Profil, GNO, kart bakiyesi ve yemek menüsü görüntüleme
- **Kırmızı Tema** — SABİS arayüzünü kırmızı renk temasına dönüştürme
- **Karanlık Tema** — SABİS arayüzünü dark mode'a çevirme
- **Gizli Mod** — Adı, fotoğrafı ve öğrenci numarasını maskeleme
- **Not Hesaplama** — Ders notlarını ağırlıklı ortalama ile hesaplama
- **Toplu Not Değiştirme** — Tüm notları tek seferde bir değerle doldurma
- **Anket Doldurma** — Anket formlarını otomatik doldurma
- **Soruları Kontrol Et** — Sınav sonuç popup'ındaki doğru/yanlışları renklendirme
- **Tümünü İndir** — Döküman sayfasındaki tüm materyalleri tek tıkla indirme
- **Sınav Takvimi** — Sınav takvimi sayfasına hızlı erişim

## Kurulum

1. Bu repoyu klonlayın veya ZIP olarak indirin
2. Chrome'da `chrome://extensions` adresine gidin
3. Sağ üstten **Geliştirici modu**'nu açın
4. **Paketlenmemiş öğe yükle** butonuna tıklayın
5. Proje klasörünü seçin

## Proje Yapısı

```
├── manifest.json            # Eklenti yapılandırması (MV3)
├── assets/
│   ├── images/              # İkonlar ve avatar
│   └── themes/              # Kırmızı ve karanlık tema CSS dosyaları
└── src/
    ├── background/          # Service worker (veri çekme)
    ├── content/             # Content script (tema, not hesaplama, stealth)
    ├── offscreen/           # HTML parse (DOMParser)
    └── popup/               # Popup arayüzü (HTML, CSS, JS)
```

## Desteklenen Siteler

- `https://obs.sabis.sakarya.edu.tr`
- `https://menu.sabis.sakarya.edu.tr`

## Geliştirici

Created by **Enes Uygur**
