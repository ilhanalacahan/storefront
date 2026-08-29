import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { SifreSifirlama } from "./sifre-icerik";

/**
 * /sifre-sifirla — parolamı unuttum + yeni parola.
 * Adreste `kod` varsa ikinci hâl açılır (bkz. sifre-icerik.tsx).
 *
 * Arama motoruna KAPALI: kişisel bir işlem akışıdır, dizine girmesinin
 * kimseye faydası yok.
 */
export const metadata: Metadata = {
  title: "Parola Sıfırlama",
  robots: { index: false, follow: false },
};

export default function SifreSifirlaSayfasi() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24 text-soft">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <SifreSifirlama />
    </Suspense>
  );
}
