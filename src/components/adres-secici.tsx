"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import Link from "next/link";

import { adreslerim } from "@/lib/api/account";
import type { StorefrontAddress } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

/**
 * ADRES DEFTERİ SEÇİCİSİ — kayıtlı adresleri checkout formuna taşır.
 *
 * SEÇİM FORMU DOLDURUR, uid GÖNDERMEZ: sepet ucu adres defteri uid'ini de
 * kabul eder ama o yol müşteriye seçtiği adresi GÖSTERMEZ ve düzenletmez.
 * Adresi forma yazmak, "bu sefer kapı numarası farklı" diyen müşteriyi
 * defterine dokunmadan devam ettirir.
 *
 * Girişsiz müşteride hiç çizilmez — defteri yoktur.
 */
export function AdresSecici({ onSec }: { onSec: (a: StorefrontAddress) => void }) {
  const token = useAuthStore((s) => s.token);
  const { data } = useQuery({
    queryKey: ["hesap", "adresler"],
    queryFn: () => adreslerim(token),
    enabled: !!token,
    staleTime: 60_000,
  });
  const adresler = data ?? [];
  if (!token || !adresler.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Kayıtlı adreslerim</p>
        <Link href="/hesap?sekme=adresler" className="text-xs font-medium text-accent hover:underline">
          <Plus className="mr-0.5 inline size-3" aria-hidden />
          Adres ekle
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {adresler.map((a) => (
          <button
            key={a.uid}
            type="button"
            onClick={() => onSec(a)}
            className="rounded-xl border border-line bg-background p-3 text-left text-sm transition hover:border-accent"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="size-3.5 text-soft" aria-hidden />
              {a.title || a.fullName}
              {a.isDefaultShip ? (
                <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                  Varsayılan
                </span>
              ) : null}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs text-soft">
              {a.address} · {a.district ? `${a.district}, ` : ""}
              {a.city}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
