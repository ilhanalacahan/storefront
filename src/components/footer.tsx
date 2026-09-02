import { Zap } from "lucide-react";
import Link from "next/link";

import { BELGE_ADLARI, BELGE_SIRASI } from "@/lib/sozlesmeler";

const SITE_ADI = process.env.NEXT_PUBLIC_SITE_NAME ?? "StoreFront";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-bold">{SITE_ADI}</span>
          </div>
          <p className="text-sm text-soft">
            TicariCore ERP üzerinde çalışan açık kaynak headless e-ticaret vitrini.
            Bu bir demo şablonudur — fork'layıp kendi mağazanıza dönüştürün.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-semibold">Mağaza</p>
            <ul className="space-y-1.5 text-soft">
              <li><Link href="/urunler" className="hover:text-foreground">Tüm Ürünler</Link></li>
              <li><Link href="/sepet" className="hover:text-foreground">Sepetim</Link></li>
              <li><Link href="/hesap" className="hover:text-foreground">Hesabım</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Yasal</p>
            <ul className="space-y-1.5 text-soft">
              {BELGE_SIRASI.map((k) => (
                <li key={k}>
                  <Link href={`/sozlesmeler/${k}`} className="hover:text-foreground">
                    {BELGE_ADLARI[k]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Proje</p>
            <ul className="space-y-1.5 text-soft">
              <li>
                <a
                  href="https://github.com/ilhanalacahan/storefront"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li><span>MIT Lisansı</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-soft">
        StoreFront — TicariCore headless demo · fiyatlar KDV dahildir
      </div>
    </footer>
  );
}
