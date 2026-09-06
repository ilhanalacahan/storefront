"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * PAYLAŞ — cihazın kendi paylaşım sayfası, yoksa bağlantıyı kopyala.
 *
 * SOSYAL AĞ DÜĞMESİ KOYULMAZ: her ağ için ayrı düğme koymak hem ağların
 * değişen URL şemalarına bağımlılık üretir hem de mobilde `navigator.share`
 * zaten kullanıcının kendi uygulama listesini açar. Masaüstünde tek anlamlı
 * eylem bağlantıyı kopyalamaktır.
 */
export function Paylas({ baslik, metin }: { baslik: string; metin?: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  // Cihazın kendi paylaşım sayfası VAR MI: sunucuda `navigator` yoktur ve
  // tipi de "her zaman tanımlı" der; gerçeği ancak tarayıcıda öğreniriz.
  const [cihazPaylasimi, setCihazPaylasimi] = useState(false);
  useEffect(() => {
    setCihazPaylasimi(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const paylas = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (cihazPaylasimi) {
      try {
        await navigator.share({ title: baslik, text: metin, url });
        return;
      } catch {
        /* kullanıcı vazgeçti ya da izin yok — kopyalamaya düşülür */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setKopyalandi(true);
      toast.success("Bağlantı kopyalandı");
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      toast.error("Bağlantı kopyalanamadı.");
    }
  };

  return (
    <button
      type="button"
      onClick={paylas}
      className="flex items-center gap-1.5 text-sm text-soft transition hover:text-foreground"
    >
      {kopyalandi ? (
        <Check className="size-4 text-success" />
      ) : cihazPaylasimi ? (
        <Share2 className="size-4" />
      ) : (
        <Link2 className="size-4" />
      )}
      Paylaş
    </button>
  );
}
