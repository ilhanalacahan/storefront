"use client";

import { Check, Loader2, Truck } from "lucide-react";

import { useCart, useKargoSec, useKargoSecenekleri } from "@/hooks/use-cart";
import { fiyat } from "@/lib/format";

/**
 * TESLİMAT SEÇİMİ — checkout'un kargo adımı.
 *
 * Ücret SUNUCUDA çözülür (G5/G2 çizgisi): buradaki liste yalnız sunucunun
 * verdiği tutarları gösterir, eşiği kendi hesaplamaz. "150 TL üstü ücretsiz"
 * kuralını istemcide tekrarlamak, kampanya sepeti eşiğin altına düşürdüğünde
 * ekranla tahsil edilen tutarın ayrışması demekti.
 *
 * Kanalda tanımlı yöntem yoksa bileşen HİÇBİR ŞEY çizmez: teslimat kavramı
 * olmayan kurulumda (yalnız hizmet satan kanal) boş bir kutu göstermek,
 * müşteriye eksik bir adım varmış izlenimi verirdi.
 */
export function TeslimatSecimi() {
  const { data: sepet } = useCart();
  const { data: secenekler, isPending } = useKargoSecenekleri();
  const sec = useKargoSec();

  if (isPending) {
    return (
      <section className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-5 text-sm text-soft">
        <Loader2 className="size-4 animate-spin" /> Teslimat seçenekleri yükleniyor…
      </section>
    );
  }
  if (!secenekler || secenekler.length === 0) return null;

  // SEÇİM SEPETTEN OKUNUR, seçenek listesinden değil (V5): liste
  // önbelleklenebilir ve seçim değiştiğinde bayat kalır — sepet ise her
  // mutasyonda güncel hâliyle cache'e yazılır.
  const secili = sepet?.shippingMethodCode ?? "";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Truck className="size-4.5 text-accent" /> Teslimat Seçeneği
      </h2>
      <ul className="space-y-2">
        {secenekler.map((s) => {
          const isaretli = s.code === secili;
          return (
            <li key={s.code}>
              <button
                type="button"
                onClick={() => sec.mutate(s.code)}
                disabled={sec.isPending}
                aria-pressed={isaretli}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50 ${
                  isaretli ? "border-accent bg-accent/5" : "border-line hover:border-soft"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      isaretli ? "border-accent bg-accent text-accent-foreground" : "border-line"
                    }`}
                  >
                    {isaretli ? <Check className="size-3.5" /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{s.name}</span>
                    {s.freeOverSubtotal && !s.free ? (
                      <span className="block text-xs text-soft">
                        {fiyat(s.freeOverSubtotal, sepet?.curCode ?? 1)} üstü alışverişte ücretsiz
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {s.free || Number(s.price) === 0 ? (
                    <span className="text-success">
                      Ücretsiz
                      {s.free && Number(s.listPrice) > 0 ? (
                        <span className="ml-1.5 font-normal text-soft line-through">
                          {fiyat(s.listPrice, sepet?.curCode ?? 1)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    fiyat(s.price, sepet?.curCode ?? 1)
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!secili ? (
        <p className="mt-3 text-xs text-soft">
          Ödemeye geçmek için bir teslimat seçeneği seçin.
        </p>
      ) : null}
    </section>
  );
}
