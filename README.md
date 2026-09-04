# StoreFront

**TicariCore ERP üzerinde çalışan açık kaynak, headless e-ticaret vitrini.**
Modern bir elektronik mağazası görünümünde, uçtan uca çalışan bir demo: katalog,
misafir sepeti, kupon/kampanya, üyelik, sepet birleştirme ve test ödemesiyle
sipariş oluşturma — hepsi gerçek ERP API'sine karşı.

Bu bir **şablondur**: fork'layın, temayı değiştirin, kendi mağazanıza dönüştürün.

> Türkçe bir kod tabanıdır — değişken adları, yorumlar ve arayüz Türkçedir.

---

## Ne yapar?

| Özellik | Nasıl |
|---|---|
| Ürün listesi + arama | URL paramlı (`/urunler?ara=…`), 300 ms debounce, SSR + ISR; sıralama, marka, stok ve fiyat süzgeçleri sunucuda |
| Kategori ağacı + sayfası | `/categories` düz ağaç (`parentUid`) → menü, `/kategoriler` dizini, `/kategori/[handle]` sayfası (kırıntı + alt kategoriler); liste **alt ağacı** kapsar |
| Nitelik süzgeci | `/attributes` facet'i (kategori şablonundan etiket/tip) → kategori ve arama sayfasında `?n.<anahtar>=<değer>` çipleri; anahtarlar arasında VE |
| Koleksiyonlar | `/koleksiyon/[handle]` — kürasyon sıralı pazarlama listeleri |
| İçerik (CMS) | `/pages` → `/sayfa/[handle]` Markdown sayfalar (üst/alt menü bağlantısı), `/banners` → ana sayfa hero'su, banner kartları, site geneli duyuru çubuğu (dönemli); ham HTML işlenmez, Markdown React düğümlerine çevrilir (`lib/markdown.tsx`) |
| Zengin açıklama | Ürün ve kategori açıklaması aynı Markdown çiziciyle (başlık, liste, kalın, bağlantı, görsel) |
| Yorum + puan | `/products/{uid}/reviews` — onaylı yorumlar, puan özeti, doğrulanmış alışveriş rozeti; yazma üyeye açık, **onaydan sonra** yayınlanır (TicariApp → Ürün → Yorumlar); kartta yıldız, JSON-LD `aggregateRating` |
| Favoriler | Kalp düğmesi (kart + ürün sayfası), `/favoriler` listesi; uid kümesi `/account/favorites/uids` |
| Ürün detayı | Statik iskelet (ISR 120 sn) + **canlı fiyat/stok katmanı** (30 sn'de bir tazelenir); kırıntı yolu, **Teknik Özellikler** (kategori şablonlu `attributes`), varyant seçici |
| Görsel galerisi | ERP'deki `product_image` galerisi, alt metniyle (`gallery` alanı) |
| Misafir sepeti | `cartUid` localStorage'ta; backend'de token yok, uid = yetki anahtarı |
| Slide-over sepet | Ürün eklenince yandan açılır; mobil alt navigasyon + rozet |
| Kupon / kampanya | `cartApplyCoupon` — otomatik kampanya daha iyiyse backend reddeder ve söyler |
| Üyelik | `storefrontRegister/Login` (kanal kapsamlı hesap, KVKK onayı zorunlu) |
| Sipariş geçmişi + detay | `storefrontOrders` listesi; satır tıklanınca `storefrontOrder` ile kalemler (ad snapshot'ı, miktar, KDV dahil fiyatlar) |
| Sepet birleştirme | Girişte misafir sepeti hesaba taşınır (`cartMerge`) |
| Ödeme + sipariş | `cartSetAddress` → `paymentSessionStart` → `paymentSessionAuthorize` — sipariş **tahsilat anında** doğar, stok rezerve edilir |
| Test ödemesi | "test" sağlayıcısı: başarılı / kart reddi / banka hatası senaryoları seçilebilir |

## Mimari

```
                      ┌────────────────────────── Next.js (bu repo) ─────────────────────────┐
  Tarayıcı ──────────►│  Server Components ── apiSunucu ──► ISR önbelleği (60-300 sn)        │
    │                 │   (katalog iskeleti: SEO + ERP'ye yük bindirmeme)                    │
    │  canlı veri     │                                                                      │
    └────────────────►│  /api/store proxy ── publishable key'i ekler, Authorization iletir   │
      (sepet, hesap,  └──────────────────────────────┬───────────────────────────────────────┘
       ödeme, canlı                                  │  X-Publishable-Key: pk_{tenant}_…
       fiyat/stok)                                   ▼
                                     TicariCore REST  (:6210 /store/v1)
```

İki veri yolu bilinçli olarak ayrıdır:

- **Statik yol** (`src/lib/api/client.ts → apiSunucu`): sayfa iskeletleri sunucuda,
  Next fetch önbelleğiyle (ISR). Her ziyaretçi ERP'yi sorgulamaz; backend de
  aynı GET'leri `Cache-Control: s-maxage` ile CDN'e açar.
- **Canlı yol** (`apiIstemci → /api/store`): kişiye özel her şey (sepet, hesap,
  ödeme) ve PDP'nin güncel fiyat/stok tazelemesi. Proxy sayesinde **CORS ayarı
  gerekmez** ve publishable key istemci paketine gömülmez.

## Hızlı başlangıç

Gereksinim: çalışan bir TicariCore backend'i (`:6210`) ve bir satış kanalının
**publishable key**'i (TicariApp → Satış Kanalları → kanal detayı).

```bash
npm install
cp .env.example .env.local   # TICARICORE_PUBLISHABLE_KEY değerini doldurun
npm run dev                  # http://localhost:3000
```

Vitrin boşsa: ürünlerin kanala yayınlanması gerekir — kanalın **yayın politikası**
(otomatik/kural) ya da ürün başına **kanal ilanı** ile (TicariApp'ten).

### Ortam değişkenleri

| Değişken | Ne |
|---|---|
| `TICARICORE_URL` | Backend kökü (vars. `http://localhost:6210`). Sunucu tarafı — tarayıcıya sızmaz. |
| `TICARICORE_PUBLISHABLE_KEY` | Kanal anahtarı `pk_{tenant}_{32hex}`. Tenant'ı da bu anahtar çözer; ayrıca tenant başlığı gerekmez. |
| `NEXT_PUBLIC_SITE_NAME` | Vitrin adı (başlık/logo). |

## Proje yapısı

```
src/
  app/
    api/store/[...yol]/    # tarayıcının tek API kapısı (proxy → /store/v1)
    page.tsx               # ana sayfa: hero + vitrin (ISR 60 sn)
    urunler/page.tsx       # liste + arama + sayfalama (URL paramlı)
    kategoriler/           # kategori dizini (ağaç)
    kategori/[handle]/     # kategori sayfası: kırıntı + alt kategoriler + alt ağaç listesi
    koleksiyonlar/ · koleksiyon/[handle]/
    urun/[uid]/            # PDP: page (iskelet) + buy-box (canlı) + gallery
    sepet/page.tsx         # sepet + kupon
    odeme/page.tsx         # adres → test ödeme → sipariş (akışın kalbi)
    hesap/page.tsx         # giriş/kayıt + sepet birleştirme + siparişler + adresler
  components/              # header + kategori menüsü, kırıntı, katalog listesi parçaları, sepet çekmecesi…
  hooks/use-cart.ts        # sepetin tek doğruluk kaynağı (TanStack Query)
  lib/api/                 # tipler + REST çağrıları (backend yanıt şekilleriyle birebir)
  lib/kategori.ts          # kategori ağacı kurucu + kanonik kategori yolu
  lib/format.ts            # para/tarih biçimleme (hesap YAPMAZ, sadece gösterir)
  store/                   # Zustand: cartUid + oturum (localStorage persist)
```

## API sözleşmesinin kuralları

Bu vitrin TicariCore'un `/store/v1` yüzeyini kullanır. Bağlayıcı kurallar
[`ANAYASA.md`](ANAYASA.md)'dedir (V1–V9) — parasal alanların string oluşu, KDV
dahil etiket, sepet kimliği, `checkout` ucunun neden olmadığı, donmuş sepet,
kanal kapsamlı hesaplar, liste kırpması ve kategori ağacı orada tek tek
gerekçesiyle yazılıdır. Uygulama ayrıntıları `src/lib/api/*.ts` yorumlarındadır.

Kod yazmadan önce o belgeyi okuyun; burada tekrarlanmaz.

## Test ödemesi

Ödeme sayfası TicariCore'un `test` sağlayıcısını kullanır — gerçek karta gidilmez.
Üç senaryo denenebilir: **başarılı**, **kart reddedildi** (`senaryo: "red"`),
**banka iletişim hatası** (`senaryo: "hata"`). Gerçek PSP'ye geçerken backend'de
ilgili sağlayıcı istemcisi etkinleştirilir; bu vitrindeki akış değişmez
(3D panelinin yerini gerçek `redirectUrl` yönlendirmesi alır).

## Özelleştirme

- **Tema**: tüm renkler `src/app/globals.css` başındaki CSS değişkenlerinde.
  Koyu tema otomatik (`prefers-color-scheme`).
- **Ad/logo**: `NEXT_PUBLIC_SITE_NAME` + `components/header.tsx`.
- **Görsel domain'leri**: `next.config.ts → images.remotePatterns` — üretimde
  kendi medya domain'inizle daraltın.

## Bilinen sınırlar (backend yol haritası)

Şablon, backend'in bugünkü yüzeyine dürüstçe yaslanır; şunlar henüz yok:

- **Gerçek ödeme sağlayıcısı** — yalnız `test` sağlayıcısı kayıtlı.
- **Kategori görseli/açıklaması**, ürün başına SEO alanı, zengin (HTML) açıklama.
- **Yorum/puan, favori listesi, benzer ürün**, CMS (sayfa/banner/SSS), sipariş
  iptal/iade talebi, hesapsız sipariş sorgulama.
- Ürün ve kategori `handle`'ı yönetim formundan yazılamıyor; handle'sız kayıt
  uid'li adres alır.
- Üretim sertleştirmesi: storefront token'ı demo sadeliği için localStorage'ta —
  hassas kurulumlarda httpOnly cookie'ye taşıyın (proxy zaten hazır).

Güncel liste: kök depodaki `docs/plan/vitrin.md`.

## Lisans

[MIT](LICENSE) — dilediğiniz gibi kullanın, kendi mağazanıza dönüştürün.
