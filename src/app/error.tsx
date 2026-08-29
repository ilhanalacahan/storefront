"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { hataBildir } from "@/lib/hata-bildir";

/**
 * Sayfa hata sınırı — bir sayfa render sırasında patlarsa burası çizilir.
 *
 * Kabuk (header/footer/sepet) AYAKTA KALIR: layout'un altındadır, yani
 * müşteri hatalı sayfadan çıkıp alışverişe devam edebilir. Tüm siteyi
 * götüren hatalar için ayrı bir sınır var: global-error.tsx.
 *
 * HATA MESAJI EKRANA BASILMAZ: sunucu hatalarının metni iç ayrıntı taşıyabilir
 * (sorgu, dosya yolu). Müşteriye anlaşılır bir metin, mağazaya ise hata
 * defterine düşen tam kayıt gider.
 */
export default function Hata({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    hataBildir(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-9" />
      </span>
      <h1 className="text-xl font-bold">Bir şeyler ters gitti</h1>
      <p className="text-sm text-soft">
        Bu sayfa yüklenirken beklenmedik bir hata oluştu. Sorun bize iletildi;
        tekrar deneyebilir ya da alışverişe devam edebilirsiniz.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-soft">Hata kodu: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <RotateCcw className="size-4" /> Tekrar Dene
        </button>
        <Link
          href="/urunler"
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:bg-surface"
        >
          Ürünlere Dön
        </Link>
      </div>
    </div>
  );
}
