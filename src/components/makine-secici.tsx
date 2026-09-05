"use client";

import { Cog } from "lucide-react";
import { useRouter } from "next/navigation";

import type { StorefrontMachine } from "@/lib/api/types";

/**
 * MAKİNE SEÇİCİ — "makinenizi seçin, uygun şeridi bulalım".
 *
 * Müşteri makinesinin marka/modelini bilir, şeridin genişlik/kalınlığını
 * bilmez. Seçim bir ADRESTİR: makinenin önerilen nitelik değerleri kategori
 * sayfasının süzgecine (n.<anahtar>=<değer>) çevrilir; eşleşen kartları
 * BAĞIMLI facet ve liste bulur. Makine bir ürüne bağlı değildir — katalog
 * değişince tablo bayatlamaz.
 *
 * Süzgeç durumu URL'dedir; bu bileşen yalnız yönlendirir (istemci: <select>).
 */
export function MakineSecici({
  makineler,
  kategoriYolu,
  secili,
}: {
  makineler: StorefrontMachine[];
  kategoriYolu: string;
  /** URL'deki mevcut nitelik seçimi — seçili makine buradan bulunur. */
  secili: Record<string, string>;
}) {
  const router = useRouter();
  if (!makineler.length) return null;

  const hedef = (m: StorefrontMachine) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(m.attributes)) if (k && v) p.set(`n.${k}`, v);
    const qs = p.toString();
    return qs ? `${kategoriYolu}?${qs}` : kategoriYolu;
  };
  // Seçili: nitelikleri URL'dekilerle birebir eşleşen ilk makine.
  const seciliUid =
    makineler.find((m) => {
      const e = Object.entries(m.attributes);
      return e.length > 0 && e.every(([k, v]) => secili[k] === v);
    })?.uid ?? "";

  const markalar = Array.from(new Set(makineler.map((m) => m.brand)));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Cog className="size-4 text-soft" />
        Makinenizi seçin
      </span>
      <select
        aria-label="Makine modeli"
        value={seciliUid}
        onChange={(e) => {
          const m = makineler.find((x) => x.uid === e.target.value);
          router.push(m ? hedef(m) : kategoriYolu);
        }}
        className="h-10 min-w-56 flex-1 rounded-xl border border-line bg-background px-3 text-sm outline-none focus:border-accent sm:flex-none"
      >
        <option value="">Marka / model…</option>
        {markalar.map((marka) => (
          <optgroup key={marka} label={marka}>
            {makineler
              .filter((m) => m.brand === marka)
              .map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.model}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {seciliUid ? (
        <span className="text-xs text-soft">
          Bu makineye uyan ölçüler süzüldü — seçimi kaldırmak için &ldquo;Marka / model…&rdquo;
        </span>
      ) : (
        <span className="text-xs text-soft">Seçim, makineye uyan ölçüleri kendiliğinden süzer.</span>
      )}
    </div>
  );
}
