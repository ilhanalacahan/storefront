import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BELGE_ADLARI,
  BELGE_SIRASI,
  belgeAnahtariMi,
  belgeGetir,
} from "@/lib/sozlesmeler";
import { saticiBilgisi, saticiEksikMi } from "@/lib/satici";

/**
 * Yasal metinler — /sozlesmeler/<belge>
 *
 * Tamamı Server Component ve STATİK: içerik yalnız satıcı künyesine (ortam
 * değişkeni) bağlı, sepete ya da müşteriye değil. Bu yüzden build'de üretilir
 * ve arama motoru tam metni görür — mesafeli satışta bu bir zorunluluktur,
 * belgelerin herkese açık ve okunabilir olması gerekir.
 *
 * Künye eksikse sayfa bunu GİZLEMEZ: yayımlanmış ama satıcıyı tanımlamayan bir
 * sözleşme, hiç olmamasından kötüdür.
 */

interface Props {
  params: Promise<{ belge: string }>;
}

export function generateStaticParams() {
  return BELGE_SIRASI.map((belge) => ({ belge }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { belge } = await params;
  if (!belgeAnahtariMi(belge)) return { title: "Belge bulunamadı" };
  const b = belgeGetir(belge);
  return { title: b.baslik, description: b.ozet };
}

export default async function SozlesmeSayfasi({ params }: Props) {
  const { belge } = await params;
  if (!belgeAnahtariMi(belge)) notFound();

  const b = belgeGetir(belge);
  const eksik = saticiEksikMi(saticiBilgisi());

  return (
    <article className="mx-auto max-w-3xl py-8">
      <h1 className="text-2xl font-bold">{b.baslik}</h1>
      <p className="mt-2 text-sm text-soft">{b.ozet}</p>

      {eksik ? (
        <div className="mt-5 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="text-sm">
            <p className="font-semibold text-danger">Bu sayfa yayına hazır değil</p>
            <p className="mt-1 text-soft">
              Satıcı künyesi eksik. Mağaza sahibinin{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SATICI_*
              </code>{" "}
              ortam değişkenlerini doldurması ve metni kendi koşullarına göre hukuk
              danışmanına uyarlatması gerekir.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        {b.bolumler.map((bolum) => (
          <section key={bolum.baslik}>
            <h2 className="text-lg font-semibold">{bolum.baslik}</h2>
            {bolum.paragraflar.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-soft">
                {p}
              </p>
            ))}
            {bolum.maddeler ? (
              <ul className="mt-3 space-y-1.5">
                {bolum.maddeler.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <nav className="mt-12 border-t border-line pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-soft">
          Diğer belgeler
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {BELGE_SIRASI.filter((k) => k !== b.anahtar).map((k) => (
            <li key={k}>
              <Link
                href={`/sozlesmeler/${k}`}
                className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface"
              >
                {BELGE_ADLARI[k]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
