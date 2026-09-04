import type { StorefrontCategory } from "./api/catalog";

/**
 * KATEGORİ AĞACI YARDIMCILARI.
 *
 * Backend ağacı DÜZ liste olarak verir (parentUid); menü, kırıntı ve
 * kategori sayfası ağacı buradan kurar. Tek yerde durur: üç yüzey üç ayrı
 * ağaç kurarsa biri ebeveynsiz kategoriyi düşürür, öteki köke koyar.
 */

/** Kategori sayfasının kanonik yolu — handle varsa okunabilir, yoksa uid. */
export function kategoriYolu(k: Pick<StorefrontCategory, "uid" | "handle">): string {
  const h = (k.handle ?? "").trim();
  return `/kategori/${encodeURIComponent(h || k.uid)}`;
}

export interface KategoriDugumu extends StorefrontCategory {
  cocuklar: KategoriDugumu[];
}

/**
 * Düz listeden ağaç kurar. Ebeveyni listede olmayan kategori (pasif ata ya da
 * vitrin kapsamı dışı) KÖK sayılır — düşürülmez: ürünü olan bir dal menüden
 * kaybolmamalı.
 */
export function kategoriAgaci(liste: StorefrontCategory[]): KategoriDugumu[] {
  const dugumler = new Map<string, KategoriDugumu>();
  for (const k of liste) dugumler.set(k.uid, { ...k, cocuklar: [] });
  const kokler: KategoriDugumu[] = [];
  for (const d of dugumler.values()) {
    const ebeveyn = d.parentUid ? dugumler.get(d.parentUid) : undefined;
    if (ebeveyn) ebeveyn.cocuklar.push(d);
    else kokler.push(d);
  }
  const sirala = (a: KategoriDugumu, b: KategoriDugumu) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr");
  const gez = (d: KategoriDugumu[]) => {
    d.sort(sirala);
    for (const x of d) gez(x.cocuklar);
  };
  gez(kokler);
  return kokler;
}

/** Kök → kendisi zinciri (kırıntı yolu). Listede olmayan uid için []. */
export function kategoriZinciri(liste: StorefrontCategory[], uid: string): StorefrontCategory[] {
  const harita = new Map(liste.map((k) => [k.uid, k]));
  const zincir: StorefrontCategory[] = [];
  let simdiki = harita.get(uid);
  const gorulen = new Set<string>();
  while (simdiki && !gorulen.has(simdiki.uid)) {
    gorulen.add(simdiki.uid);
    zincir.unshift(simdiki);
    simdiki = simdiki.parentUid ? harita.get(simdiki.parentUid) : undefined;
  }
  return zincir;
}
