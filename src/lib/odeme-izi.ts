"use client";

/**
 * ÖDEME İZİ — checkout'un tarayıcıda bıraktığı kırıntılar.
 *
 * NEDEN GEREKLİ: gerçek 3D akışında müşteri bankanın sayfasına GİDER. Geri
 * döndüğünde uygulama sıfırdan boot olur — React durumu (hangi adım, hangi
 * oturum), hatta sepet uid'i bile artık elimizde değildir. Dönüş sayfasının
 * "bu hangi ödemeydi?" sorusunu cevaplayabilmesi için oturum kimliğinin sayfa
 * ömrünü aşan bir yerde durması gerekir.
 *
 * ÜÇ ANAHTAR:
 *   tsf-odeme-{cartUid}         clientUid — idempotency anahtarı (V3)
 *   tsf-odeme-oturum-{cartUid}  o sepet için açılmış ödeme oturumunun uid'i
 *   tsf-odeme-son               en son açılan oturum
 *
 * Sonuncusu son çaredir: sipariş doğduğunda sepet uid'i temizlenir, yani
 * dönüş sayfası sepetten oturuma ulaşamaz. Sağlayıcı dönüş adresine kendi
 * parametresini eklemiyorsa oturumu ancak bu anahtar bulur.
 *
 * Tarayıcı deposu her yerde çalışmaz (gizli sekme, kapatılmış site verisi);
 * bu yüzden her okuma/yazma sessizce başarısız olabilir ve çağıran boş
 * değerle doğru davranmak zorundadır.
 */

const ONEK = "tsf-odeme";
const SON = `${ONEK}-son`;

function oku(anahtar: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(anahtar) ?? "";
  } catch {
    return "";
  }
}

function yaz(anahtar: string, deger: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(anahtar, deger);
  } catch {
    /* depo yok — akış devam eder, yalnız kurtarma yeteneği kaybolur */
  }
}

function sil(anahtar: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(anahtar);
  } catch {
    /* yok sayılır */
  }
}

/**
 * clientUid — ödeme başlatmanın idempotency anahtarı (V3).
 * Sepet başına ÜRETİLİR ve saklanır: ağ koptuğunda aynı anahtarla tekrar
 * çağırmak ikinci bir oturum (ve ikinci bir tahsilat) açmaz.
 */
export function clientUidAl(cartUid: string): string {
  const anahtar = `${ONEK}-${cartUid}`;
  const mevcut = oku(anahtar);
  if (mevcut) return mevcut;
  const uid = crypto.randomUUID();
  yaz(anahtar, uid);
  return uid;
}

/** Açılan ödeme oturumunu ize yazar — dönüş sayfası buradan bulur. */
export function oturumUidYaz(cartUid: string, oturumUID: string): void {
  if (!oturumUID) return;
  if (cartUid) yaz(`${ONEK}-oturum-${cartUid}`, oturumUID);
  yaz(SON, oturumUID);
}

/** Sepete bağlı ödeme oturumu (checkout sayfasının kaldığı yerden devamı). */
export function oturumUidOku(cartUid: string): string {
  return cartUid ? oku(`${ONEK}-oturum-${cartUid}`) : "";
}

/** Son açılan oturum — sepet uid'i elde yokken dönüş sayfasının son çaresi. */
export function sonOturumUid(): string {
  return oku(SON);
}

/**
 * İzi siler. Ödeme tamamlandığında ya da iptal edildiğinde çağrılır:
 * bayat bir clientUid, bir sonraki alışverişte "bu ödeme isteği zaten
 * işlendi" hatası üretir.
 */
export function odemeIziniSil(cartUid: string): void {
  if (cartUid) {
    sil(`${ONEK}-${cartUid}`);
    sil(`${ONEK}-oturum-${cartUid}`);
  }
  sil(SON);
}
