"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Minus, Plus, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart";
import { AlarmDugmeleri } from "@/components/alarm-dugmeleri";
import { FavoriDugmesi } from "@/components/favori-dugmesi";
import { Price } from "@/components/price";
import { Yildizlar } from "@/components/yildizlar";
import { bilesimHesapla, urunGetirCanli } from "@/lib/api/catalog";
import {
  PARAMETRE_ETKI,
  type ProductComposeResult,
  type ProductParameter,
  type StorefrontProduct,
} from "@/lib/api/types";
import { fiyat, miktar } from "@/lib/format";

/**
 * Satın alma kutusu — fiyat/stok CANLI katman:
 * sunucudan gelen (ISR'lı, bayat olabilecek) ürün `initialData` olur,
 * sayfa açılınca aynı ürün proxy'den taze çekilir ve 30 sn'de bir tazelenir.
 * Statik iskelet ile canlı verinin ayrımı budur (ERP'ye yük bindirmeden
 * doğru fiyat/stok gösterme deseni).
 *
 * PARAMETRELİ ÜRÜN (şerit boyu gibi): girdiler burada toplanır, bileşim
 * SUNUCUDA hesaplanır (/compose — G2/G5): bileşik fiyat, taban miktar ve
 * kırılım oradan gelir; istemci çarpmaz. "Stokta" rozeti de girdilerden
 * SONRA, taban miktara göre çizilir — 2 adet × 2.850 mm = 5,7 m gerekiyorsa
 * 5 m stok "stokta" değildir (mockup bulgusu 1).
 */
export function BuyBox({ baslangic }: { baslangic: StorefrontProduct }) {
  const { data } = useQuery({
    queryKey: ["urun-canli", baslangic.uid],
    queryFn: () => urunGetirCanli(baslangic.uid),
    initialData: baslangic,
    refetchOnMount: "always",
    refetchInterval: 30_000,
    staleTime: 0,
  });
  const urun = data ?? baslangic;
  const [adet, setAdet] = useState(1);
  const stok = Number(urun.available);

  const parametreler = urun.parameters ?? [];
  const parametreli = parametreler.length > 0;
  const [degerler, setDegerler] = useState<Record<string, string>>(() =>
    Object.fromEntries(parametreler.map((p) => [p.key, p.default == null ? "" : String(p.default)])),
  );

  // Girdi denetimi istemcide yalnız ERKEN geri bildirimdir; aslı sunucuda.
  const girdiHatasi = useMemo(() => parametreHatasi(parametreler, degerler), [parametreler, degerler]);
  const dolu = useMemo(
    () =>
      parametreler
        .map((p) => ({ key: p.key, value: sayi(degerler[p.key]) }))
        .filter((g): g is { key: string; value: number } => g.value != null),
    [parametreler, degerler],
  );
  // Yazarken her tuşa istek atılmaz: girdiler 350 ms durulunca sorulur.
  const gecikmeli = useGecikmeli(JSON.stringify({ adet, dolu }), 350);

  const bilesimQ = useQuery({
    queryKey: ["bilesim", urun.uid, gecikmeli],
    queryFn: () => bilesimHesapla(urun.uid, { quantity: String(adet), params: dolu }),
    enabled: parametreli && !girdiHatasi && dolu.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
  const bilesim = parametreli ? bilesimQ.data : undefined;

  // Rozet: parametreli üründe bileşimden (taban miktara göre), yoksa üründen.
  const stokta = bilesim ? bilesim.inStock : urun.inStock;
  const eklenebilir = parametreli ? Boolean(bilesim) && !girdiHatasi && stokta : urun.inStock;
  const eklemeEtiketi = parametreli && (!bilesim || girdiHatasi) ? "Ölçü girin" : undefined;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="font-mono text-xs uppercase tracking-wider text-soft">{urun.code}</p>
        <h1 className="text-2xl font-bold leading-tight md:text-3xl">{urun.name}</h1>
        {urun.subtitle ? <p className="text-soft">{urun.subtitle}</p> : null}
        {urun.ratingCount > 0 ? (
          <a href="#yorumlar" className="inline-flex items-center gap-2 text-sm hover:underline">
            <Yildizlar puan={urun.ratingAvg} boyut="md" />
            <span className="text-soft">
              {urun.ratingAvg.replace(".", ",")} · {urun.ratingCount} değerlendirme
            </span>
          </a>
        ) : null}
      </div>

      {parametreli ? (
        <ParametreGirdileri
          parametreler={parametreler}
          degerler={degerler}
          onChange={(k, v) => setDegerler((d) => ({ ...d, [k]: v }))}
          hata={girdiHatasi}
        />
      ) : null}

      <div className="space-y-1 rounded-2xl border border-line bg-surface p-4">
        {bilesim ? (
          <>
            <Price price={bilesim.price} curCode={bilesim.curCode} size="lg" />
            <p className="text-xs text-soft">
              KDV (%{Number(bilesim.vatRate)}) {bilesim.vatIncluded ? "dahil" : "hariç"} · adet başına
              {bilesim.paramSummary ? ` · ${bilesim.paramSummary}` : ""}
            </p>
            <Kirilim bilesim={bilesim} />
          </>
        ) : (
          <>
            <Price
              price={urun.price}
              compareAtPrice={urun.compareAtPrice}
              curCode={urun.curCode}
              size="lg"
            />
            <p className="text-xs text-soft">
              KDV (%{Number(urun.vatRate)}) {urun.vatIncluded === false ? "hariçtir" : "dahildir"}
              {parametreli && urun.unit ? ` · ${urun.unit} başına taban fiyat` : ""}
            </p>
          </>
        )}
      </div>

      {urun.madeToOrder ? (
        // Siparişe göre üretim (G49): stok kapısı yok — termin gösterilir.
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Siparişe özel hazırlanır
          {urun.leadDays > 0 ? ` — ${urun.leadDays} günde hazır` : ""}
        </p>
      ) : parametreli && !bilesim ? (
        // Rozet girdilerden SONRA: ölçü girilmeden "stokta" denmez.
        <p className="text-sm text-soft">Stok durumu ölçü ve adede göre hesaplanır.</p>
      ) : stokta ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Stokta
          {bilesim
            ? ` — ${miktar(bilesim.baseQuantity)} ${bilesim.unit} ayrılabilir`
            : stok > 0 && stok <= 10
              ? ` — son ${miktar(urun.available)} adet`
              : ""}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <XCircle className="size-4" />
          {bilesim
            ? `Bu ölçü için yeterli stok yok (satılabilir ${miktar(bilesim.available)} ${bilesim.unit})`
            : "Stokta yok"}
        </p>
      )}

      <div className="flex gap-3">
        <div className="flex items-center rounded-xl border border-line bg-surface">
          <button
            type="button"
            aria-label="Azalt"
            onClick={() => setAdet((a) => Math.max(1, a - 1))}
            className="flex size-12 items-center justify-center text-soft hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center font-semibold">{adet}</span>
          <button
            type="button"
            aria-label="Artır"
            onClick={() => setAdet((a) => a + 1)}
            className="flex size-12 items-center justify-center text-soft hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <AddToCartButton
          productUid={urun.uid}
          quantity={String(adet)}
          disabled={!eklenebilir}
          params={parametreli ? dolu : undefined}
          etiket={eklemeEtiketi}
        />
        <FavoriDugmesi productUid={urun.uid} gorunum="buton" />
      </div>

      {/* Alarm düğmeleri satın alma kutusunun İÇİNDEDİR: tükenmiş üründe
          "sepete ekle" pasiftir ve müşterinin oradan yapabileceği tek anlamlı
          eylem haber istemektir. Parametreli üründe stok bileşime bağlı
          olduğu için yalnız fiyat alarmı anlamlıdır. */}
      <AlarmDugmeleri
        productUid={urun.uid}
        stokta={parametreli ? true : urun.inStock}
        siparisleUretilen={urun.madeToOrder}
      />

      <ul className="space-y-1 text-xs text-soft">
        <li>• Fiyat ve stok bilgisi canlıdır; ödeme adımında bir kez daha doğrulanır.</li>
        <li>• 14 gün içinde koşulsuz iade.</li>
      </ul>
    </div>
  );
}

/** "2850" ya da "2,5" → sayı; boş/geçersiz → null. */
function sayi(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Sınır dışı ya da eksik ölçüde kısa uyarı ('' = sorun yok). */
function parametreHatasi(parametreler: ProductParameter[], degerler: Record<string, string>): string {
  for (const p of parametreler) {
    const v = sayi(degerler[p.key]);
    if (v == null) {
      // Miktar çarpanı ve fiyat sabiti fiyatı belirler; boş bırakılamaz.
      if (p.effect === PARAMETRE_ETKI.MiktarCarpani || p.effect === PARAMETRE_ETKI.FiyatSabiti) {
        return `${p.label} girilmeli.`;
      }
      continue;
    }
    if (p.min != null && v < p.min) return `${p.label} en az ${p.min}${p.unit ? ` ${p.unit}` : ""} olmalı.`;
    if (p.max != null && v > p.max) return `${p.label} en çok ${p.max}${p.unit ? ` ${p.unit}` : ""} olmalı.`;
  }
  return "";
}

/** Değer durulunca güncellenen kopya (debounce). */
function useGecikmeli<T>(deger: T, ms: number): T {
  const [g, setG] = useState(deger);
  useEffect(() => {
    const id = setTimeout(() => setG(deger), ms);
    return () => clearTimeout(id);
  }, [deger, ms]);
  return g;
}

/** Parametre girdi alanları — sınır ve birim şablondan (kartın ezmeleri bindirilmiş). */
function ParametreGirdileri({
  parametreler,
  degerler,
  onChange,
  hata,
}: {
  parametreler: ProductParameter[];
  degerler: Record<string, string>;
  onChange: (key: string, deger: string) => void;
  hata: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold">Ölçüler</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {parametreler.map((p) => {
          const sinir =
            p.min != null || p.max != null
              ? `${p.min != null ? p.min : ""}–${p.max != null ? p.max : ""}${p.unit ? ` ${p.unit}` : ""}`
              : "";
          return (
            <label key={p.key} className="block text-sm">
              <span className="mb-1 block text-soft">
                {p.label}
                {p.unit ? ` (${p.unit})` : ""}
              </span>
              <input
                inputMode="decimal"
                value={degerler[p.key] ?? ""}
                onChange={(e) => onChange(p.key, e.target.value)}
                placeholder={sinir}
                className="h-11 w-full rounded-xl border border-line bg-background px-3 outline-none focus:border-accent"
              />
              {sinir ? <span className="mt-1 block text-xs text-soft">Aralık: {sinir}</span> : null}
            </label>
          );
        })}
      </div>
      {hata ? <p className="text-xs text-danger">{hata}</p> : null}
    </div>
  );
}

/**
 * Toplam kırılımı (mockup bulgusu 2): metre bedeli ve kaynak ücreti tek
 * sayının içinde kaybolmaz. Satırlar sunucunun katkılarıdır; burada yalnız
 * biçimlenir.
 */
function Kirilim({ bilesim }: { bilesim: ProductComposeResult }) {
  const olcu = bilesim.contributions.filter((k) => k.effect === PARAMETRE_ETKI.MiktarCarpani);
  const sabitler = bilesim.contributions.filter((k) => k.effect === PARAMETRE_ETKI.FiyatSabiti);
  return (
    <dl className="mt-2 space-y-1 border-t border-line pt-2 text-xs text-soft">
      <div className="flex justify-between gap-3">
        <dt>
          Taban fiyat{bilesim.unit ? ` (${bilesim.unit})` : ""}
          {olcu.map((k) => ` × ${miktar(k.contribution)}`).join("")}
        </dt>
        <dd>{fiyat(bilesim.basePrice, bilesim.curCode)}</dd>
      </div>
      {sabitler.map((k) => (
        <div key={k.key} className="flex justify-between gap-3">
          <dt>{k.label}</dt>
          <dd>+ {fiyat(k.contribution, bilesim.curCode)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 font-medium text-foreground">
        <dt>
          {miktar(bilesim.quantity)} adet
          {olcu.length ? ` · toplam ${miktar(bilesim.baseQuantity)} ${bilesim.unit}` : ""}
        </dt>
        <dd>{fiyat(bilesim.lineTotal, bilesim.curCode)}</dd>
      </div>
    </dl>
  );
}
