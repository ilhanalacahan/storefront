"use client";

import { useEffect } from "react";

import { hataBildir } from "@/lib/hata-bildir";

/**
 * Kök hata sınırı — layout'un KENDİSİ patladığında devreye girer.
 *
 * Kendi <html> ve <body>'sini basmak zorundadır: bu noktada kök layout
 * çizilmemiştir, yani tema değişkenleri ve global CSS de yüktür. Bu yüzden
 * stiller satır içidir — dış bir stil dosyasına güvenmek, hata ekranının da
 * boş çıkması demek olurdu.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    hataBildir(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0b0b0c",
          color: "#f4f4f5",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            Site şu anda açılamıyor
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, lineHeight: 1.6 }}>
            Beklenmedik bir hata oluştu ve sorun bize iletildi. Lütfen birkaç
            dakika sonra tekrar deneyin.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.75rem" }}>
              Hata kodu: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "inherit",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
