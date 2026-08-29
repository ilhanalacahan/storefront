"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * ÇEREZ BİLGİLENDİRMESİ.
 *
 * Bu sitede yalnız ZORUNLU tarayıcı depolaması kullanılır (sepet kimliği,
 * oturum, ödeme izi) — reklam ya da izleme çerezi yoktur. Zorunlu çerez için
 * rıza aranmaz; aranan şey BİLGİLENDİRMEDİR. Bu yüzden bant "kabul et /
 * reddet" ikilisi sunmaz: reddedilebilecek bir şey yok, reddet düğmesi koymak
 * yanıltıcı olurdu.
 *
 * İzleme çerezi eklenirse bu bileşen gerçek bir RIZA kapısına dönüşmek
 * zorundadır: varsayılan kapalı, seçimli ve geri alınabilir.
 *
 * Kapatma bilgisi localStorage'ta; sunucuya hiçbir şey gitmez.
 */

const ANAHTAR = "tsf-cerez-bilgi";

export function CerezBandi() {
  const [gorunur, setGorunur] = useState(false);

  // Sunucu render'ında GÖSTERİLMEZ: localStorage yalnız tarayıcıda okunabilir
  // ve sunucuda "göster" deyip istemcide gizlemek, sayfa açılışında bandın
  // bir an görünüp kaybolmasına yol açardı.
  useEffect(() => {
    try {
      if (!localStorage.getItem(ANAHTAR)) setGorunur(true);
    } catch {
      /* depo yok — bant hiç gösterilmez, bilgilendirme sayfası zaten erişilebilir */
    }
  }, []);

  if (!gorunur) return null;

  const kapat = () => {
    try {
      localStorage.setItem(ANAHTAR, "1");
    } catch {
      /* yok sayılır */
    }
    setGorunur(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 p-4 backdrop-blur md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-2xl md:border">
      <p className="text-sm text-soft">
        Bu sitede yalnız sepetinizin ve oturumunuzun çalışması için gerekli
        çerezler kullanılır; reklam ya da izleme çerezi yoktur.{" "}
        <Link href="/sozlesmeler/cerez" className="font-medium text-accent hover:underline">
          Ayrıntılar
        </Link>
      </p>
      <button
        type="button"
        onClick={kapat}
        className="mt-3 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover md:w-auto"
      >
        Anladım
      </button>
    </div>
  );
}
