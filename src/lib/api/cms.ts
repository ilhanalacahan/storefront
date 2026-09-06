import { apiSunucu } from "./client";

/**
 * Vitrin içeriği (CMS) — sayfalar ve banner'lar. Hepsi sunucudan, ISR'lı:
 * kişiye özel değildir. Gövde Markdown'dır ve lib/markdown.tsx ile çizilir.
 */

export interface StorefrontPage {
  uid: string;
  handle: string;
  title: string;
  /** Markdown; listede ''. */
  body: string;
  showInHeader: boolean;
  showInFooter: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  /** RFC3339 */
  updatedAt: string;
}

/** 1 hero · 2 banner kartı · 3 duyuru çubuğu */
export type BannerKind = 1 | 2 | 3;

export interface StorefrontBanner {
  uid: string;
  kind: BannerKind;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  sortOrder: number;
  /**
   * Kampanyanın bitiş anı (RFC3339; '' = süresiz). Hero ve fırsat şeridi
   * bundan GERİ SAYIM çizer. Başlangıç taşınmaz — dönem süzgeci sunucudadır,
   * başlamamış banner listeye zaten girmez.
   */
  endsAt: string;
}

/** Menüyü besleyen aktif sayfalar (gövdesiz), 5 dk ISR. */
export async function sayfalariGetir(): Promise<StorefrontPage[]> {
  const d = await apiSunucu<{ pages: StorefrontPage[] }>("/pages", { revalidate: 300 });
  return d.pages;
}

/** Handle ile gövdeli sayfa — bulunamazsa null. */
export async function sayfaGetir(handle: string): Promise<StorefrontPage | null> {
  try {
    return await apiSunucu<StorefrontPage>(`/pages/${encodeURIComponent(handle)}`, {
      revalidate: 300,
    });
  } catch {
    return null;
  }
}

/** Aktif ve dönemi içindeki banner'lar (tüm türler), 60 sn ISR. */
export async function bannerlariGetir(): Promise<StorefrontBanner[]> {
  const d = await apiSunucu<{ banners: StorefrontBanner[] }>("/banners", { revalidate: 60 });
  return d.banners;
}

/** Sayfanın kanonik yolu. */
export function sayfaYolu(s: Pick<StorefrontPage, "handle">): string {
  return `/sayfa/${encodeURIComponent(s.handle)}`;
}
