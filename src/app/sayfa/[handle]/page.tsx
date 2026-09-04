import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KirintiYapisalVerisi } from "@/components/json-ld";
import { Kirinti } from "@/components/kirinti";
import { sayfaGetir, sayfaYolu } from "@/lib/api/cms";
import { tarih } from "@/lib/format";
import { Markdown } from "@/lib/markdown";

/**
 * İçerik sayfası (/sayfa/[handle]) — Hakkımızda, SSS, koşullar… Gövde
 * Markdown'dır ve React düğümlerine çevrilir (ham HTML işlenmez). 5 dk ISR.
 */

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const sayfa = await sayfaGetir(handle);
  if (!sayfa) return { title: "Sayfa bulunamadı" };
  const baslik = sayfa.metaTitle || sayfa.title;
  const aciklama = sayfa.metaDescription || undefined;
  return {
    title: baslik,
    description: aciklama,
    alternates: { canonical: sayfaYolu(sayfa) },
    openGraph: { title: baslik, description: aciklama, url: sayfaYolu(sayfa) },
  };
}

export default async function IcerikSayfasi({ params }: Props) {
  const { handle } = await params;
  const sayfa = await sayfaGetir(handle);
  if (!sayfa) notFound();

  const kirinti = [{ ad: sayfa.title }];
  return (
    <article className="mx-auto max-w-3xl space-y-5 py-6">
      <KirintiYapisalVerisi ogeler={kirinti} url={sayfaYolu(sayfa)} />
      <Kirinti ogeler={kirinti} />
      <h1 className="text-3xl font-bold">{sayfa.title}</h1>
      <Markdown metin={sayfa.body} className="[&_p]:text-foreground/90" />
      <p className="border-t border-line pt-3 text-xs text-soft">
        Son güncelleme: {tarih(sayfa.updatedAt)}
      </p>
    </article>
  );
}
