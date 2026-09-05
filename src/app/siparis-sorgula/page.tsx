import type { Metadata } from "next";

import { SiparisSorgulama } from "./sorgu-icerik";

/**
 * /siparis-sorgula — hesapsız sipariş sorgulama: belge no + siparişteki
 * e-posta. Kargo takibi için hesap açmak şart değil. Arama motoruna kapalı.
 */
export const metadata: Metadata = {
  title: "Sipariş Sorgula",
  robots: { index: false, follow: false },
};

export default function SiparisSorgulaSayfasi() {
  return <SiparisSorgulama />;
}
