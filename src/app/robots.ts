import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — neyin taranacağı.
 *
 * KİŞİYE ÖZEL YOLLAR KAPALI: sepet, ödeme, hesap ve jeton sayfaları hem
 * arama sonucunda işe yaramaz hem de tarayıcıya boşuna yük bindirir. /api
 * proxy'si de kapalıdır; JSON yanıtlarının dizine girmesinin kimseye faydası
 * yok.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/sepet", "/odeme", "/hesap", "/sifre-sifirla", "/eposta-dogrula"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
