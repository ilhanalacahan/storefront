"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, HelpCircle, Loader2, MessageSquareReply } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { sorulariGetir, soruSor, type UrunSorusu } from "@/lib/api/soru";
import { tarih } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

/**
 * ÜRÜN SORU-CEVAP — PDP'nin "Soru-Cevap" sekmesi.
 *
 * İSTEMCİDE ÇEKİLİR: liste kişiye özeldir (müşteri kendi onay bekleyen
 * sorusunu da görür) ve soru sorulduğu anda tazelenmelidir — ISR'lı sayfa
 * iskeletine girmez. Yorumlarla aynı desen.
 *
 * YAZILAN SORU HEMEN GÖRÜNMEZ: onaya düşer. Bunu açıkça söylemek şart —
 * söylemeyen bir arayüzde müşteri sorusunun kaybolduğunu sanıp tekrar yazar.
 */
export function UrunSorulari({ productUid }: { productUid: string }) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [metin, setMetin] = useState("");

  const anahtar = ["sorular", productUid, token ? "uye" : "misafir"] as const;
  const { data, isPending } = useQuery({
    queryKey: anahtar,
    queryFn: () => sorulariGetir(productUid, token),
    staleTime: 60_000,
  });

  const sor = useMutation({
    mutationFn: (body: string) => soruSor(productUid, body, token),
    onSuccess: () => {
      setMetin("");
      toast.success("Sorunuz alındı — mağaza yanıtladıktan sonra yayınlanacak.");
      void qc.invalidateQueries({ queryKey: anahtar });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Soru gönderilemedi."),
  });

  const sorular = data?.questions ?? [];
  // Kendi sorularından YAYINDA OLANLAR listede zaten var; burada yalnız
  // bekleyen/reddedilenler gösterilir ki liste iki kez aynı soruyu basmasın.
  const kendiBekleyen = (data?.mine ?? []).filter((q) => q.status !== 1);

  return (
    <div className="space-y-6">
      {/* Soru sorma kutusu */}
      <div className="rounded-xl border border-line bg-background p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <HelpCircle className="size-4 text-accent" aria-hidden />
          Bu ürün hakkında soru sorun
        </p>
        {token ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = metin.trim();
              if (t.length < 5) {
                toast.error("Soru en az 5 karakter olmalı.");
                return;
              }
              sor.mutate(t);
            }}
            className="space-y-2"
          >
            <textarea
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Örnek: Bu ürün hangi modellerle uyumlu?"
              className="w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-soft">
                Sorunuz mağaza yanıtladıktan sonra bu sayfada yayınlanır.
              </p>
              <button
                type="submit"
                disabled={sor.isPending || metin.trim().length < 5}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
              >
                {sor.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Soruyu Gönder
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-soft">
            Soru sormak için{" "}
            <Link href="/hesap" className="font-medium text-accent hover:underline">
              giriş yapın
            </Link>
            .
          </p>
        )}
      </div>

      {/* Kendi bekleyen sorularım */}
      {kendiBekleyen.length ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Sorularınız</p>
          {kendiBekleyen.map((q) => (
            <div key={q.uid} className="rounded-xl border border-dashed border-line p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-soft">
                <Clock className="size-3.5" aria-hidden />
                {q.status === 2 ? "Yayınlanmadı" : "Onay bekliyor"} · {tarih(q.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-line">{q.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Yayındaki sorular */}
      {isPending ? (
        <div className="flex items-center gap-2 py-6 text-sm text-soft">
          <Loader2 className="size-4 animate-spin" /> Sorular yükleniyor…
        </div>
      ) : sorular.length === 0 ? (
        <p className="text-sm text-soft">
          Bu ürün için henüz yayınlanmış soru yok. İlk soruyu siz sorabilirsiniz.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold">{data?.total ?? sorular.length} soru</p>
          <ul className="space-y-4">
            {sorular.map((q) => (
              <SoruKarti key={q.uid} soru={q} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SoruKarti({ soru }: { soru: UrunSorusu }) {
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{soru.authorName}</p>
        <p className="shrink-0 text-xs text-soft">{tarih(soru.createdAt)}</p>
      </div>
      <p className="mt-1 whitespace-pre-line text-sm">{soru.body}</p>
      {soru.answer ? (
        <div className="mt-3 rounded-lg border-l-2 border-accent bg-background p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <MessageSquareReply className="size-3.5" aria-hidden />
            Mağaza yanıtı
            {soru.answeredAt ? (
              <span className="font-normal text-soft">· {tarih(soru.answeredAt)}</span>
            ) : null}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm">{soru.answer}</p>
        </div>
      ) : null}
    </li>
  );
}
