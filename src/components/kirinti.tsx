import Link from "next/link";

/** Kırıntı yolu ögesi; `href` yoksa son (aktif) halkadır. */
export interface KirintiOgesi {
  ad: string;
  href?: string;
}

/**
 * Kırıntı yolu (breadcrumb) — kategori sayfası, ürün detayı ve koleksiyon
 * sayfası aynı bileşeni kullanır; JSON-LD karşılığı json-ld.tsx'te
 * (KirintiYapisalVerisi) aynı listeyi alır ki ekranla yapısal veri ayrışmasın.
 */
export function Kirinti({ ogeler }: { ogeler: KirintiOgesi[] }) {
  if (!ogeler.length) return null;
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-soft" aria-label="İçerik yolu">
      <Link href="/" className="hover:text-foreground hover:underline">
        Ana Sayfa
      </Link>
      {ogeler.map((o, i) => (
        <span key={`${o.ad}-${i}`} className="flex items-center gap-1">
          <span aria-hidden>/</span>
          {o.href ? (
            <Link href={o.href} className="hover:text-foreground hover:underline">
              {o.ad}
            </Link>
          ) : (
            <span className="text-foreground" aria-current="page">
              {o.ad}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
