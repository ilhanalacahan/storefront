"use client";

import { CheckCircle2, KeyRound, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { sifreSifirla, sifreSifirlamaIste } from "@/lib/api/account";

/**
 * Parola sıfırlama — TEK sayfa, İKİ hâl:
 *
 *   adreste `kod` YOK  → "parolamı unuttum" formu (e-posta iste)
 *   adreste `kod` VAR  → yeni parola formu
 *
 * Ayrı iki sayfa yapmamanın sebebi: müşteri e-postadaki bağlantıya
 * tıkladığında zaten bu adrese düşer; ikinci bir yol, aynı akışın iki ayrı
 * yerde bakımı demekti.
 *
 * "E-posta kayıtlı değil" DENMEZ: sunucu hesap varlığını sızdırmadığı için
 * arayüz de sızdırmaz — aksi hâlde sunucudaki özen boşa giderdi.
 */
export function SifreSifirlama() {
  const kod = useSearchParams().get("kod") ?? "";
  return kod ? <YeniParola kod={kod} /> : <SifremiUnuttum />;
}

const girdiSinifi =
  "h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

function SifremiUnuttum() {
  const [email, setEmail] = useState("");
  const [islemde, setIslemde] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIslemde(true);
    try {
      await sifreSifirlamaIste(email);
      setGonderildi(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İstek gönderilemedi.");
    } finally {
      setIslemde(false);
    }
  };

  if (gonderildi) {
    return (
      <Kart ikon={<MailCheck className="size-8" />} baslik="E-postanızı kontrol edin">
        <p className="text-sm text-soft">
          <strong>{email}</strong> adresi kayıtlıysa parola sıfırlama bağlantısı
          gönderildi. Bağlantı 1 saat geçerlidir.
        </p>
        <Link href="/hesap" className="text-sm font-medium text-accent hover:underline">
          Giriş sayfasına dön
        </Link>
      </Kart>
    );
  }

  return (
    <Kart ikon={<KeyRound className="size-8" />} baslik="Parolamı Unuttum">
      <p className="text-sm text-soft">
        Hesabınızın e-posta adresini yazın; size bir sıfırlama bağlantısı gönderelim.
      </p>
      <form onSubmit={gonder} className="w-full space-y-3">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          className={girdiSinifi}
          aria-label="E-posta adresiniz"
        />
        <button
          type="submit"
          disabled={islemde}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
        >
          {islemde ? <Loader2 className="size-4 animate-spin" /> : null}
          Sıfırlama Bağlantısı Gönder
        </button>
      </form>
      <Link href="/hesap" className="text-sm text-soft hover:text-foreground">
        Vazgeç, giriş sayfasına dön
      </Link>
    </Kart>
  );
}

function YeniParola({ kod }: { kod: string }) {
  const [parola, setParola] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [islemde, setIslemde] = useState(false);
  const [bitti, setBitti] = useState(false);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    // Eşleşme denetimi İSTEMCİDE: sunucuya iki kez aynı parolayı göndermenin
    // anlamı yok, bu bir yazım hatası kalkanıdır — parola kuralını (uzunluk)
    // sunucu dayatır.
    if (parola !== tekrar) {
      toast.error("Parolalar eşleşmiyor.");
      return;
    }
    setIslemde(true);
    try {
      await sifreSifirla(kod, parola);
      setBitti(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Parola değiştirilemedi.");
    } finally {
      setIslemde(false);
    }
  };

  if (bitti) {
    return (
      <Kart ikon={<CheckCircle2 className="size-8" />} baslik="Parolanız değiştirildi">
        <p className="text-sm text-soft">Yeni parolanızla giriş yapabilirsiniz.</p>
        <Link
          href="/hesap"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          Giriş Yap
        </Link>
      </Kart>
    );
  }

  return (
    <Kart ikon={<KeyRound className="size-8" />} baslik="Yeni Parola Belirleyin">
      <form onSubmit={kaydet} className="w-full space-y-3">
        <input
          required
          type="password"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          placeholder="Yeni parola (en az 8 karakter)"
          className={girdiSinifi}
          aria-label="Yeni parola"
        />
        <input
          required
          type="password"
          value={tekrar}
          onChange={(e) => setTekrar(e.target.value)}
          placeholder="Yeni parola (tekrar)"
          className={girdiSinifi}
          aria-label="Yeni parola tekrar"
        />
        <button
          type="submit"
          disabled={islemde}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
        >
          {islemde ? <Loader2 className="size-4 animate-spin" /> : null}
          Parolayı Değiştir
        </button>
      </form>
    </Kart>
  );
}

function Kart({
  ikon,
  baslik,
  children,
}: {
  ikon: React.ReactNode;
  baslik: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        {ikon}
      </span>
      <h1 className="text-xl font-bold">{baslik}</h1>
      {children}
    </div>
  );
}
