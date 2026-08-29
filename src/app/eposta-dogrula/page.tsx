import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EpostaDogrulama } from "./dogrula-icerik";

/**
 * /eposta-dogrula?kod=… — e-posta doğrulama bağlantısının indiği sayfa.
 *
 * ANONİM ÇALIŞIR: müşteri bağlantıya çoğu zaman telefonundaki e-posta
 * uygulamasından tıklar ve orada oturumu yoktur. Yetkiyi jetonun kendisi
 * taşır.
 */
export const metadata: Metadata = {
  title: "E-posta Doğrulama",
  robots: { index: false, follow: false },
};

export default function EpostaDogrulaSayfasi() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24 text-soft">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <EpostaDogrulama />
    </Suspense>
  );
}
