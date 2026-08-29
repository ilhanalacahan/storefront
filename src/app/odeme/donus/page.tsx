import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { OdemeDonusu } from "./donus-icerik";

/**
 * ÖDEME DÖNÜŞ SAYFASI — /odeme/donus?oturum=<uid>
 *
 * Ödemenin TEK sonuç yüzeyi. Müşteri buraya iki yoldan gelir:
 *
 *   1. Gerçek sağlayıcıda bankanın 3D sayfasından yönlendirilerek. Uygulama
 *      sıfırdan boot olur; hangi ödeme olduğunu adresteki `oturum` parametresi
 *      ya da ödeme izi (lib/odeme-izi.ts) söyler.
 *   2. Test sağlayıcısında /odeme sayfası doğrudan buraya taşıyarak.
 *
 * İkisinin aynı sayfaya düşmesi bilinçlidir: sonuç ekranı iki yerde yaşarsa
 * biri ötekinden sapar ve sapmayı ancak gerçek bir ödeme ortaya çıkarır.
 *
 * Sonuç ANLIK OLMAYABİLİR: müşteri 3D sayfasında tarayıcıyı kapatsa bile
 * ödeme sağlayıcı webhook'uyla sonuçlanır. Bu yüzden sayfa bekleyen durumda
 * yoklamaya devam eder — "başarısız" demek için acele etmez.
 */
export const metadata: Metadata = {
  title: "Ödeme Sonucu",
  robots: { index: false, follow: false },
};

export default function OdemeDonusSayfasi() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-3 py-24 text-soft">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Ödeme sonucu alınıyor…</p>
        </div>
      }
    >
      <OdemeDonusu />
    </Suspense>
  );
}
