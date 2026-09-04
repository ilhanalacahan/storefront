import { Megaphone } from "lucide-react";
import Link from "next/link";

import type { StorefrontBanner } from "@/lib/api/cms";

/**
 * Duyuru çubuğu — her sayfanın en üstünde tek satır (banner türü 3).
 * Birden fazla duyuru varsa yan yana, ayraçla. Bağlantı verilmişse tıklanır.
 */
export function DuyuruCubugu({ duyurular }: { duyurular: StorefrontBanner[] }) {
  if (!duyurular.length) return null;
  return (
    <div className="bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-center text-xs font-medium">
        {duyurular.map((d) => {
          const icerik = (
            <>
              <Megaphone className="size-3.5 shrink-0" aria-hidden />
              <span>{d.title}</span>
              {d.linkLabel ? <span className="underline underline-offset-2">{d.linkLabel}</span> : null}
            </>
          );
          return d.linkUrl ? (
            <Link key={d.uid} href={d.linkUrl} className="inline-flex items-center gap-1.5 hover:opacity-90">
              {icerik}
            </Link>
          ) : (
            <span key={d.uid} className="inline-flex items-center gap-1.5">
              {icerik}
            </span>
          );
        })}
      </div>
    </div>
  );
}
