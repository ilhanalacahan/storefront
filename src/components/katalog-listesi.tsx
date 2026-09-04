import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import type { StorefrontBrandItem } from "@/lib/api/catalog";
import type { StorefrontProduct } from "@/lib/api/types";

/**
 * KATALOG LİSTESİNİN ORTAK PARÇALARI — /urunler, /kategori/[handle] ve
 * /koleksiyon/[handle] aynı süzgeç çubuğunu, aynı ızgarayı ve aynı sayfalamayı
 * kullanır. Üçü ayrı yazılsaydı "en ucuz" düğmesi birinde olur ötekinde
 * olmazdı; sayfa 1'e dönme kuralı da üç kez kırılırdı.
 *
 * SÜZGEÇ DURUMU URL'DEDİR (?ara=…&marka=…&sirala=…&stokta=1&sayfa=…): link
 * paylaşılabilir, geri tuşu çalışır, sunucu aynı parametreyle SSR yapar.
 * Hepsi Server Component'tır; tek etkileşim linktir.
 */

export const SAYFA_BOYU = 24;

/** Sıralama seçenekleri — anahtarlar backend sözleşmesiyle birebir. */
export const SIRALAMALAR = [
  { deger: "", etiket: "Önerilen" },
  { deger: "fiyat-artan", etiket: "Artan fiyat" },
  { deger: "fiyat-azalan", etiket: "Azalan fiyat" },
  { deger: "yeni", etiket: "En yeni" },
] as const;

/** URL'den okunan ham sorgu (Next searchParams). */
export interface HamKatalogSorgusu {
  ara?: string;
  marka?: string;
  sirala?: string;
  stokta?: string;
  sayfa?: string;
}

/** Çözülmüş süzgeç durumu. */
export interface KatalogSorgusu {
  ara: string;
  marka: string;
  sirala: string;
  stokta: boolean;
  sayfa: number;
}

export function katalogSorgusuCoz(p: HamKatalogSorgusu): KatalogSorgusu {
  return {
    ara: (p.ara ?? "").trim(),
    marka: (p.marka ?? "").trim(),
    sirala: (p.sirala ?? "").trim(),
    stokta: p.stokta === "1",
    sayfa: Math.max(1, Number(p.sayfa) || 1),
  };
}

/** Bir süzgecin yeni değeri; verilmeyen alan mevcut değerini korur. */
export interface SorguDegisikligi {
  ara?: string;
  marka?: string;
  sirala?: string;
  /** "1" = yalnız stoktakiler, "" = süzgeci kaldır. */
  stokta?: string;
  sayfa?: number;
}

export type LinkKurucu = (d: SorguDegisikligi) => string;

/**
 * Adres kurucusu. Süzgeç değiştiğinde SAYFA 1'E DÖNER (açıkça sayfa
 * verilmedikçe): 7. sayfadayken marka değiştiren müşteri, yeni markanın
 * 7. sayfasında boş bir listeye düşerdi. `sabit` her linke aynen taşınan
 * parametrelerdir (örn. eski `?kategori=` süzgeci).
 */
export function katalogLinkKurucu(
  taban: string,
  mevcut: KatalogSorgusu,
  sabit: Record<string, string> = {},
): LinkKurucu {
  return (d) => {
    const p = new URLSearchParams();
    for (const [ad, deger] of Object.entries(sabit)) if (deger) p.set(ad, deger);
    const yaz = (ad: string, deger: string | undefined, eski: string) => {
      const v = deger !== undefined ? deger : eski;
      if (v) p.set(ad, v);
    };
    yaz("ara", d.ara, mevcut.ara);
    yaz("marka", d.marka, mevcut.marka);
    yaz("sirala", d.sirala, mevcut.sirala);
    const stok = d.stokta !== undefined ? d.stokta === "1" : mevcut.stokta;
    if (stok) p.set("stokta", "1");
    const n = d.sayfa ?? 1;
    if (n > 1) p.set("sayfa", String(n));
    const qs = p.toString();
    return qs ? `${taban}?${qs}` : taban;
  };
}

const dugmeSinifi = (aktif: boolean) =>
  `rounded-lg px-2.5 py-1 text-sm transition ${
    aktif ? "bg-accent/10 font-semibold text-accent" : "text-soft hover:text-foreground"
  }`;

/** Sıralama + stok + marka ekseni. */
export function KatalogSuzgecCubugu({
  sorgu,
  markalar,
  linkYap,
}: {
  sorgu: KatalogSorgusu;
  markalar: StorefrontBrandItem[];
  linkYap: LinkKurucu;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-line py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-soft">Sırala</span>
      {SIRALAMALAR.map((s) => (
        <Link
          key={s.deger}
          href={linkYap({ sirala: s.deger })}
          className={dugmeSinifi(sorgu.sirala === s.deger)}
        >
          {s.etiket}
        </Link>
      ))}

      <span className="mx-1 h-4 w-px bg-line" />

      <Link href={linkYap({ stokta: sorgu.stokta ? "" : "1" })} className={dugmeSinifi(sorgu.stokta)}>
        Yalnız stoktakiler
      </Link>

      {markalar.length > 0 ? (
        <>
          <span className="mx-1 h-4 w-px bg-line" />
          <span className="text-xs font-semibold uppercase tracking-wide text-soft">Marka</span>
          <div className="flex flex-wrap gap-1.5">
            {markalar.slice(0, 12).map((m) => (
              <Link
                key={m.name}
                href={linkYap({ marka: m.name === sorgu.marka ? "" : m.name })}
                className={dugmeSinifi(m.name === sorgu.marka)}
              >
                {m.name} <span className="opacity-60">({m.count})</span>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Ürün ızgarası — vitrin kartlarının tek yerleşimi. */
export function UrunIzgarasi({ urunler }: { urunler: StorefrontProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {urunler.map((u) => (
        <ProductCard key={u.uid} urun={u} />
      ))}
    </div>
  );
}

/** Sonuç yok — süzgeç varsa gevşetmeyi, yoksa tüm ürünleri önerir. */
export function KatalogBos({
  baslik,
  suzgecVar,
  temizleHref,
}: {
  baslik: string;
  suzgecVar: boolean;
  temizleHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-12 text-center">
      <PackageSearch className="size-10 text-soft/50" />
      <p className="font-medium">{baslik}</p>
      <p className="text-sm text-soft">
        {suzgecVar ? "Süzgeçleri gevşetin ya da tüm ürünlere göz atın." : "Henüz yayında ürün yok."}
      </p>
      <Link href={temizleHref} className="text-sm font-medium text-accent hover:underline">
        {suzgecVar ? "Süzgeçleri temizle" : "Tüm ürünleri göster"}
      </Link>
    </div>
  );
}

export function KatalogHata({ mesaj }: { mesaj: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-soft">
      {mesaj}
    </div>
  );
}

/** Sayfalama — backend toplam sayı verdiği için "3 / 12" gösterilebilir. */
export function Sayfalama({
  sayfa,
  sonSayfa,
  linkYap,
}: {
  sayfa: number;
  sonSayfa: number;
  linkYap: LinkKurucu;
}) {
  if (sonSayfa <= 1) return null;
  const dugme =
    "flex h-10 items-center gap-1 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition hover:border-accent";
  return (
    <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Sayfalama">
      {sayfa > 1 ? (
        <Link href={linkYap({ sayfa: sayfa - 1 })} className={dugme}>
          <ChevronLeft className="size-4" /> Önceki
        </Link>
      ) : null}
      <span className="px-2 text-sm text-soft">
        {sayfa} / {sonSayfa}
      </span>
      {sayfa < sonSayfa ? (
        <Link href={linkYap({ sayfa: sayfa + 1 })} className={dugme}>
          Sonraki <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
