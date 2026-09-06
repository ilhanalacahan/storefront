import { Check } from "lucide-react";

/**
 * ÖDEME ADIM GÖSTERGESİ — "neredeyim, kaç adım kaldı".
 *
 * Checkout'ta terk oranını düşüren en ucuz şey budur: müşteri kaç adım
 * olduğunu bilmediği bir formu yarıda bırakır. Gösterge SÜREÇ YÖNETMEZ,
 * yalnız durumu çizer — adımlar arası geçiş sayfanın kendi akışındadır.
 */
export function OdemeAdimlari({ aktif }: { aktif: "adres" | "teslimat" | "odeme" }) {
  const adimlar = [
    { anahtar: "adres", etiket: "Adres" },
    { anahtar: "teslimat", etiket: "Teslimat" },
    { anahtar: "odeme", etiket: "Ödeme" },
  ] as const;
  const indeks = adimlar.findIndex((a) => a.anahtar === aktif);

  return (
    <ol className="flex items-center gap-2 text-sm">
      {adimlar.map((a, i) => {
        const tamam = i < indeks;
        const simdi = i === indeks;
        return (
          <li key={a.anahtar} className="flex flex-1 items-center gap-2">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                tamam
                  ? "bg-success text-white"
                  : simdi
                    ? "bg-accent text-accent-foreground"
                    : "bg-line text-soft"
              }`}
            >
              {tamam ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={simdi ? "font-semibold" : "text-soft"}>{a.etiket}</span>
            {i < adimlar.length - 1 ? (
              <span className={`h-px flex-1 ${tamam ? "bg-success" : "bg-line"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
