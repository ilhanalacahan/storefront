import { ChevronLeft, ChevronRight, PackageSearch, X } from "lucide-react";
import Link from "next/link";

import { FiyatAraligiSuzgeci } from "@/components/fiyat-araligi";
import { ProductCard } from "@/components/product-card";
import type { StorefrontAttributeFacet, StorefrontBrandItem, StorefrontCategory } from "@/lib/api/catalog";
import type { StorefrontProduct } from "@/lib/api/types";
import { kategoriYolu } from "@/lib/kategori";

/**
 * KATALOG LİSTESİNİN ORTAK PARÇALARI — /urunler, /kategori/[handle] ve
 * /koleksiyon/[handle] aynı facet panelini, aynı ızgarayı ve aynı sayfalamayı
 * kullanır. Üçü ayrı yazılsaydı "en ucuz" düğmesi birinde olur ötekinde
 * olmazdı; sayfa 1'e dönme kuralı da üç kez kırılırdı.
 *
 * SÜZGEÇ DURUMU URL'DEDİR (?ara=…&marka=…&sirala=…&stokta=1&enaz=…&encok=…&sayfa=…):
 * link paylaşılabilir, geri tuşu çalışır, sunucu aynı parametreyle SSR yapar.
 * Panelin tamamı Server Component'tır ve her seçenek bir LİNKTİR — süzgeç
 * durumunu istemcide tutmak, aynı gerçeğin ikinci kopyasını üretirdi.
 */

export const SAYFA_BOYU = 24;

/** Sıralama seçenekleri — anahtarlar backend sözleşmesiyle birebir. */
export const SIRALAMALAR = [
  { deger: "", etiket: "Önerilen" },
  { deger: "fiyat-artan", etiket: "Artan fiyat" },
  { deger: "fiyat-azalan", etiket: "Azalan fiyat" },
  { deger: "yeni", etiket: "En yeni" },
] as const;

/**
 * URL'den okunan ham sorgu (Next searchParams). Nitelik süzgeçleri `n.<anahtar>`
 * parametresiyle gelir (?n.renk=Kırmızı) — anahtar kümesi kategoriye göre
 * değiştiği için sabit alan listesi yoktur.
 */
export interface HamKatalogSorgusu {
  ara?: string;
  marka?: string;
  sirala?: string;
  stokta?: string;
  enaz?: string;
  encok?: string;
  sayfa?: string;
  [parametre: string]: string | string[] | undefined;
}

/** Çözülmüş süzgeç durumu. */
export interface KatalogSorgusu {
  ara: string;
  marka: string;
  sirala: string;
  stokta: boolean;
  /** KDV dahil fiyat aralığı ('' = sınır yok). Parasal METİNDİR: hesaba girmez. */
  enAz: string;
  enCok: string;
  sayfa: number;
  /** Seçili nitelikler {anahtar: değer}. */
  nitelikler: Record<string, string>;
}

const NITELIK_ONEKI = "n.";

function tek(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Fiyat sınırı doğrulaması: yalnız sayı kabul edilir, çöp sessizce düşer. */
function fiyatSiniri(ham: string): string {
  const v = ham.trim().replace(",", ".");
  if (!v) return "";
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? v : "";
}

export function katalogSorgusuCoz(p: HamKatalogSorgusu): KatalogSorgusu {
  const nitelikler: Record<string, string> = {};
  for (const [ad, deger] of Object.entries(p)) {
    if (!ad.startsWith(NITELIK_ONEKI)) continue;
    const k = ad.slice(NITELIK_ONEKI.length).trim();
    const v = tek(deger).trim();
    if (k && v) nitelikler[k] = v;
  }
  return {
    ara: tek(p.ara).trim(),
    marka: tek(p.marka).trim(),
    sirala: tek(p.sirala).trim(),
    stokta: tek(p.stokta) === "1",
    enAz: fiyatSiniri(tek(p.enaz)),
    enCok: fiyatSiniri(tek(p.encok)),
    sayfa: Math.max(1, Number(tek(p.sayfa)) || 1),
    nitelikler,
  };
}

/** Süzgeç var mı — "sonuç yok" mesajı ve "temizle" bağlantısı bunu sorar. */
export function suzgecVarMi(s: KatalogSorgusu): boolean {
  return Boolean(
    s.ara || s.marka || s.stokta || s.enAz || s.enCok || Object.keys(s.nitelikler).length,
  );
}

/** Bir süzgecin yeni değeri; verilmeyen alan mevcut değerini korur. */
export interface SorguDegisikligi {
  ara?: string;
  marka?: string;
  sirala?: string;
  /** "1" = yalnız stoktakiler, "" = süzgeci kaldır. */
  stokta?: string;
  enAz?: string;
  enCok?: string;
  sayfa?: number;
  /** Tek niteliği değiştir; deger "" = o anahtarı kaldır. */
  nitelik?: { anahtar: string; deger: string };
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
    yaz("enaz", d.enAz, mevcut.enAz);
    yaz("encok", d.enCok, mevcut.enCok);
    const stok = d.stokta !== undefined ? d.stokta === "1" : mevcut.stokta;
    if (stok) p.set("stokta", "1");
    const nitelikler = { ...mevcut.nitelikler };
    if (d.nitelik) {
      if (d.nitelik.deger) nitelikler[d.nitelik.anahtar] = d.nitelik.deger;
      else delete nitelikler[d.nitelik.anahtar];
    }
    for (const [k, v] of Object.entries(nitelikler)) p.set(`${NITELIK_ONEKI}${k}`, v);
    const n = d.sayfa ?? 1;
    if (n > 1) p.set("sayfa", String(n));
    const qs = p.toString();
    return qs ? `${taban}?${qs}` : taban;
  };
}

// ---------------------------------------------------------------------------
// Facet paneli
// ---------------------------------------------------------------------------

/** Panel bölümü — başlık + içerik; katlanabilir değil (facet sayısı azdır). */
function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-soft">{baslik}</p>
      {children}
    </div>
  );
}

/** Süzgeç satırı — onay kutusu görünümlü link (durum URL'de olduğu için input değil). */
function SecimSatiri({
  href,
  secili,
  etiket,
  sayi,
}: {
  href: string;
  secili: boolean;
  etiket: string;
  sayi?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm transition hover:bg-background"
    >
      <span
        aria-hidden
        className={`flex size-4 shrink-0 items-center justify-center rounded border transition ${
          secili ? "border-accent bg-accent text-accent-foreground" : "border-line"
        }`}
      >
        {secili ? <span className="block size-2 rounded-[2px] bg-current" /> : null}
      </span>
      <span className={`min-w-0 flex-1 truncate ${secili ? "font-semibold text-accent" : ""}`}>
        {etiket}
      </span>
      {sayi !== undefined ? <span className="shrink-0 text-xs text-soft">{sayi}</span> : null}
    </Link>
  );
}

/** Facet değerinin gösterimi: evet/hayır çevrilir, gerisi sunucudan geldiği gibi. */
function nitelikDegerEtiketi(tip: StorefrontAttributeFacet["type"], deger: string): string {
  if (tip === "boolean") return deger === "true" ? "Evet" : "Hayır";
  return deger;
}

/**
 * SOL FACET PANELİ — kategori · stok · fiyat · marka · nitelikler.
 *
 * Eski yatay süzgeç çubuğunun yerini alır. Fark kapasitedir: yatay çubukta
 * 12 markadan fazlası kırpılıyor, fiyat aralığı hiç sığmıyordu. Dikey panel
 * ticari vitrinin standardıdır ve seçili süzgeçleri aynı anda görünür tutar.
 *
 * KATEGORİ BÖLÜMÜ SÜZGEÇ DEĞİL GEZİNMEDİR: her kategori kendi sayfasına gider
 * (kırıntısı ve açıklaması olan bir sayfadır), bu yüzden linkler `linkYap`
 * üzerinden değil `kategoriYolu` ile kurulur.
 */
export function FacetPaneli({
  sorgu,
  markalar,
  facetler,
  linkYap,
  kategoriler = [],
  kategoriBasligi = "Kategoriler",
}: {
  sorgu: KatalogSorgusu;
  markalar: StorefrontBrandItem[];
  facetler: StorefrontAttributeFacet[];
  linkYap: LinkKurucu;
  /** Gösterilecek kategoriler (kök ya da alt kategoriler); boşsa bölüm çizilmez. */
  kategoriler?: StorefrontCategory[];
  kategoriBasligi?: string;
}) {
  const gosterilenFacetler = facetler.filter(
    (f) => f.values.length > 1 || sorgu.nitelikler[f.key],
  );

  return (
    <div className="divide-y divide-line">
      {kategoriler.length ? (
        <Bolum baslik={kategoriBasligi}>
          <div className="space-y-0.5">
            {kategoriler.map((k) => (
              <Link
                key={k.uid}
                href={kategoriYolu(k)}
                title={k.fullName}
                className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition hover:bg-background hover:text-accent"
              >
                <span className="min-w-0 flex-1 truncate">{k.name}</span>
                <span className="shrink-0 text-xs text-soft">{k.productCount}</span>
              </Link>
            ))}
          </div>
        </Bolum>
      ) : null}

      <Bolum baslik="Durum">
        <SecimSatiri
          href={linkYap({ stokta: sorgu.stokta ? "" : "1" })}
          secili={sorgu.stokta}
          etiket="Yalnız stoktakiler"
        />
      </Bolum>

      <Bolum baslik="Fiyat (KDV dahil)">
        <FiyatAraligiSuzgeci
          enAz={sorgu.enAz}
          enCok={sorgu.enCok}
          temizHref={linkYap({ enAz: "", enCok: "" })}
        />
      </Bolum>

      {markalar.length ? (
        <Bolum baslik="Marka">
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {markalar.map((m) => (
              <SecimSatiri
                key={m.name}
                href={linkYap({ marka: m.name === sorgu.marka ? "" : m.name })}
                secili={m.name === sorgu.marka}
                etiket={m.name}
                sayi={m.count}
              />
            ))}
          </div>
        </Bolum>
      ) : null}

      {gosterilenFacetler.map((f) => (
        <Bolum key={f.key} baslik={f.label || f.key}>
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {f.values.map((v) => {
              const secili = sorgu.nitelikler[f.key] === v.value;
              return (
                <SecimSatiri
                  key={v.value}
                  href={linkYap({
                    nitelik: { anahtar: f.key, deger: secili ? "" : v.value },
                  })}
                  secili={secili}
                  etiket={nitelikDegerEtiketi(f.type, v.value)}
                  sayi={v.count}
                />
              );
            })}
          </div>
        </Bolum>
      ))}
    </div>
  );
}

/**
 * AKTİF SÜZGEÇ ÇİPLERİ — hangi süzgeçlerin açık olduğunu tek bakışta gösterir
 * ve tek tıkla kaldırır.
 *
 * Panelde seçili kutuyu bulmak, listeyi aşağı kaydırmış müşteri için zordur;
 * çipler her zaman listenin başındadır. Süzgeç yoksa hiç çizilmez.
 */
export function AktifSuzgecler({
  sorgu,
  linkYap,
  temizleHref,
  facetler = [],
}: {
  sorgu: KatalogSorgusu;
  linkYap: LinkKurucu;
  temizleHref: string;
  facetler?: StorefrontAttributeFacet[];
}) {
  const cipler: { etiket: string; href: string }[] = [];
  if (sorgu.ara) cipler.push({ etiket: `Arama: ${sorgu.ara}`, href: linkYap({ ara: "" }) });
  if (sorgu.marka) cipler.push({ etiket: sorgu.marka, href: linkYap({ marka: "" }) });
  if (sorgu.stokta) cipler.push({ etiket: "Stoktakiler", href: linkYap({ stokta: "" }) });
  if (sorgu.enAz || sorgu.enCok) {
    cipler.push({
      etiket: `Fiyat: ${sorgu.enAz || "0"} – ${sorgu.enCok || "∞"}`,
      href: linkYap({ enAz: "", enCok: "" }),
    });
  }
  for (const [anahtar, deger] of Object.entries(sorgu.nitelikler)) {
    const facet = facetler.find((f) => f.key === anahtar);
    cipler.push({
      etiket: `${facet?.label || anahtar}: ${nitelikDegerEtiketi(facet?.type ?? "", deger)}`,
      href: linkYap({ nitelik: { anahtar, deger: "" } }),
    });
  }
  if (!cipler.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {cipler.map((c) => (
        <Link
          key={c.etiket}
          href={c.href}
          className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 py-1 pl-3 pr-2 text-xs font-medium text-accent transition hover:bg-accent/20"
        >
          {c.etiket}
          <X className="size-3.5" aria-hidden />
        </Link>
      ))}
      {cipler.length > 1 ? (
        <Link href={temizleHref} className="px-2 text-xs font-medium text-soft hover:text-foreground">
          Tümünü temizle
        </Link>
      ) : null}
    </div>
  );
}

/** Sıralama düğmeleri — liste başlığının sağında. */
export function SiralamaSecici({
  sorgu,
  linkYap,
}: {
  sorgu: KatalogSorgusu;
  linkYap: LinkKurucu;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto">
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-soft sm:inline">
        Sırala
      </span>
      {SIRALAMALAR.map((s) => (
        <Link
          key={s.deger}
          href={linkYap({ sirala: s.deger })}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-sm transition ${
            sorgu.sirala === s.deger
              ? "bg-accent/10 font-semibold text-accent"
              : "text-soft hover:text-foreground"
          }`}
        >
          {s.etiket}
        </Link>
      ))}
    </div>
  );
}

/** Ürün ızgarası — vitrin kartlarının tek yerleşimi. */
export function UrunIzgarasi({ urunler }: { urunler: StorefrontProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
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

/**
 * Sayfalama — backend toplam sayı verdiği için sayfa numaraları gösterilebilir.
 * Numaralar PENCERELİDİR: 200 sayfalık bir listede 200 link basmak hem
 * okunmaz hem de HTML'i şişirir.
 */
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
  const pencere = 2;
  const numaralar: number[] = [];
  for (let n = Math.max(1, sayfa - pencere); n <= Math.min(sonSayfa, sayfa + pencere); n++) {
    numaralar.push(n);
  }
  const dugme =
    "flex h-10 items-center gap-1 rounded-xl border border-line bg-surface px-3 text-sm font-medium transition hover:border-accent";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-4" aria-label="Sayfalama">
      {sayfa > 1 ? (
        <Link href={linkYap({ sayfa: sayfa - 1 })} className={dugme} rel="prev">
          <ChevronLeft className="size-4" /> Önceki
        </Link>
      ) : null}
      {numaralar[0] > 1 ? (
        <>
          <Link href={linkYap({ sayfa: 1 })} className={dugme}>
            1
          </Link>
          {numaralar[0] > 2 ? <span className="px-1 text-soft">…</span> : null}
        </>
      ) : null}
      {numaralar.map((n) => (
        <Link
          key={n}
          href={linkYap({ sayfa: n })}
          aria-current={n === sayfa ? "page" : undefined}
          className={
            n === sayfa
              ? "flex h-10 min-w-10 items-center justify-center rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground"
              : dugme
          }
        >
          {n}
        </Link>
      ))}
      {numaralar[numaralar.length - 1] < sonSayfa ? (
        <>
          {numaralar[numaralar.length - 1] < sonSayfa - 1 ? (
            <span className="px-1 text-soft">…</span>
          ) : null}
          <Link href={linkYap({ sayfa: sonSayfa })} className={dugme}>
            {sonSayfa}
          </Link>
        </>
      ) : null}
      {sayfa < sonSayfa ? (
        <Link href={linkYap({ sayfa: sayfa + 1 })} className={dugme} rel="next">
          Sonraki <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
