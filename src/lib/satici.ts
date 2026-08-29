/**
 * SATICI KÜNYESİ — yasal metinlerin değişkenleri.
 *
 * Mesafeli Sözleşmeler Yönetmeliği satıcının ünvanını, adresini, MERSİS/vergi
 * bilgisini ve iletişim kanallarını sözleşmede ZORUNLU kılar. Bu bilgiler
 * mağazadan mağazaya değiştiği için metne gömülmez; ortam değişkeninden gelir.
 *
 * NEXT_PUBLIC_ ÖNEKİ BİLİNÇLİ: bu alanların tamamı zaten sözleşme sayfasında
 * kamuya açık yayımlanır — gizli değildir, istemci paketine girmesi sakınca
 * yaratmaz.
 *
 * EKSİK YAPILANDIRMA GİZLENMEZ: alan boşsa sayfa "[eksik: …]" yazar ve üstte
 * uyarı gösterir. Sessizce boş bırakmak, yürürlükte olduğu sanılan ama satıcıyı
 * tanımlamayan bir sözleşme üretirdi.
 */

export interface Satici {
  unvan: string;
  adres: string;
  telefon: string;
  eposta: string;
  mersis: string;
  vergi: string;
  /** Şikâyet/iade adresi ayrıysa; boşsa `adres` kullanılır. */
  iadeAdresi: string;
}

function alan(deger: string | undefined, ad: string): string {
  const v = (deger ?? "").trim();
  return v || `[eksik: ${ad}]`;
}

export function saticiBilgisi(): Satici {
  const adres = alan(process.env.NEXT_PUBLIC_SATICI_ADRES, "satıcı adresi");
  return {
    unvan: alan(process.env.NEXT_PUBLIC_SATICI_UNVAN, "satıcı ünvanı"),
    adres,
    telefon: alan(process.env.NEXT_PUBLIC_SATICI_TELEFON, "telefon"),
    eposta: alan(process.env.NEXT_PUBLIC_SATICI_EPOSTA, "e-posta"),
    mersis: alan(process.env.NEXT_PUBLIC_SATICI_MERSIS, "MERSİS no"),
    vergi: alan(process.env.NEXT_PUBLIC_SATICI_VERGI, "vergi dairesi / no"),
    iadeAdresi: (process.env.NEXT_PUBLIC_SATICI_IADE_ADRESI ?? "").trim() || adres,
  };
}

/** Künyede doldurulmamış alan var mı — sayfa üstündeki uyarıyı tetikler. */
export function saticiEksikMi(s: Satici): boolean {
  return Object.values(s).some((v) => v.startsWith("[eksik:"));
}
