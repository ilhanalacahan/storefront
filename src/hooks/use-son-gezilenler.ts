"use client";

import { useEffect, useState } from "react";

/**
 * SON GEZİLEN ÜRÜNLER — tarayıcıya özel, sunucuya hiç gitmeyen bir iz.
 *
 * Neden localStorage: bu bilgi kişiseldir ve ticari bir kayıt değildir.
 * Sunucuda tutulsaydı anonim ziyaretçi için kimlik üretmek (çerez + tablo)
 * gerekirdi; kazancı yok, KVKK yükü var (veri minimizasyonu — G19'un aynı
 * gerekçesi).
 *
 * SAKLANAN YALNIZ UID'DİR. Ürün adı/fiyatı saklansaydı şerit bayat fiyat
 * gösterirdi; şerit uid'lerle canlı detay çeker.
 */
const ANAHTAR = "tsf-son-gezilen";
const AZAMI = 12;

function oku(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const ham = window.localStorage.getItem(ANAHTAR);
    const dizi: unknown = ham ? JSON.parse(ham) : [];
    return Array.isArray(dizi) ? dizi.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Ürünü listenin başına yazar (zaten varsa öne taşır). */
export function sonGezileneEkle(uid: string) {
  if (typeof window === "undefined" || !uid) return;
  try {
    const yeni = [uid, ...oku().filter((u) => u !== uid)].slice(0, AZAMI);
    window.localStorage.setItem(ANAHTAR, JSON.stringify(yeni));
  } catch {
    /* özel sekme / kota — iz tutulamazsa sessizce vazgeçilir */
  }
}

/**
 * Son gezilen uid'ler. `haric` bakılmakta olan ürünü listeden düşürür —
 * ürün sayfasında "son gezilenler" şeridinin ilk kartı yine o ürün olmamalı.
 *
 * Değer İLK RENDER'DA BOŞ döner ve effect'te dolar: localStorage sunucuda
 * yoktur; doğrudan okumak hidrasyon uyuşmazlığı üretirdi.
 */
export function useSonGezilenler(haric?: string): string[] {
  const [uidler, setUidler] = useState<string[]>([]);
  useEffect(() => {
    setUidler(oku().filter((u) => u !== haric));
  }, [haric]);
  return uidler;
}
