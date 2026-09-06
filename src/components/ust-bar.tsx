import { Headphones, Mail, MapPin, PackageSearch, Phone, RotateCcw } from "lucide-react";
import Link from "next/link";

import { sayfaYolu, type StorefrontPage } from "@/lib/api/cms";

/**
 * ÜST HİZMET ÇUBUĞU — başlığın üstünde, koyu zeminli ince şerit.
 *
 * Ticari vitrinlerin standart parçası: müşterinin satın almadan önce aradığı
 * üç şey (nasıl ulaşırım · siparişim nerede · iade nasıl) menüde yer kaplamadan
 * her sayfada durur. Masaüstünde çizilir; mobilde gizlenir — orada aynı
 * bağlantılar çekmece menüdedir.
 *
 * İletişim bilgisi satıcı künyesinden (NEXT_PUBLIC_SATICI_*) gelir; tanımlı
 * değilse o parça hiç çizilmez. Uydurma telefon numarası basmak, sözleşme
 * sayfasında olduğu gibi burada da yanlıştır.
 */
export function UstBar({ sayfalar }: { sayfalar: StorefrontPage[] }) {
  const telefon = (process.env.NEXT_PUBLIC_SATICI_TELEFON ?? "").trim();
  const eposta = (process.env.NEXT_PUBLIC_SATICI_EPOSTA ?? "").trim();

  return (
    <div className="hidden bg-top-bar text-top-bar-foreground md:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-5 px-4 text-xs">
        {telefon ? (
          <a href={`tel:${telefon.replace(/\s/g, "")}`} className="flex items-center gap-1.5 transition hover:text-white">
            <Phone className="size-3.5" aria-hidden />
            {telefon}
          </a>
        ) : null}
        {eposta ? (
          <a href={`mailto:${eposta}`} className="flex items-center gap-1.5 transition hover:text-white">
            <Mail className="size-3.5" aria-hidden />
            {eposta}
          </a>
        ) : null}

        <div className="ml-auto flex items-center gap-5">
          <Link href="/siparis-sorgula" className="flex items-center gap-1.5 transition hover:text-white">
            <PackageSearch className="size-3.5" aria-hidden />
            Sipariş Sorgula
          </Link>
          <Link href="/sozlesmeler/iptal-iade" className="flex items-center gap-1.5 transition hover:text-white">
            <RotateCcw className="size-3.5" aria-hidden />
            Kolay İade
          </Link>
          {sayfalar.slice(0, 3).map((s) => (
            <Link key={s.uid} href={sayfaYolu(s)} className="transition hover:text-white">
              {s.title}
            </Link>
          ))}
          <Link href="/hesap" className="flex items-center gap-1.5 transition hover:text-white">
            <Headphones className="size-3.5" aria-hidden />
            Destek
          </Link>
          <span className="flex items-center gap-1.5 opacity-70">
            <MapPin className="size-3.5" aria-hidden />
            Türkiye geneli kargo
          </span>
        </div>
      </div>
    </div>
  );
}
