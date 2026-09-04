"use client";

import { Heart, Loader2 } from "lucide-react";

import { useFavoriDegistir, useFavoriUidleri } from "@/hooks/use-favoriler";

/**
 * Kalp düğmesi — kart köşesinde (küçük, yüzen) ya da satın alma kutusunda
 * (büyük, metinli). Durum favori uid kümesinden okunur; girişsizken boş kalp.
 */
export function FavoriDugmesi({
  productUid,
  gorunum = "kart",
}: {
  productUid: string;
  gorunum?: "kart" | "buton";
}) {
  const uids = useFavoriUidleri();
  const { degistir, isPending } = useFavoriDegistir();
  const favori = (uids.data ?? []).includes(productUid);
  const etiket = favori ? "Favorilerden çıkar" : "Favorilere ekle";

  if (gorunum === "buton") {
    return (
      <button
        type="button"
        aria-label={etiket}
        aria-pressed={favori}
        disabled={isPending}
        onClick={() => degistir(productUid, !favori)}
        className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
          favori ? "border-danger/40 text-danger" : "border-line text-soft hover:border-soft hover:text-foreground"
        }`}
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Heart className={`size-5 ${favori ? "fill-current" : ""}`} />
        )}
        <span className="hidden sm:inline">{favori ? "Favoride" : "Favori"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={etiket}
      aria-pressed={favori}
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        degistir(productUid, !favori);
      }}
      className={`absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110 ${
        favori ? "text-danger" : "text-soft"
      }`}
    >
      <Heart className={`size-4 ${favori ? "fill-current" : ""}`} />
    </button>
  );
}
