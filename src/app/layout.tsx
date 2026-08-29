import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { BottomNav } from "@/components/bottom-nav";
import { CartDrawer } from "@/components/cart-drawer";
import { CerezBandi } from "@/components/cerez-bandi";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { SiteYapisalVerisi } from "@/components/json-ld";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

import { SITE_ADI, SITE_URL } from "@/lib/site";

const ACIKLAMA =
  "TicariCore ERP üzerinde çalışan headless e-ticaret vitrini. Elektronik ürünlerde güncel fiyat ve canlı stok.";

export const metadata: Metadata = {
  // metadataBase ŞART: canonical ve Open Graph görselleri göreli adres kabul
  // etmez; bu taban olmadan Next göreli değerleri sessizce atar.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_ADI} — Teknoloji Mağazası`,
    template: `%s | ${SITE_ADI}`,
  },
  description: ACIKLAMA,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_ADI,
    locale: "tr_TR",
    url: SITE_URL,
    title: `${SITE_ADI} — Teknoloji Mağazası`,
    description: ACIKLAMA,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteYapisalVerisi />
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4">{children}</main>
          <Footer />
          <CartDrawer />
          <BottomNav />
          <CerezBandi />
        </Providers>
      </body>
    </html>
  );
}
