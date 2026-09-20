# Günlük Planlayıcı

Günlük yapılacaklar listesi ve takvimden etkinlik planlama için basit bir web
uygulaması. Kurulum, derleme adımı veya sunucu gerektirmez — `index.html`
dosyasını tarayıcıda açmak yeterli.

## Özellikler

- **Takvim** — aylık görünüm, Pazartesi başlangıçlı. Bir güne tıklayınca o günün
  paneli açılır. Ok tuşlarıyla da gün gün gezilebilir.
- **Yapılacaklar** — seçili güne görev ekleme, tamamlandıkça tik atma, silme.
- **Etkinlikler** — saat, başlık ve kategori (İş / Kişisel / Sağlık) ile etkinlik
  planlama. Liste saate göre sıralanır.
- **Günlük ilerleme** — tamamlanma yüzdesi, ölçer ve özet sayaçlar. Gün bittiğinde
  ölçer yeşile döner.
- **Takvim göstergeleri** — her gün hücresinde bekleyen görev sayısı rozeti ve o
  güne ait etkinliklerin kategori renkleri.
- **Açık / koyu tema** — işletim sistemi ayarını izler, düğmeyle değiştirilebilir.

## Çalıştırma

`index.html` dosyasına çift tıklayın. İsterseniz yerel bir sunucuyla da açabilirsiniz:

```bash
python -m http.server 8000
# http://localhost:8000
```

## Veri nerede saklanıyor?

Tüm görev ve etkinlikler **tarayıcınızın `localStorage`'ında** tutulur
(`gunluk-planlayici-v1` anahtarı). Bunun pratik sonuçları:

- Veri yalnızca o tarayıcıda ve o bilgisayarda durur; cihazlar arasında eşitlenmez.
- Tarayıcı geçmişini / site verilerini temizlerseniz kayıtlar silinir.
- Sunucu olmadığı için birden fazla kişi aynı listeyi paylaşamaz.

Ortak kullanım veya cihazlar arası eşitleme gerekirse bir arka uç (ör. Firebase,
Supabase) eklenmesi gerekir.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Sayfa yapısı |
| `styles.css` | Renk rolleri (açık/koyu), yerleşim ve bileşen stilleri |
| `app.js` | Durum yönetimi, takvim üretimi, localStorage |

## Erişilebilirlik ve renk notları

- Kategori renkleri hem açık hem koyu yüzey için ayrı ayrı seçildi; renk körlüğü
  ayrımı ve kontrast kontrollerinden geçti.
- Kategori adı her zaman yazıyla da gösterilir — hiçbir bilgi yalnızca renge
  bağlı değil.
- Tüm etkileşimli öğeler klavyeyle kullanılabilir ve odak halkası taşır.
