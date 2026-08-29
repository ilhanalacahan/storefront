import type { MetadataRoute } from "next";

import { koleksiyonlariGetir, urunleriGetir } from "@/lib/api/catalog";
import { BELGE_SIRASI } from "@/lib/sozlesmeler";
import { SITE_URL, urunYolu } from "@/lib/site";

/**
 * sitemap.xml — arama motoruna "bu sitede şunlar var" listesi.
 *
 * KAPSAM: statik sayfalar + yasal metinler + koleksiyonlar + ürünler.
 * Ürünler kanalın vitrininden gelir; yayında olmayan ürün listede olmaz —
 * sitemap, kapsam kuralının ikinci bir kopyası DEĞİL, aynı ucun çıktısıdır.
 *
 * TAVAN VAR: vitrin ucu sayfa başına en çok 60 kayıt verir ve sitemap tek
 * seferde birkaç sayfa çeker. Kataloğu on binlerce ürüne çıkan bir mağaza
 * sitemap'i indekslemeli (sitemap index) hâle getirmelidir; bugünkü şablon
 * için bu tavan bilinçli bir sadeleştirmedir ve aşıldığında SESSİZ KALMAZ:
 * eksik kalan ürünler bir sonraki taramada değil, hiç görünmez.
 */

const SAYFA = 60;
const AZAMI_SAYFA = 20; // 1200 ürün

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const simdi = new Date();

  const sabit: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: simdi, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/urunler`, lastModified: simdi, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${SITE_URL}/koleksiyonlar`,
      lastModified: simdi,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...BELGE_SIRASI.map((k) => ({
      url: `${SITE_URL}/sozlesmeler/${k}`,
      lastModified: simdi,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const koleksiyonlar: MetadataRoute.Sitemap = await koleksiyonlariGetir()
    .then((liste) =>
      liste
        .filter((k) => k.handle)
        .map((k) => ({
          url: `${SITE_URL}/koleksiyon/${encodeURIComponent(k.handle)}`,
          lastModified: simdi,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })),
    )
    .catch(() => []);

  // Ürünler sayfa sayfa çekilir; boş sayfa gelince durulur.
  const urunler: MetadataRoute.Sitemap = [];
  for (let i = 0; i < AZAMI_SAYFA; i++) {
    let sayfa: Awaited<ReturnType<typeof urunleriGetir>> = [];
    try {
      sayfa = await urunleriGetir({ limit: SAYFA, offset: i * SAYFA });
    } catch {
      break; // backend erişilemiyorsa sitemap eksik döner, hata sayfası değil
    }
    if (sayfa.length === 0) break;
    for (const u of sayfa) {
      urunler.push({
        url: `${SITE_URL}${urunYolu(u)}`,
        lastModified: simdi,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    if (sayfa.length < SAYFA) break;
  }

  return [...sabit, ...koleksiyonlar, ...urunler];
}
