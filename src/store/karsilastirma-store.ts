"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * KARŞILAŞTIRMA LİSTESİ — yalnız ürün uid'leri.
 *
 * Ürünün kendisi SAKLANMAZ, uid'i saklanır: fiyat ve stok saklanan bir kopyada
 * saatler içinde bayatlar ve müşteriye karşılaştırma tablosunda yanlış fiyat
 * gösterirdi. Karşılaştırma sayfası uid'lerle canlı detay çeker (G2 — fiyatın
 * tek kapısı çözücüdür).
 *
 * SINIR DÖRT ÜRÜNDÜR: tablo yatayda dörtten fazlasını okunur biçimde
 * taşımıyor. Beşinci eklenince en eski düşer — "liste dolu" uyarısı vermek
 * müşteriyi listeyi temizlemeye zorlamaktı.
 */
const AZAMI = 4;

interface KarsilastirmaState {
  uidler: string[];
  degistir: (uid: string) => void;
  cikar: (uid: string) => void;
  temizle: () => void;
}

export const useKarsilastirmaStore = create<KarsilastirmaState>()(
  persist(
    (set) => ({
      uidler: [],
      degistir: (uid) =>
        set((s) => {
          if (s.uidler.includes(uid)) return { uidler: s.uidler.filter((u) => u !== uid) };
          return { uidler: [...s.uidler, uid].slice(-AZAMI) };
        }),
      cikar: (uid) => set((s) => ({ uidler: s.uidler.filter((u) => u !== uid) })),
      temizle: () => set({ uidler: [] }),
    }),
    { name: "tsf-karsilastirma" },
  ),
);

export const KARSILASTIRMA_AZAMI = AZAMI;
