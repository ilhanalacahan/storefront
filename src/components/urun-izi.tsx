"use client";

import { useEffect } from "react";

import { sonGezileneEkle } from "@/hooks/use-son-gezilenler";

/**
 * ÜRÜN İZİ — ürün sayfası açıldığında "son gezilenler" listesine yazar.
 *
 * Görünmez bir bileşendir; ürün sayfasının Server Component olarak kalabilmesi
 * için ayrı durur. Yazma tarayıcıdadır ve sunucuya HİÇ gitmez (KVKK/veri
 * minimizasyonu — bkz. use-son-gezilenler.ts).
 */
export function UrunIzi({ uid }: { uid: string }) {
  useEffect(() => {
    sonGezileneEkle(uid);
  }, [uid]);
  return null;
}
