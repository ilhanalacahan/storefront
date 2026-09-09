import { Lock, Mail, MapPin, Phone, RotateCcw, Truck, Zap } from "lucide-react";
import Link from "next/link";

import { BultenFormu } from "@/components/bulten-formu";
import { BELGE_ADLARI, BELGE_SIRASI } from "@/lib/sozlesmeler";

const SITE_ADI = process.env.NEXT_PUBLIC_SITE_NAME ?? "StoreFront";

/**
 * Alt bilgi — dört sütun + bülten + güven şeridi.
 *
 * Künye alanları (ünvan, adres, telefon) satıcı bilgisinden gelir ve TANIMSIZ
 * OLAN ÇİZİLMEZ: uydurma adres basmak, sözleşme sayfasında olduğu gibi burada
 * da yanlıştır (bkz. lib/satici.ts).
 */
export function Footer() {
  const unvan = (process.env.NEXT_PUBLIC_SATICI_UNVAN ?? "").trim();
  const adres = (process.env.NEXT_PUBLIC_SATICI_ADRES ?? "").trim();
  const telefon = (process.env.NEXT_PUBLIC_SATICI_TELEFON ?? "").trim();
  const eposta = (process.env.NEXT_PUBLIC_SATICI_EPOSTA ?? "").trim();

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      {/* GÜVEN ŞERİDİ — satın alma kararının önündeki dört soru */}
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { Icon: Truck, baslik: "Hızlı Kargo", alt: "Stoktan aynı gün çıkış" },
            { Icon: RotateCcw, baslik: "14 Gün İade", alt: "Koşulsuz cayma hakkı" },
            { Icon: Lock, baslik: "Güvenli Ödeme", alt: "3D Secure altyapısı" },
          ].map(({ Icon, baslik, alt }) => (
            <div key={baslik} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{baslik}</p>
                <p className="truncate text-xs text-soft">{alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-5">
        {/* Marka + künye */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Zap className="size-4" />
            </span>
            <span className="text-base font-bold">{SITE_ADI}</span>
          </div>
          <p className="max-w-sm text-sm text-soft">
            Fiyat ve stok doğrudan mağazanın ERP sisteminden gelir — vitrinde gördüğünüz
            her ürün gerçekten raftadır.
          </p>
          <ul className="space-y-1.5 text-sm text-soft">
            {unvan ? <li className="font-medium text-foreground">{unvan}</li> : null}
            {adres ? (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                {adres}
              </li>
            ) : null}
            {telefon ? (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`tel:${telefon.replace(/\s/g, "")}`} className="hover:text-foreground">
                  {telefon}
                </a>
              </li>
            ) : null}
            {eposta ? (
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`mailto:${eposta}`} className="hover:text-foreground">
                  {eposta}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <FooterSutun baslik="Mağaza">
          <FooterBaglanti href="/kategoriler">Kategoriler</FooterBaglanti>
          <FooterBaglanti href="/urunler">Tüm Ürünler</FooterBaglanti>
          <FooterBaglanti href="/koleksiyonlar">Koleksiyonlar</FooterBaglanti>
          <FooterBaglanti href="/urunler?sirala=yeni">Yeni Gelenler</FooterBaglanti>
          <FooterBaglanti href="/karsilastir">Karşılaştırma</FooterBaglanti>
        </FooterSutun>

        <FooterSutun baslik="Hesabım">
          <FooterBaglanti href="/hesap">Hesabım</FooterBaglanti>
          <FooterBaglanti href="/favoriler">Favorilerim</FooterBaglanti>
          <FooterBaglanti href="/sepet">Sepetim</FooterBaglanti>
          <FooterBaglanti href="/siparis-sorgula">Sipariş Sorgula</FooterBaglanti>
        </FooterSutun>

        <FooterSutun baslik="Yasal">
          {BELGE_SIRASI.map((k) => (
            <FooterBaglanti key={k} href={`/sozlesmeler/${k}`}>
              {BELGE_ADLARI[k]}
            </FooterBaglanti>
          ))}
        </FooterSutun>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <BultenFormu />
        </div>
      </div>

      <div className="border-t border-line py-4 text-center text-xs text-soft">
        © {new Date().getFullYear()} {unvan || SITE_ADI} · Fiyatlara KDV dahildir
      </div>
    </footer>
  );
}

function FooterSutun({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{baslik}</p>
      <ul className="space-y-1.5 text-sm text-soft">{children}</ul>
    </div>
  );
}

function FooterBaglanti({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
