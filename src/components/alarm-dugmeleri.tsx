"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing, Loader2, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ALARM_TURU, alarmKur, alarmSil, alarmlariGetir } from "@/lib/api/alarm";
import { useAuthStore } from "@/store/auth-store";

/**
 * ALARM DÜĞMELERİ — "Stoğa gelince haber ver" / "Fiyat düşünce haber ver".
 *
 * Türk pazarındaki ticari vitrinlerin standart iki düğmesi (emsal: Ticimax
 * "Fiyat Düşünce Haber Ver"). Hangisinin çizileceği ÜRÜNÜN DURUMUNA bağlıdır:
 * stokta olan üründe "gelince haber ver" anlamsızdır, tükenmiş üründe fiyat
 * alarmı ise müşteriyi alamayacağı bir şey için beklemeye alır.
 *
 * DURUM SUNUCUDAN OKUNUR: alarm listesi hesabındır ve tek kaynaktır; düğmenin
 * "kurulu" hâli localStorage'dan değil o listeden gelir — iki cihazda iki
 * farklı durum görünmesin.
 *
 * Girişsiz müşteri düğmeye basınca hesap sayfasına taşınır: alarm bir e-posta
 * taahhüdüdür, kime gönderileceğini bilmeden kurulamaz.
 */
export function AlarmDugmeleri({
  productUid,
  stokta,
  siparisleUretilen,
}: {
  productUid: string;
  stokta: boolean;
  /** Siparişe göre üretilen üründe stok alarmı anlamsızdır (G49). */
  siparisleUretilen: boolean;
}) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["alarmlar"],
    queryFn: () => alarmlariGetir(token),
    enabled: !!token,
    staleTime: 60_000,
  });
  const alarmlar = data ?? [];
  const kurulu = (kind: number) =>
    alarmlar.some((a) => a.productUid === productUid && a.kind === kind && !a.notifiedAt);

  const degistir = useMutation({
    mutationFn: async ({ kind, kur }: { kind: number; kur: boolean }) => {
      if (kur) await alarmKur(productUid, kind, token);
      else await alarmSil(productUid, kind, token);
      return { kind, kur };
    },
    onSuccess: ({ kur }) => {
      void qc.invalidateQueries({ queryKey: ["alarmlar"] });
      toast.success(kur ? "Haber verilecek — e-postanızı kontrol edin." : "Alarm kaldırıldı.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Alarm kurulamadı."),
  });

  const bas = (kind: number) => {
    if (!token) {
      toast.info("Haber verebilmemiz için giriş yapın.");
      router.push("/hesap");
      return;
    }
    degistir.mutate({ kind, kur: !kurulu(kind) });
  };

  const stokAlarmi = !stokta && !siparisleUretilen;
  const fiyatAlarmi = stokta || siparisleUretilen;
  if (!stokAlarmi && !fiyatAlarmi) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stokAlarmi ? (
        <Dugme
          aktif={kurulu(ALARM_TURU.Stok)}
          bekliyor={degistir.isPending}
          onTikla={() => bas(ALARM_TURU.Stok)}
          Icon={BellRing}
          etiket="Stoğa gelince haber ver"
          aktifEtiket="Stok alarmı kurulu"
        />
      ) : null}
      {fiyatAlarmi ? (
        <Dugme
          aktif={kurulu(ALARM_TURU.Fiyat)}
          bekliyor={degistir.isPending}
          onTikla={() => bas(ALARM_TURU.Fiyat)}
          Icon={TrendingDown}
          etiket="Fiyat düşünce haber ver"
          aktifEtiket="Fiyat alarmı kurulu"
        />
      ) : null}
    </div>
  );
}

function Dugme({
  aktif,
  bekliyor,
  onTikla,
  Icon,
  etiket,
  aktifEtiket,
}: {
  aktif: boolean;
  bekliyor: boolean;
  onTikla: () => void;
  Icon: typeof BellRing;
  etiket: string;
  aktifEtiket: string;
}) {
  return (
    <button
      type="button"
      onClick={onTikla}
      disabled={bekliyor}
      aria-pressed={aktif}
      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition disabled:opacity-50 ${
        aktif
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-line text-soft hover:border-soft hover:text-foreground"
      }`}
    >
      {bekliyor ? (
        <Loader2 className="size-4 animate-spin" />
      ) : aktif ? (
        <BellOff className="size-4" />
      ) : (
        <Icon className="size-4" />
      )}
      {aktif ? aktifEtiket : etiket}
    </button>
  );
}
