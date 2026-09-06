"use client";

import { BarChart3, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HizliBakis } from "@/components/hizli-bakis";
import type { StorefrontProduct } from "@/lib/api/types";
import { KARSILASTIRMA_AZAMI, useKarsilastirmaStore } from "@/store/karsilastirma-store";

/**
 * KART ÜZERİ EYLEMLER — hızlı bakış ve karşılaştırma.
 *
 * Kalbin altında dikey şerit; masaüstünde hover'da belirir, dokunmatikte
 * (hover kavramı olmayan cihazlarda) sürekli görünür. Mobilde ekranı işgal
 * etmesin diye küçüktür.
 *
 * HIZLI BAKIŞ NEDEN: listede gezen müşteri her ürün için sayfa açıp geri
 * dönmek istemez — açtığı her sayfa listedeki kaydırma yerini kaybettirir.
 * Modal, sepete eklemeye yetecek bilgiyi (galeri, fiyat, stok, varyant)
 * listeden ayrılmadan verir.
 */
export function KartAksiyonlari({ urun }: { urun: StorefrontProduct }) {
  const [bakis, setBakis] = useState(false);
  const uidler = useKarsilastirmaStore((s) => s.uidler);
  const degistir = useKarsilastirmaStore((s) => s.degistir);
  const secili = uidler.includes(urun.uid);

  return (
    <>
      <div className="absolute right-2 top-11 z-10 flex flex-col gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          aria-label="Hızlı bakış"
          title="Hızlı bakış"
          onClick={() => setBakis(true)}
          className="flex size-8 items-center justify-center rounded-full bg-surface/90 text-soft shadow-sm backdrop-blur transition hover:scale-110 hover:text-foreground"
        >
          <Eye className="size-4" />
        </button>
        <button
          type="button"
          aria-label={secili ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
          title={secili ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
          aria-pressed={secili}
          onClick={() => {
            const doluydu = uidler.length >= KARSILASTIRMA_AZAMI && !secili;
            degistir(urun.uid);
            if (secili) toast.success("Karşılaştırmadan çıkarıldı");
            else if (doluydu)
              toast.info(`Karşılaştırma listesi ${KARSILASTIRMA_AZAMI} ürünle sınırlı — en eski ürün düştü.`);
            else toast.success("Karşılaştırmaya eklendi");
          }}
          className={`flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110 ${
            secili ? "text-accent" : "text-soft hover:text-foreground"
          }`}
        >
          <BarChart3 className="size-4" />
        </button>
      </div>

      {bakis ? <HizliBakis uid={urun.uid} onKapat={() => setBakis(false)} /> : null}
    </>
  );
}
