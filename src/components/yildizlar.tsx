import { Star } from "lucide-react";

/**
 * Yıldız gösterimi — puan sunucudan "4.3" gibi metin gelir; burada yalnız
 * hangi yıldızın dolu çizileceği hesaplanır (yarım yıldız: 0.25–0.75 arası).
 */
export function Yildizlar({
  puan,
  boyut = "sm",
  etiket,
}: {
  /** "4.3" ya da sayı; ''/0 = puan yok. */
  puan: string | number;
  boyut?: "sm" | "md" | "lg";
  /** Yanına yazılacak metin (örn. "(12)"). */
  etiket?: string;
}) {
  const p = typeof puan === "number" ? puan : Number(puan);
  if (!Number.isFinite(p) || p <= 0) return null;
  const sinif = boyut === "lg" ? "size-5" : boyut === "md" ? "size-4" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${p} / 5 puan`}>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const dolu = p >= i - 0.25;
          const yarim = !dolu && p >= i - 0.75;
          return (
            <span key={i} className={`relative ${sinif}`}>
              <Star className={`${sinif} text-line`} aria-hidden />
              {dolu || yarim ? (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: dolu ? "100%" : "50%" }}
                  aria-hidden
                >
                  <Star className={`${sinif} fill-amber-400 text-amber-400`} />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {etiket ? <span className="text-xs text-soft">{etiket}</span> : null}
    </span>
  );
}

/** Puan seçici — yorum formunda tıklanabilir yıldızlar. */
export function YildizSecici({
  deger,
  onChange,
  disabled,
}: {
  deger: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Puan">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={deger === i}
          aria-label={`${i} yıldız`}
          disabled={disabled}
          onClick={() => onChange(i)}
          className="rounded p-0.5 transition hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`size-7 ${i <= deger ? "fill-amber-400 text-amber-400" : "text-line hover:text-amber-300"}`}
          />
        </button>
      ))}
    </div>
  );
}
