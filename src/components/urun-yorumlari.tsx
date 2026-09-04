"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Yildizlar, YildizSecici } from "@/components/yildizlar";
import { yorumYaz, yorumlariGetir } from "@/lib/api/yorum";
import type { ProductReview, ReviewList } from "@/lib/api/types";
import { tarih } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

const SAYFA = 10;

/**
 * Ürün yorumları — puan özeti, onaylı yorum listesi ve (girişliyse) yazma
 * formu. Yorum ONAYDAN SONRA yayınlanır; yazan "onay bekliyor" görür.
 * Liste kişiye özel `mine` taşıdığı için proxy'den, önbelleksiz çekilir.
 */
export function UrunYorumlari({ productUid }: { productUid: string }) {
  const token = useAuthStore((s) => s.token);
  const [sayfa, setSayfa] = useState(0);
  const q = useQuery({
    queryKey: ["yorumlar", productUid, token ? "uye" : "misafir", sayfa],
    queryFn: () => yorumlariGetir(productUid, token || null, SAYFA, sayfa * SAYFA),
  });

  return (
    <section id="yorumlar" className="max-w-3xl space-y-5 scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <MessageSquare className="size-5 text-accent" /> Yorumlar
        {q.data ? <span className="text-base font-normal text-soft">({q.data.total})</span> : null}
      </h2>

      {q.isPending ? (
        <div className="h-24 animate-pulse rounded-2xl bg-line/40" />
      ) : q.isError ? (
        <p className="text-sm text-soft">Yorumlar şu an yüklenemiyor.</p>
      ) : (
        <>
          <Ozet liste={q.data} />
          <YorumFormu productUid={productUid} mine={q.data.mine} />
          {q.data.reviews.length === 0 ? (
            <p className="text-sm text-soft">Bu ürüne henüz yorum yazılmamış. İlk yorumu siz yazın.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {q.data.reviews.map((y) => (
                <YorumSatiri key={y.uid} yorum={y} />
              ))}
            </ul>
          )}
          {q.data.total > SAYFA ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <button
                type="button"
                disabled={sayfa === 0}
                onClick={() => setSayfa((s) => s - 1)}
                className="rounded-xl border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Önceki
              </button>
              <span className="text-soft">
                {sayfa + 1} / {Math.ceil(q.data.total / SAYFA)}
              </span>
              <button
                type="button"
                disabled={(sayfa + 1) * SAYFA >= q.data.total}
                onClick={() => setSayfa((s) => s + 1)}
                className="rounded-xl border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function Ozet({ liste }: { liste: ReviewList }) {
  const { summary } = liste;
  if (summary.count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-surface p-4">
      <div className="text-center">
        <p className="text-4xl font-bold">{summary.average.replace(".", ",")}</p>
        <Yildizlar puan={summary.average} boyut="md" />
        <p className="mt-1 text-xs text-soft">{summary.count} değerlendirme</p>
      </div>
      <ul className="flex-1 space-y-1 text-xs">
        {[5, 4, 3, 2, 1].map((yildiz) => {
          const n = summary.distribution[yildiz - 1];
          const oran = summary.count ? Math.round((n / summary.count) * 100) : 0;
          return (
            <li key={yildiz} className="flex items-center gap-2">
              <span className="w-6 text-right text-soft">{yildiz}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full bg-amber-400" style={{ width: `${oran}%` }} />
              </span>
              <span className="w-8 text-soft">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function YorumSatiri({ yorum }: { yorum: ProductReview }) {
  return (
    <li className="space-y-2 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Yildizlar puan={yorum.rating} />
        <span className="text-sm font-medium">{yorum.authorName}</span>
        {yorum.verified ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <BadgeCheck className="size-3.5" /> Doğrulanmış alışveriş
          </span>
        ) : null}
        <span className="ml-auto text-xs text-soft">{tarih(yorum.createdAt)}</span>
      </div>
      {yorum.title ? <p className="font-semibold">{yorum.title}</p> : null}
      <p className="whitespace-pre-line text-sm leading-relaxed text-soft">{yorum.body}</p>
      {yorum.reply ? (
        <div className="rounded-xl bg-background p-3 text-sm">
          <p className="mb-1 text-xs font-semibold text-accent">Mağaza yanıtı · {tarih(yorum.repliedAt)}</p>
          <p className="whitespace-pre-line text-soft">{yorum.reply}</p>
        </div>
      ) : null}
    </li>
  );
}

const DURUM_METNI: Record<number, string> = {
  0: "Yorumunuz onay bekliyor; onaylanınca burada yayınlanır.",
  1: "Yorumunuz yayında.",
  2: "Yorumunuz yayınlanmadı. Dilerseniz yeniden yazabilirsiniz.",
};

function YorumFormu({ productUid, mine }: { productUid: string; mine: ProductReview | null }) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [acik, setAcik] = useState(false);
  const [puan, setPuan] = useState(mine?.rating ?? 5);
  const [baslik, setBaslik] = useState(mine?.title ?? "");
  const [metin, setMetin] = useState(mine?.body ?? "");

  const yaz = useMutation({
    mutationFn: () => yorumYaz(productUid, { rating: puan, title: baslik, body: metin }, token),
    onSuccess: () => {
      toast.success("Yorumunuz alındı; onaylanınca yayınlanır.");
      setAcik(false);
      void qc.invalidateQueries({ queryKey: ["yorumlar", productUid] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Yorum kaydedilemedi."),
  });

  if (!token) {
    return (
      <p className="text-sm text-soft">
        Yorum yazmak için{" "}
        <Link href="/hesap" className="font-medium text-accent hover:underline">
          giriş yapın
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      {mine ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Yildizlar puan={mine.rating} />
          <span className="text-soft">{DURUM_METNI[mine.status]}</span>
        </div>
      ) : null}
      {!acik ? (
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          {mine ? "Yorumu düzenle" : "Yorum yaz"}
        </button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            yaz.mutate();
          }}
        >
          <YildizSecici deger={puan} onChange={setPuan} disabled={yaz.isPending} />
          <input
            value={baslik}
            maxLength={120}
            placeholder="Başlık (isteğe bağlı)"
            disabled={yaz.isPending}
            onChange={(e) => setBaslik(e.target.value)}
            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={metin}
            rows={4}
            maxLength={2000}
            required
            placeholder="Ürünle ilgili deneyiminiz"
            disabled={yaz.isPending}
            onChange={(e) => setMetin(e.target.value)}
            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={yaz.isPending || metin.trim().length < 3}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
            >
              {yaz.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Gönder
            </button>
            <button
              type="button"
              disabled={yaz.isPending}
              onClick={() => setAcik(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm"
            >
              Vazgeç
            </button>
          </div>
          <p className="text-xs text-soft">Yorumunuz mağaza onayından sonra, adınız kısaltılarak yayınlanır.</p>
        </form>
      )}
    </div>
  );
}
