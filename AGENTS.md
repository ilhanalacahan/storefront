<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# StoreFront — AI ajanları için harita

TicariCore'un vitrin GraphQL yüzeyine bağlanan Türkçe Next.js (App Router)
headless e-ticaret vitrini.

**Kurallar bu belgede değil, anayasadadır:** [`ANAYASA.md`](ANAYASA.md) (V1–V8)
ve genel maddeler için [`../ANAYASA.md`](../ANAYASA.md) (G1–G40).

## Harita

| Yol | Ne |
|---|---|
| `src/lib/api/types.ts` | Backend şemasının TS kopyası (alan alan yorumlu) |
| `src/lib/api/{catalog,cart,account,payment}.ts` | Tüm GraphQL operasyonları (V5) |
| `src/hooks/use-cart.ts` | Sepetin tek doğruluk kaynağı (V5) |
| `src/app/odeme/page.tsx` | Checkout akışının tamamı — **en kritik dosya** (V3) |
| `src/app/api/graphql/` | İstemci isteklerinin geçtiği proxy (V1) |
| `src/store/` | Zustand persist: `cart-store` (cartUid), `auth-store` (JWT) |
| `src/lib/format.ts` | Parasal biçimleme (G5) |
| `src/app/globals.css` | Tema değişkenleri — tek yerden renk yönetimi |

## Backend'i tanımak

API sözleşmesinin kaynağı TicariCore reposudur (vitrin ve ödeme uçları).
Başlık: `X-Publishable-Key` (tenant'ı da anahtar çözer). Müşteri JWT'si
`Authorization: Bearer` ile gider ve `typ:"storefront"` damgalıdır —
back-office token'ı burada geçmez, tersi de geçmez (G12).

## Doğrulama

```bash
npm run build   # tip denetimi + üretim derlemesi — her değişiklikte
npm run dev     # canlı deneme; TicariCore :6210 çalışıyor olmalı
```
