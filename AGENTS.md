<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# StoreFront — AI ajanları için harita

TicariCore'un `/store/v1` REST vitrin yüzeyine bağlanan Türkçe Next.js
(App Router) headless e-ticaret vitrini.

**Kurallar bu belgede değil, anayasadadır:** [`ANAYASA.md`](ANAYASA.md) (V)
ve genel maddeler için [`../ANAYASA.md`](../ANAYASA.md).

## Harita

| Yol | Ne |
|---|---|
| `src/lib/api/types.ts` | Backend yanıt şekillerinin TS kopyası (alan alan yorumlu) |
| `src/lib/api/{catalog,cart,account,payment}.ts` | Tüm REST çağrıları (V5) |
| `src/lib/api/client.ts` | İki taşıma yolu: `apiSunucu` (ISR, doğrudan) · `apiIstemci` (proxy) |
| `src/lib/kategori.ts` | Kategori ağacı kurucu + kanonik kategori yolu (V9) |
| `src/lib/site.ts` | Site kimliği, mutlak URL, kanonik ürün yolu |
| `src/hooks/use-cart.ts` | Sepetin tek doğruluk kaynağı (V5) |
| `src/app/odeme/page.tsx` | Checkout akışının tamamı — **en kritik dosya** (V3) |
| `src/app/api/store/[...yol]/route.ts` | İstemci isteklerinin geçtiği proxy (V1) |
| `src/app/kategori/[handle]/` · `src/app/kategoriler/` | Kategori sayfası (alt ağaç) ve dizin |
| `src/components/katalog-listesi.tsx` | Süzgeç çubuğu, ızgara, sayfalama — üç liste sayfasının ortak parçaları |
| `src/components/kategori-menu.tsx` · `kirinti.tsx` · `json-ld.tsx` | Menü, kırıntı ve yapısal veri (aynı listeyi paylaşırlar) |
| `src/store/` | Zustand persist: `cart-store` (cartUid), `auth-store` (JWT) |
| `src/lib/format.ts` | Parasal biçimleme (G5) |
| `src/app/globals.css` | Tema değişkenleri — tek yerden renk yönetimi |

## Backend'i tanımak

API sözleşmesinin kaynağı TicariCore reposudur: `ports/rest/router.go` yol
tablosu, `service/storefront_*.go` yanıt şekilleri. Başlık: `X-Publishable-Key`
(tenant'ı da anahtar çözer). Müşteri JWT'si `Authorization: Bearer` ile gider
ve `typ:"storefront"` damgalıdır — back-office token'ı burada geçmez, tersi de
geçmez (G12).

## Doğrulama

```bash
npx tsc --noEmit   # tip denetimi — kökteki make check de bunu koşar
npm run build      # üretim derlemesi
npm run dev        # canlı deneme; TicariCore :6210 çalışıyor olmalı
```
