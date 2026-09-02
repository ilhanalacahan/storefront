import type { StorefrontProduct } from "./api/types";

/**
 * SİTE KİMLİĞİ ve URL KURALLARI — SEO'nun tek yeri.
 *
 * MUTLAK ADRES ŞART: sitemap, canonical ve Open Graph görselleri göreli adres
 * kabul etmez. Taban adres ortamdan gelir; tanımlı değilse localhost'a düşer
 * ve bu DOĞRU davranıştır — geliştirme ortamında üretim adresi uydurmak,
 * yanlış canonical yayımlamaktan iyidir değil, kötüdür.
 */

export const SITE_ADI = process.env.NEXT_PUBLIC_SITE_NAME ?? "StoreFront";

/** Sitenin kamusal kökü (sonda / YOK). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export function mutlak(yol: string): string {
  return yol.startsWith("http") ? yol : `${SITE_URL}${yol.startsWith("/") ? "" : "/"}${yol}`;
}

/**
 * Ürünün KANONİK yolu.
 *
 * Handle varsa okunabilir adres kullanılır (/urun/kirmizi-tisort), yoksa uid'e
 * düşülür. Backend iki biçimi de çözer, yani handle sonradan tanımlansa bile
 * eski uid'li bağlantılar çalışmaya devam eder.
 *
 * TEK YERDEN ÜRETİLİR: kart, varyant seçici, sitemap ve canonical aynı
 * fonksiyonu çağırır — aksi hâlde biri handle, öteki uid üretir ve arama
 * motoru aynı ürünü iki sayfa sanar.
 */
export function urunYolu(urun: Pick<StorefrontProduct, "uid" | "handle">): string {
  const h = (urun.handle ?? "").trim();
  return `/urun/${encodeURIComponent(h || urun.uid)}`;
}
