# TurboStoreFront

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
| Ürün listesi + arama | URL paramlı (`/urunler?ara=…`), 300 ms debounce, SSR + ISR |
| Kategori filtresi | `storefrontCategories` ucundan çipler (`?kategori=uid`); yalnız vitrinde ürünü olan kategoriler listelenir |
| Ürün detayı | Statik iskelet (ISR 120 sn) + **canlı fiyat/stok katmanı** (30 sn'de bir tazelenir) |
| Görsel galerisi | ERP'deki `product_image` galerisi (`images` alanı) |
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
  Tarayıcı ──────────►│  Server Components ── gqlServer ──► ISR önbelleği (60-120 sn)        │
    │                 │   (katalog iskeleti: SEO + ERP'ye yük bindirmeme)                    │
    │  canlı veri     │                                                                      │
    └────────────────►│  /api/graphql proxy ── publishable key'i ekler, Authorization iletir │
      (sepet, hesap,  └──────────────────────────────┬───────────────────────────────────────┘
       ödeme, canlı                                  │  X-Publishable-Key: pk_{tenant}_…
       fiyat/stok)                                   ▼
                                     TicariCore GraphQL  (:6210 /graphql)
```

İki veri yolu bilinçli olarak ayrıdır:

- **Statik yol** (`src/lib/api/client.ts → gqlServer`): sayfa iskeletleri sunucuda,
  Next fetch önbelleğiyle (ISR). Her ziyaretçi ERP'yi sorgulamaz.
- **Canlı yol** (`gqlClient → /api/graphql`): kişiye özel her şey (sepet, hesap,
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
    api/graphql/route.ts   # tarayıcının tek API kapısı (proxy)
    page.tsx               # ana sayfa: hero + vitrin (ISR 60 sn)
    urunler/page.tsx       # liste + arama + sayfalama (URL paramlı)
    urun/[uid]/            # PDP: page (iskelet) + buy-box (canlı) + gallery
    sepet/page.tsx         # sepet + kupon
    odeme/page.tsx         # adres → test ödeme → sipariş (akışın kalbi)
    hesap/page.tsx         # giriş/kayıt + sepet birleştirme + siparişler
  components/              # header, sepet çekmecesi, ürün kartı, alt nav…
  hooks/use-cart.ts        # sepetin tek doğruluk kaynağı (TanStack Query)
  lib/api/                 # tipler + GraphQL operasyonları (backend şemasıyla birebir)
  lib/format.ts            # para/tarih biçimleme (hesap YAPMAZ, sadece gösterir)
  store/                   # Zustand: cartUid + oturum (localStorage persist)
```

## API sözleşmesinin kuralları

Bu vitrin TicariCore'un storefront yüzeyini kullanır. Bağlayıcı kurallar
[`ANAYASA.md`](ANAYASA.md)'dedir (V1–V8) — parasal alanların string oluşu, KDV
dahil etiket, sepet kimliği, `checkout` mutation'ının neden olmadığı, donmuş
sepet, kanal kapsamlı hesaplar ve liste kırpması orada tek tek gerekçesiyle
yazılıdır. Uygulama ayrıntıları `src/lib/api/*.ts` yorumlarındadır.

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

- **Kargo yöntemi/ücreti seçimi** (API'de alan var, yazan uç yok).
- **Parola sıfırlama / e-posta doğrulama.**
- Üretim sertleştirmesi: storefront token'ı demo sadeliği için localStorage'ta —
  hassas kurulumlarda httpOnly cookie'ye taşıyın (proxy zaten hazır).

## Lisans

[MIT](LICENSE) — dilediğiniz gibi kullanın, kendi mağazanıza dönüştürün.
