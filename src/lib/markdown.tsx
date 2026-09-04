import Link from "next/link";
import type { ReactNode } from "react";

/**
 * GÜVENLİ MARKDOWN — alt küme, React düğümlerine çevrilir.
 *
 * Ham HTML HİÇ İŞLENMEZ: `dangerouslySetInnerHTML` yoktur, metin olduğu gibi
 * React'e verilir (kaçırılır). Yönetici hesabından bile script sızmaz; harici
 * bir Markdown/sanitize bağımlılığı da gerekmez. Vitrin sayfaları (CMS),
 * ürün ve kategori açıklamaları aynı çiziciden geçer.
 *
 * Desteklenen: # başlıklar (1–4), paragraf, `- ` / `* ` madde, `1. ` sıralı,
 * `> ` alıntı, `---` çizgi, **kalın**, *italik*, `kod`, [bağlantı](url),
 * ![görsel](url). Bağlantı hedefi yalnız http(s), mailto, göreli (/…) ve
 * çapa (#…) olabilir — `javascript:` ve benzeri şemalar düz metne düşer.
 */

type Blok =
  | { tur: "baslik"; seviye: number; metin: string }
  | { tur: "paragraf"; metin: string }
  | { tur: "liste"; sirali: boolean; ogeler: string[] }
  | { tur: "alinti"; metin: string }
  | { tur: "cizgi" };

function bloklaraAyir(kaynak: string): Blok[] {
  const satirlar = kaynak.replace(/\r\n?/g, "\n").split("\n");
  const bloklar: Blok[] = [];
  let paragraf: string[] = [];
  let liste: { sirali: boolean; ogeler: string[] } | null = null;
  let alinti: string[] = [];

  const paragrafKapat = () => {
    if (paragraf.length) bloklar.push({ tur: "paragraf", metin: paragraf.join("\n") });
    paragraf = [];
  };
  const listeKapat = () => {
    if (liste) bloklar.push({ tur: "liste", ...liste });
    liste = null;
  };
  const alintiKapat = () => {
    if (alinti.length) bloklar.push({ tur: "alinti", metin: alinti.join("\n") });
    alinti = [];
  };
  const hepsiniKapat = () => {
    paragrafKapat();
    listeKapat();
    alintiKapat();
  };

  for (const ham of satirlar) {
    const satir = ham.trimEnd();
    if (!satir.trim()) {
      hepsiniKapat();
      continue;
    }
    const baslik = /^(#{1,4})\s+(.*)$/.exec(satir);
    if (baslik) {
      hepsiniKapat();
      bloklar.push({ tur: "baslik", seviye: baslik[1].length, metin: baslik[2].trim() });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(satir.trim())) {
      hepsiniKapat();
      bloklar.push({ tur: "cizgi" });
      continue;
    }
    const madde = /^\s*[-*]\s+(.*)$/.exec(satir);
    const sirali = /^\s*\d+[.)]\s+(.*)$/.exec(satir);
    if (madde || sirali) {
      paragrafKapat();
      alintiKapat();
      const s = Boolean(sirali);
      if (!liste || liste.sirali !== s) {
        listeKapat();
        liste = { sirali: s, ogeler: [] };
      }
      liste.ogeler.push((madde ?? sirali)![1]);
      continue;
    }
    const alintiSatir = /^>\s?(.*)$/.exec(satir);
    if (alintiSatir) {
      paragrafKapat();
      listeKapat();
      alinti.push(alintiSatir[1]);
      continue;
    }
    listeKapat();
    alintiKapat();
    paragraf.push(satir.trim());
  }
  hepsiniKapat();
  return bloklar;
}

const GUVENLI_SEMA = /^(https?:\/\/|mailto:|\/|#)/i;

function guvenliUrl(url: string): string | null {
  const u = url.trim();
  if (!u || u.length > 2048) return null;
  if (/^[a-z]+:/i.test(u) && !/^(https?|mailto):/i.test(u)) return null; // javascript:, data:, vb.
  return GUVENLI_SEMA.test(u) || !/^[a-z]+:/i.test(u) ? u : null;
}

/** Satır içi işaretleri React düğümlerine çevirir. */
function satirIci(metin: string, anahtar = "s"): ReactNode[] {
  const out: ReactNode[] = [];
  // Sıra önemli: görsel, bağlantı, kalın, italik, kod.
  const desen = /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let son = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const metinEkle = (parca: string) => {
    if (!parca) return;
    // Satır sonu → <br>: paragraf içindeki tek satır kesmeleri korunur.
    const satirlar = parca.split("\n");
    satirlar.forEach((s, k) => {
      if (k > 0) out.push(<br key={`${anahtar}-br-${i++}`} />);
      if (s) out.push(s);
    });
  };
  while ((m = desen.exec(metin)) !== null) {
    metinEkle(metin.slice(son, m.index));
    son = m.index + m[0].length;
    const k = `${anahtar}-${i++}`;
    if (m[1]) {
      const src = guvenliUrl(m[3]);
      if (src && /^https?:\/\//i.test(src)) {
        // eslint-disable-next-line @next/next/no-img-element -- içerik görseli; boyut bilinmiyor
        out.push(<img key={k} src={src} alt={m[2]} className="my-3 max-w-full rounded-xl" />);
      } else {
        out.push(m[2] || m[0]);
      }
    } else if (m[4]) {
      const href = guvenliUrl(m[6]);
      if (!href) {
        out.push(m[5]);
      } else if (href.startsWith("/") || href.startsWith("#")) {
        out.push(
          <Link key={k} href={href} className="font-medium text-accent hover:underline">
            {satirIci(m[5], k)}
          </Link>,
        );
      } else {
        out.push(
          <a key={k} href={href} target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
            {satirIci(m[5], k)}
          </a>,
        );
      }
    } else if (m[7]) {
      out.push(<strong key={k}>{satirIci(m[8], k)}</strong>);
    } else if (m[9]) {
      out.push(<em key={k}>{satirIci(m[10], k)}</em>);
    } else if (m[11]) {
      out.push(
        <code key={k} className="rounded bg-line/60 px-1 py-0.5 font-mono text-[0.9em]">
          {m[12]}
        </code>,
      );
    }
  }
  metinEkle(metin.slice(son));
  return out;
}

const BASLIK_SINIFI: Record<number, string> = {
  1: "text-2xl font-bold",
  2: "text-xl font-bold",
  3: "text-lg font-semibold",
  4: "text-base font-semibold",
};

/** Markdown metnini çizer; boş metin hiç çizmez. */
export function Markdown({ metin, className = "" }: { metin: string; className?: string }) {
  const bloklar = bloklaraAyir(metin ?? "");
  if (!bloklar.length) return null;
  return (
    <div className={`space-y-3 text-sm leading-relaxed ${className}`}>
      {bloklar.map((b, i) => {
        switch (b.tur) {
          case "baslik": {
            const Etiket = `h${Math.min(b.seviye + 1, 6)}` as "h2" | "h3" | "h4" | "h5";
            return (
              <Etiket key={i} className={`${BASLIK_SINIFI[b.seviye]} mt-4 first:mt-0`}>
                {satirIci(b.metin, `b${i}`)}
              </Etiket>
            );
          }
          case "paragraf":
            return (
              <p key={i} className="text-soft">
                {satirIci(b.metin, `p${i}`)}
              </p>
            );
          case "liste": {
            const Etiket = b.sirali ? "ol" : "ul";
            return (
              <Etiket key={i} className={`${b.sirali ? "list-decimal" : "list-disc"} space-y-1 pl-5 text-soft`}>
                {b.ogeler.map((o, k) => (
                  <li key={k}>{satirIci(o, `l${i}-${k}`)}</li>
                ))}
              </Etiket>
            );
          }
          case "alinti":
            return (
              <blockquote key={i} className="border-l-4 border-accent/40 pl-4 italic text-soft">
                {satirIci(b.metin, `a${i}`)}
              </blockquote>
            );
          case "cizgi":
            return <hr key={i} className="border-line" />;
        }
      })}
    </div>
  );
}
