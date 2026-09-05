"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SiparisDetayKarti } from "@/components/siparis-detay";
import { siparisSorgula } from "@/lib/api/account";

/**
 * Belge no + e-posta formu; eşleşirse sipariş detayı (durum, satırlar, kargo
 * takip) gösterilir. Talep açmak için giriş gerekir — burada yalnız okuma.
 */
export function SiparisSorgulama() {
  const [docNum, setDocNum] = useState("");
  const [email, setEmail] = useState("");
  const sorgu = useMutation({
    mutationFn: () => siparisSorgula(docNum.trim(), email.trim()),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <PackageSearch className="size-6 text-accent" /> Sipariş Sorgula
      </h1>
      <p className="text-sm text-soft">
        Sipariş numaranızı ve siparişte kullandığınız e-postayı girin. Üye iseniz{" "}
        <Link href="/hesap" className="font-medium text-accent hover:underline">
          hesabınızdan
        </Link>{" "}
        tüm siparişlerinizi görebilirsiniz.
      </p>

      <form
        className="grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          sorgu.mutate();
        }}
      >
        <input
          value={docNum}
          required
          placeholder="Sipariş no (örn. MERKEZ-SIP-2026-0001)"
          onChange={(e) => setDocNum(e.target.value)}
          className="rounded-xl border border-line bg-background px-3 py-2.5 text-sm"
        />
        <input
          type="email"
          value={email}
          required
          placeholder="E-posta"
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-line bg-background px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={sorgu.isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
        >
          {sorgu.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Sorgula
        </button>
      </form>

      {sorgu.isError ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {sorgu.error instanceof Error ? sorgu.error.message : "Sipariş bulunamadı."}
        </p>
      ) : null}
      {sorgu.data ? <SiparisDetayKarti detay={sorgu.data} /> : null}
    </div>
  );
}
