import { apiIstemci } from "./api/client";

/**
 * HATA BİLDİRİMİ — vitrinde patlayan hatayı TicariCore'un hata defterine yazar.
 *
 * NEDEN: bugüne kadar vitrin hataları yalnız müşterinin konsolunda kalıyordu;
 * mağaza sahibinin "sitede bir şey bozulmuş" bilgisine ulaşmasının tek yolu
 * müşterinin telefon etmesiydi. Backend'de zaten bir hata defteri ve paneli
 * var (error_log, origin='frontend') — vitrin de oraya yazar.
 *
 * SESSİZ BAŞARISIZLIK BİLİNÇLİDİR: bildirim çalışmazsa müşteriye İKİNCİ bir
 * hata gösterilmez. Asıl hata zaten ekranda; üstüne "hata bildirilemedi"
 * demek, kullanıcının çözemeyeceği bir gürültü olurdu.
 */
export function hataBildir(hata: unknown, ek?: { digest?: string }): void {
  const e = hata instanceof Error ? hata : new Error(String(hata));
  void apiIstemci("/errors", {
    metot: "POST",
    govde: {
      exceptionType: e.name || "Error",
      message: e.message || "bilinmeyen hata",
      // digest: Next'in sunucu hatalarına verdiği kimlik. Sunucu tarafındaki
      // gerçek yığın izi güvenlik gereği istemciye hiç gelmez; bu kimlik,
      // ekrandaki hatayı sunucu günlüğündeki kayda bağlayan tek iptir.
      stackTrace: [ek?.digest ? `digest: ${ek.digest}` : "", e.stack ?? ""]
        .filter(Boolean)
        .join("\n"),
      url: typeof window !== "undefined" ? window.location.pathname : "",
    },
  }).catch(() => {
    /* bildirim de başarısızsa sessiz kal — bkz. yukarıdaki not */
  });
}
