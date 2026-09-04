"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { favoriEkle, favoriSil, favoriUidleri } from "@/lib/api/yorum";
import { useAuthStore } from "@/store/auth-store";

const ANAHTAR = ["favoriler", "uids"] as const;

/**
 * Favori uid kümesi — kalp rozetlerinin tek doğruluk kaynağı. Girişsizken
 * sorgu kapalıdır (boş küme); giriş yapınca çekilir. Mutasyonlar sunucunun
 * döndürdüğü güncel listeyi cache'e yazar (V5 kalıbı — invalidation değil).
 */
export function useFavoriUidleri() {
  const token = useAuthStore((s) => s.token);
  return useQuery<string[]>({
    queryKey: ANAHTAR,
    queryFn: () => favoriUidleri(token),
    enabled: !!token,
    staleTime: 60_000,
  });
}

/** Kalp düğmesi: ekle/çıkar. Girişsiz kullanıcı hesap sayfasına yönlendirilir. */
export function useFavoriDegistir() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: ({ productUid, ekle }: { productUid: string; ekle: boolean }) =>
      ekle ? favoriEkle(productUid, token) : favoriSil(productUid, token),
    onSuccess: (uids, { ekle }) => {
      qc.setQueryData(ANAHTAR, uids);
      // Favori listesi sayfası ürün satırlarını ayrıca çeker; bayatlamasın.
      void qc.invalidateQueries({ queryKey: ["favoriler", "urunler"] });
      toast.success(ekle ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Favori güncellenemedi."),
  });
  return {
    ...mutation,
    degistir: (productUid: string, ekle: boolean) => {
      if (!token) {
        toast.info("Favorilere eklemek için giriş yapın.");
        router.push("/hesap");
        return;
      }
      mutation.mutate({ productUid, ekle });
    },
  };
}
