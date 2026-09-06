import type { Metadata } from "next";

import { KarsilastirmaTablosu } from "./tablo";

export const metadata: Metadata = {
  title: "Ürün Karşılaştırma",
  description: "Seçtiğiniz ürünlerin fiyat, stok ve teknik özelliklerini yan yana karşılaştırın.",
  // Karşılaştırma listesi tarayıcıya özeldir; arama motoru için içeriği yoktur.
  robots: { index: false, follow: true },
};

export default function KarsilastirSayfasi() {
  return (
    <div className="space-y-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Ürün Karşılaştırma</h1>
        <p className="text-sm text-soft">
          Kartlardaki karşılaştırma simgesiyle eklediğiniz ürünler burada yan yana durur.
        </p>
      </div>
      <KarsilastirmaTablosu />
    </div>
  );
}
