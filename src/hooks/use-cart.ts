"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  adresYaz,
  kargoSec,
  kargoSecenekleri,
  kuponKaldir,
  kuponUygula,
  satirAyarla,
  sepetGetir,
  sepeteEkle,
} from "@/lib/api/cart";
import type { Cart, CartAddressInput } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

/**
 * Sepetin tek doğruluk kaynağı: ['sepet', cartUid] sorgusu.
 * Her mutasyon backend'den GÜNCEL sepeti döndürür ve cache'e doğrudan yazılır —
 * ayrıca invalidation gerekmez, toplamlar hep sunucunun hesabıdır.
 */
export function useCart() {
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  return useQuery<Cart | null>({
    queryKey: ["sepet", cartUid],
    queryFn: () => sepetGetir(cartUid, token || null),
    enabled: !!cartUid,
    staleTime: 15_000,
  });
}

function useSepetYaz() {
  const qc = useQueryClient();
  const setCartUid = useCartStore((s) => s.setCartUid);
  return (sepet: Cart) => {
    setCartUid(sepet.uid);
    qc.setQueryData(["sepet", sepet.uid], sepet);
  };
}

/** Sepete ekle — sepet yoksa ilk eklemede backend yeni sepet açar. */
export function useSepeteEkle() {
  const cartUid = useCartStore((s) => s.cartUid);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const token = useAuthStore((s) => s.token);
  const yaz = useSepetYaz();
  return useMutation({
    mutationFn: ({ productUid, quantity = "1" }: { productUid: string; quantity?: string }) =>
      sepeteEkle(cartUid, productUid, quantity, token || null),
    onSuccess: (sepet) => {
      yaz(sepet);
      toast.success("Sepete eklendi");
      openDrawer();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Sepete eklenemedi."),
  });
}

/** Satır miktarını mutlak değere çeker ("0" = satırı sil). */
export function useSatirAyarla() {
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  const yaz = useSepetYaz();
  return useMutation({
    mutationFn: ({ productUid, quantity }: { productUid: string; quantity: string }) =>
      satirAyarla(cartUid, productUid, quantity, token || null),
    onSuccess: yaz,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Sepet güncellenemedi."),
  });
}

export function useAdresYaz() {
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  const yaz = useSepetYaz();
  return useMutation({
    mutationFn: (input: CartAddressInput) => adresYaz(cartUid, input, token || null),
    onSuccess: yaz,
  });
}

/**
 * Teslimat seçenekleri — ücret sepete bağlı olduğu için sorgu anahtarı sepeti
 * TAŞIR: sepet değişince (ürün eklendi, kupon uygulandı) eşik yeniden
 * değerlendirilmeli, yoksa "150 TL üstü ücretsiz" rozeti bayat kalır.
 */
export function useKargoSecenekleri() {
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  const { data: sepet } = useCart();
  return useQuery({
    queryKey: ["kargo-secenekleri", cartUid, sepet?.subTotal ?? ""],
    queryFn: () => kargoSecenekleri(cartUid, token || null),
    staleTime: 30_000,
  });
}

export function useKargoSec() {
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  const yaz = useSepetYaz();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => kargoSec(cartUid, code, token || null),
    onSuccess: (sepet) => {
      yaz(sepet);
      // Seçenek listesi de tazelenir: seçim toplamı değiştirir ve ücretsiz
      // kargo eşiği yeni toplama göre yeniden çözülür.
      void qc.invalidateQueries({ queryKey: ["kargo-secenekleri"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Teslimat seçilemedi."),
  });
}

export function useKupon() {
  const cartUid = useCartStore((s) => s.cartUid);
  const token = useAuthStore((s) => s.token);
  const yaz = useSepetYaz();
  const uygula = useMutation({
    mutationFn: (code: string) => kuponUygula(cartUid, code, token || null),
    onSuccess: (sepet) => {
      yaz(sepet);
      toast.success("Kupon uygulandı");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kupon uygulanamadı."),
  });
  const kaldir = useMutation({
    mutationFn: () => kuponKaldir(cartUid, token || null),
    onSuccess: yaz,
  });
  return { uygula, kaldir };
}

/** Sepetteki toplam parça sayısı — header rozetinde. */
export function useSepetAdedi(): number {
  const { data } = useCart();
  if (!data || data.status !== 0) return 0;
  return data.lines.reduce((t, l) => t + Number(l.quantity), 0);
}
