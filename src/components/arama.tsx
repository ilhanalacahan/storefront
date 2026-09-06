"use client";

import { Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ProductImage } from "@/components/product-image";
import { urunAraCanli } from "@/lib/api/catalog";
import type { StorefrontCategory } from "@/lib/api/catalog";
import { fiyat } from "@/lib/format";
import { kategoriYolu } from "@/lib/kategori";
import type { StorefrontProduct } from "@/lib/api/types";
import { urunYolu } from "@/lib/site";

/**
 * ARAMA KUTUSU + ÖNERİ AÇILIR LİSTESİ.
 *
 * İki iş yapar ve ikisi de aynı gecikmeyi (250 ms) paylaşır:
 *  1. URL'i günceller (/urunler?ara=…) — sonuç linki paylaşılabilir, geri
 *     tuşu çalışır, sunucu aynı parametreyle SSR yapar. YALNIZ liste
 *     sayfalarındayken: ana sayfada yazarken kullanıcıyı listeye atmak,
 *     yazmayı bitirmeden sayfa değiştirmek olurdu.
 *  2. Öneri listesi çeker — ürün (görsel + fiyat) ve eşleşen kategoriler.
 *
 * Öneri listesi ADRESE YAZMAZ: gösterilen her satır bir linktir, seçim
 * yapılmadan hiçbir gezinme olmaz. Enter tam sonuç sayfasına götürür.
 */
export function Arama({
  kategoriler = [],
  autoFocus = false,
  onGezinti,
}: {
  /** Menüdeki kategori listesi — ad eşleşmesi öneri listesinde gösterilir. */
  kategoriler?: StorefrontCategory[];
  autoFocus?: boolean;
  /** Bir öneriye tıklanınca çağrılır (mobil çekmeceyi kapatmak için). */
  onGezinti?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [deger, setDeger] = useState(params.get("ara") ?? "");
  const [urunler, setUrunler] = useState<StorefrontProduct[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  const ilkRender = useRef(true);

  // Liste sayfası kendi adresini taşır; kutu geri tuşuyla senkron kalsın.
  useEffect(() => {
    setDeger(params.get("ara") ?? "");
  }, [params]);

  useEffect(() => {
    const disari = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", disari);
    return () => document.removeEventListener("mousedown", disari);
  }, []);

  useEffect(() => {
    if (ilkRender.current) {
      ilkRender.current = false;
      return;
    }
    const q = deger.trim();
    const zaman = setTimeout(() => {
      // Liste sayfasındayken adres canlı güncellenir (eski davranış korunur).
      if (pathname === "/urunler" && q !== (params.get("ara") ?? "")) {
        router.replace(q ? `/urunler?ara=${encodeURIComponent(q)}` : "/urunler", { scroll: false });
      }
      if (q.length < 2) {
        setUrunler([]);
        setYukleniyor(false);
        return;
      }
      setYukleniyor(true);
      urunAraCanli(q, 6).then((u) => {
        setUrunler(u);
        setYukleniyor(false);
      });
    }, 250);
    return () => clearTimeout(zaman);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deger, pathname]);

  const q = deger.trim();
  const kategoriEslesmesi =
    q.length >= 2
      ? kategoriler
          .filter((k) => k.name.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")))
          .slice(0, 3)
      : [];
  const oneriVar = acik && q.length >= 2;

  const git = (yol: string) => {
    setAcik(false);
    onGezinti?.();
    router.push(yol);
  };

  return (
    <div ref={kutu} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q) git(`/urunler?ara=${encodeURIComponent(q)}`);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
        <input
          type="search"
          value={deger}
          autoFocus={autoFocus}
          onChange={(e) => {
            setDeger(e.target.value);
            setAcik(true);
          }}
          onFocus={() => setAcik(true)}
          placeholder="Ürün, marka veya model ara…"
          aria-label="Ürün ara"
          className="h-10 w-full rounded-xl border border-line bg-background pl-9 pr-9 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {deger ? (
          <button
            type="button"
            aria-label="Aramayı temizle"
            onClick={() => {
              setDeger("");
              setUrunler([]);
            }}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-soft transition hover:bg-line/60 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </form>

      {oneriVar ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/10 dark:shadow-black/60">
          {kategoriEslesmesi.length ? (
            <div className="border-b border-line p-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-soft">
                Kategoriler
              </p>
              {kategoriEslesmesi.map((k) => (
                <Link
                  key={k.uid}
                  href={kategoriYolu(k)}
                  onClick={() => {
                    setAcik(false);
                    onGezinti?.();
                  }}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-background"
                >
                  <span className="truncate">{k.fullName || k.name}</span>
                  <span className="shrink-0 text-xs text-soft">{k.productCount}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="max-h-80 overflow-y-auto p-2">
            {yukleniyor && urunler.length === 0 ? (
              <p className="flex items-center gap-2 px-2 py-3 text-sm text-soft">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Aranıyor…
              </p>
            ) : urunler.length === 0 ? (
              <p className="px-2 py-3 text-sm text-soft">Eşleşen ürün bulunamadı.</p>
            ) : (
              urunler.map((u) => (
                <Link
                  key={u.uid}
                  href={urunYolu(u)}
                  onClick={() => {
                    setAcik(false);
                    onGezinti?.();
                  }}
                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-background"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line">
                    <ProductImage src={u.imageUrl} alt={u.name} sizes="44px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.name}</span>
                    {u.brandName ? (
                      <span className="block truncate text-xs text-soft">{u.brandName}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-price">
                    {fiyat(u.price, u.curCode)}
                  </span>
                </Link>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => git(`/urunler?ara=${encodeURIComponent(q)}`)}
            className="w-full border-t border-line bg-background/60 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-background"
          >
            &ldquo;{q}&rdquo; için tüm sonuçları gör
          </button>
        </div>
      ) : null}
    </div>
  );
}
