"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { epostaDogrula } from "@/lib/api/account";

/**
 * Doğrulama, sayfa açılır açılmaz çalışır — ayrıca bir "doğrula" düğmesi
 * yoktur: müşteri zaten e-postasındaki bağlantıya tıklayarak niyetini
 * belirtmiştir, ikinci bir tık istemek boş bir adım olurdu.
 *
 * Jeton TEK KULLANIMLIKTIR; React'in geliştirme kipinde efektleri iki kez
 * çalıştırması yüzünden ikinci çağrının "geçersiz" demesini önlemek için
 * doğrulama bir sorgu olarak modellendi (aynı anahtar tek kez koşar).
 */
export function EpostaDogrulama() {
  const kod = useSearchParams().get("kod") ?? "";

  const { isPending, isError, error } = useQuery({
    queryKey: ["eposta-dogrula", kod],
    queryFn: async () => {
      await epostaDogrula(kod);
      return true;
    },
    enabled: !!kod,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!kod) {
    return (
      <Kart ton="hata" ikon={<XCircle className="size-9" />} baslik="Doğrulama kodu yok">
        Bu sayfaya e-postanızdaki bağlantıdan gelmelisiniz.
      </Kart>
    );
  }
  if (isPending) {
    return (
      <Kart ton="notr" ikon={<Loader2 className="size-9 animate-spin" />} baslik="Doğrulanıyor…">
        E-posta adresiniz doğrulanıyor.
      </Kart>
    );
  }
  if (isError) {
    return (
      <Kart ton="hata" ikon={<XCircle className="size-9" />} baslik="Doğrulanamadı">
        {error instanceof Error
          ? error.message
          : "Bağlantı geçersiz ya da süresi dolmuş. Hesabınızdan yeni bir doğrulama e-postası isteyebilirsiniz."}
      </Kart>
    );
  }
  return (
    <Kart ton="basari" ikon={<BadgeCheck className="size-9" />} baslik="E-postanız doğrulandı">
      Teşekkürler! Hesabınız artık doğrulanmış e-posta adresiyle ilişkili.
    </Kart>
  );
}

const TONLAR = {
  basari: "bg-success/10 text-success",
  hata: "bg-danger/10 text-danger",
  notr: "bg-accent/10 text-accent",
} as const;

function Kart({
  ton,
  ikon,
  baslik,
  children,
}: {
  ton: keyof typeof TONLAR;
  ikon: React.ReactNode;
  baslik: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-20 text-center">
      <span className={`flex size-16 items-center justify-center rounded-full ${TONLAR[ton]}`}>
        {ikon}
      </span>
      <h1 className="text-xl font-bold">{baslik}</h1>
      <p className="text-sm text-soft">{children}</p>
      <Link
        href="/hesap"
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
      >
        Hesabıma Git
      </Link>
    </div>
  );
}
