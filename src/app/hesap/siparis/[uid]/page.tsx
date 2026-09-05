"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";

import { SiparisDetayKarti } from "@/components/siparis-detay";
import { siparisDetay } from "@/lib/api/account";
import { useAuthStore } from "@/store/auth-store";

/**
 * Yazdırılabilir sipariş sayfası — hesap sahibi için. Sunucu tarafında PDF
 * üretimi yoktur; tarayıcının "Yazdır → PDF olarak kaydet" yolu kullanılır.
 * e-Arşiv faturasının PDF'i entegratörden gelir, burada sunulmaz.
 */
export default function SiparisYazdirSayfasi({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const token = useAuthStore((s) => s.token);
  const q = useQuery({
    queryKey: ["siparis-detay", uid],
    queryFn: () => siparisDetay(token, uid),
    enabled: !!token,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-6">
      <Link href="/hesap" className="text-sm text-accent hover:underline print:hidden">
        ← Hesabım
      </Link>
      {!token ? (
        <p className="text-sm text-soft">
          Bu sayfa için{" "}
          <Link href="/hesap" className="font-medium text-accent hover:underline">
            giriş yapın
          </Link>
          .
        </p>
      ) : q.isPending ? (
        <div className="h-40 animate-pulse rounded-2xl bg-line/40" />
      ) : !q.data ? (
        <p className="text-sm text-soft">Sipariş bulunamadı.</p>
      ) : (
        <SiparisDetayKarti detay={q.data} yazdirilabilir />
      )}
    </div>
  );
}
