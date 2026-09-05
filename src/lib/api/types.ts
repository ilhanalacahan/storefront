/**
 * TicariCore storefront API tipleri.
 *
 * Bu tipler backend'in GraphQL şemasıyla BİREBİRDİR (TicariCore/handler/
 * storefront*.go, odeme.go). Sözleşmenin iki önemli kuralı:
 *
 *  - PARASAL ALANLAR STRING taşınır ("1249.90") — kayan nokta yuvarlaması
 *    vitrin ile sepet arasında kuruş oynatmasın diye. Asla parseFloat ile
 *    hesap yapmayın; yalnız GÖSTERİM için biçimleyin (lib/format.ts).
 *  - "Yok" değeri null değil boş string ("") ile bildirilir.
 */

/** Para birimi kodları (TicariCore constant/cur_code.go). */
export const CUR = { TRY: 1, USD: 2, EUR: 3 } as const;

// ---------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------

export interface StorefrontProduct {
  uid: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  handle: string;
  imageUrl: string;
  /** Vitrin SEO meta'sı ('' = yok; sayfa ad/alt başlıktan türetir). */
  metaTitle: string;
  metaDescription: string;
  /** KDV DAHİL vitrin fiyatı (etiket fiyatı bağlayıcıdır). */
  price: string;
  /** Üstü çizili fiyat ('' = indirim yok). */
  compareAtPrice: string;
  curCode: number;
  vatRate: string;
  /** Kimlik/özellik alanları — ilan ezmesi > ana kart ('' = yok). */
  brandName: string;
  modelName: string;
  unit: string;
  subCode: string;
  mfrCode: string;
  barcode: string;
  inStock: boolean;
  /** Satılabilir miktar (fiziksel − rezerve − ilan tamponu). */
  available: string;
  /** Siparişe göre üretim (G49): stok sınırına takılmaz, termin gösterilir. */
  madeToOrder: boolean;
  /** Üretim termini (gün) — "X günde hazırlanır". */
  leadDays: number;
  /** İlan satırı yok; kanalın yayın politikasından görünüyor. */
  virtual: boolean;
  /** Puan özeti — onaylı yorumlardan ('' / 0 = puan yok). Listede de dolu. */
  ratingAvg: string;
  ratingCount: number;
  /** Galeri (ana görsel başta). YALNIZ detay sorgusunda dolu; listede []. */
  images: string[];
  /** Aynı galeri, alt metniyle — erişilebilirlik ve görsel arama bunu okur. */
  gallery: ProductImageItem[];

  /**
   * Ürünün bağlı olduğu aktif kategoriler, EN DERİN ÖNCE — kırıntı yolu
   * ilkini kullanır. YALNIZ detayda dolu; listede [].
   */
  categories: ProductCategoryLink[];
  /**
   * Kategori şablonuyla etiketlenmiş nitelikler ("Genişlik (mm)": "27").
   * Değer HER ZAMAN METİNDİR; `type` nasıl gösterileceğini söyler.
   * YALNIZ detayda dolu; listede [].
   */
  attributes: ProductAttribute[];

  /** Varyant ailesi — YALNIZ detay sorgusunda dolu (galeriyle aynı gerekçe). */
  isVariantMaster: boolean;
  /** Varyant çocuğunun atası ('' = varyant ailesinde değil). */
  parentUid: string;
  /** Bu kartın eksen değerleri ("Renk: Kırmızı"); atada boş. */
  options: ProductOption[];
  /** Ailenin seçilebilir üyeleri (ata hariç). */
  variants: ProductVariant[];

  /**
   * BELGE PARAMETRELERİ — kategori şablonu + kartın ezmeleri (şerit boyu,
   * kaynak ücreti). PDP girdi alanlarını buradan kurar; bileşik fiyatı ve
   * taban miktarı `/products/{uid}/compose` verir — istemci ÇARPMAZ (G2/G5).
   * YALNIZ detayda dolu; listede [].
   */
  parameters: ProductParameter[];
}

/** Parametrenin belgeye etkisi (TicariCore constant.ParamEffect). */
export const PARAMETRE_ETKI = {
  /** Yalnız bilgi — hesaba girmez, satırda görünür. */
  Bilgi: 0,
  /** Taban miktarı çarpar (mm → m katsayısıyla): stok ve fiyat buna göre. */
  MiktarCarpani: 1,
  /** Fiyata sabit ekler (kaynak ücreti); KDV dahil belgede brütleşir. */
  FiyatSabiti: 2,
  /** Fiyat çözücüye dik eksen — sunucuda uygulanır. */
  FiyatCarpani: 3,
} as const;

/** Kategori şablonundaki tek parametre tanımı — kartın ezmeleri bindirilmiş. */
export interface ProductParameter {
  key: string;
  label: string;
  effect: number;
  unit: string;
  /** effect=1: taban birime çevirme katsayısı (mm→m 0,001). */
  coefficient: number;
  min: number | null;
  max: number | null;
  default: number | null;
}

/** /compose girdisi — quantity adet (ölçü, para değil). */
export interface ProductComposeInput {
  quantity: string;
  params: { key: string; value: number }[];
}

/** Bileşimde tek parametrenin katkısı — PDP kırılım satırı. */
export interface ProductComposeContribution {
  key: string;
  label: string;
  effect: number;
  unit: string;
  numValue: number;
  coefficient: number;
  /** effect=1: taban birime çevrilmiş ölçü; effect=2: fiyata eklenen KDV dahil tutar (string). */
  contribution: string;
}

/** /compose yanıtı — paralar string, KDV DAHİL; rozet taban miktara göre. */
export interface ProductComposeResult {
  basePrice: string;
  price: string;
  lineTotal: string;
  quantity: string;
  baseQuantity: string;
  unit: string;
  curCode: number;
  vatRate: string;
  inStock: boolean;
  available: string;
  madeToOrder: boolean;
  leadDays: number;
  paramSummary: string;
  contributions: ProductComposeContribution[];
}

/** Kardeş kart ekseninde tek değer ve gidilecek kart. */
export interface ProductSiblingValue {
  value: string;
  uid: string;
  handle: string;
  name: string;
  /** Bakılan kartın kendi değeri. */
  current: boolean;
  /** Öteki eksenler korunuyor (false = yalnız bu eksene uyan ilk kardeş). */
  exact: boolean;
}

/** Nitelik ekseni — etiket/tip kategori şablonundan. */
export interface ProductSiblingAxis {
  key: string;
  label: string;
  type: ProductAttributeType;
  values: ProductSiblingValue[];
}

/** /siblings yanıtı — nitelik kümesi → kart çözümü (genişlik/kalınlık seçicisi). */
export interface ProductSiblings {
  categoryUid: string;
  axes: ProductSiblingAxis[];
}

export interface ProductOption {
  name: string;
  value: string;
}

/** Galeri görseli — url + alternatif metin (boşsa sunucu ürün adını koyar). */
export interface ProductImageItem {
  url: string;
  alt: string;
}

/** Ürün detayındaki kategori bağı — kırıntı yolu ve kategori sayfası linki. */
export interface ProductCategoryLink {
  uid: string;
  name: string;
  handle: string;
  /** Hiyerarşik ad ("Üst > Alt"). */
  fullName: string;
  /** '' = kök kategori. */
  parentUid: string;
}

/** Nitelik tipi (kategori şablonu). '' = şablonda olmayan serbest anahtar. */
export type ProductAttributeType = "text" | "number" | "boolean" | "date" | "select" | "";

/** Teknik özellik satırı. `value` metindir; sayı/tarih/evet-hayır `type` ile biçimlenir. */
export interface ProductAttribute {
  key: string;
  label: string;
  type: ProductAttributeType;
  value: string;
}

/** Seçicide gösterilen kardeş varyant — fiyat/stok sunucudan çözülmüş gelir. */
export interface ProductVariant {
  uid: string;
  name: string;
  price: string;
  curCode: number;
  inStock: boolean;
  available: string;
  options: ProductOption[];
}

/** Marka süzgeci satırı (facet). */
export interface StorefrontBrand {
  name: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Yorum / puan
// ---------------------------------------------------------------------------

/** Vitrinde gösterilen yorum; yazar adı MASKELİ gelir ("Ahmet Y."). */
export interface ProductReview {
  uid: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  /** RFC3339 */
  createdAt: string;
  /** Yazım anında doğrulanmış alışveriş damgası. */
  verified: boolean;
  /** Mağaza yanıtı ('' = yok). */
  reply: string;
  repliedAt: string;
  /** Yalnız `mine` için anlamlı: 0 bekliyor · 1 yayında · 2 reddedildi. */
  status: number;
}

export interface ReviewSummary {
  /** "4.3" · '' = puan yok. */
  average: string;
  count: number;
  /** [1★, 2★, 3★, 4★, 5★] sayıları. */
  distribution: [number, number, number, number, number];
}

export interface ReviewList {
  summary: ReviewSummary;
  reviews: ProductReview[];
  total: number;
  /** Giriş yapmış müşterinin kendi yorumu (her durumda); yoksa null. */
  mine: ProductReview | null;
}

export interface ReviewInput {
  rating: number;
  title?: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Sepet
// ---------------------------------------------------------------------------

/** Sepet satırındaki parametre — etiketli (sunucu şablondan damgalar). */
export interface CartLineParam {
  key: string;
  label: string;
  effect: number;
  unit: string;
  value: number;
}

export interface CartLine {
  productUid: string;
  /**
   * SATIR KİMLİĞİ: aynı ürün farklı ölçüyle ayrı satırdır; miktar değişimi
   * ve silme ürünle değil bununla adreslenir.
   */
  lineUid: string;
  /** Girilen ölçüler (parametresiz satırda []). */
  params: CartLineParam[];
  /** "2850 mm" — satır adının altına; belge ve yazdırmayla aynı özet. */
  paramSummary: string;
  /** Taban birim miktar (2 adet × 2,85 m = 5,7) ve taban birim. */
  baseQuantity: string;
  unit: string;
  code: string;
  name: string;
  quantity: string;
  /** KDV HARİÇ birim fiyat. */
  unitPrice: string;
  vatRate: string;
  /** KDV DAHİL birim fiyat (etiket fiyatı) — arayüzde bunu gösterin. */
  grossUnitPrice: string;
  compareAtPrice: string;
  /** Sepet indiriminin bu satıra düşen payı. */
  discountAmount: string;
  lineSubTotal: string;
  lineTaxTotal: string;
  lineTotal: string;
}

export interface Cart {
  uid: string;
  channelUid: string;
  /** 0 açık · 1 tamamlandı (sipariş doğdu) · 2 terk edildi. */
  status: number;
  curCode: number;
  /**
   * Sepetin parası → TL kuru; sepet AÇILIRKEN damgalandı (K7a). Sipariş ve
   * tahsilat bu kurla kesilir: müşteri fiyatı hangi kurla gördüyse ona satın
   * alır, ertesi gün kur değişse de. Parasal string (G5) — istemci onunla
   * hesap YAPMAZ, yalnız gösterir.
   */
  exchRate: string;
  email: string;
  customerName: string;
  phone: string;
  /** true = bir müşteri hesabına bağlı (misafir uid'iyle erişilemez). */
  owned: boolean;
  subTotal: string;
  discountTotal: string;
  promotionName: string;
  couponCode: string;
  taxTotal: string;
  shippingFee: string;
  /** Seçili teslimat yöntemi ('' = seçilmedi) — seçimin tek doğruluk kaynağı. */
  shippingMethodCode: string;
  grandTotal: string;
  /** Adres alanları girdiyle simetriktir: yazılan her alan geri okunabilir. */
  shipName: string;
  shipAddress: string;
  shipDistrict: string;
  shipCity: string;
  shipCountry: string;
  shipPostalCode: string;

  billName: string;
  billCompName: string;
  billTaxNumber: string;
  billTaxOffice: string;
  billAddress: string;
  billDistrict: string;
  billCity: string;
  billCountry: string;
  billPostalCode: string;

  lines: CartLine[];
}

/**
 * Teslimat seçeneği. Ücret SEPETE GÖRE çözülmüş gelir: `price` bu sepet için
 * ödenecek tutardır, `listPrice` tarifedeki sabit ücrettir. İkisi farklıysa
 * `free` doludur — "49,90 yerine ücretsiz" gösterimi bundan kurulur.
 */
export interface ShippingMethod {
  code: string;
  name: string;
  price: string;
  listPrice: string;
  free: boolean;
  /** Ücretsiz kargo sınırı ('' = böyle bir sınır yok). */
  freeOverSubtotal: string;
  selected: boolean;
  sortOrder: number;
}

/** cartSetAddress girdisi — tüm alanlar opsiyonel, boş string = dokunma yok değil, BOŞ yaz. */
export interface CartAddressInput {
  shipAddressUid?: string;
  billAddressUid?: string;
  email?: string;
  customerName?: string;
  phone?: string;
  shipName?: string;
  shipAddress?: string;
  shipDistrict?: string;
  shipCity?: string;
  shipCountry?: string;
  shipPostalCode?: string;
  billName?: string;
  billCompName?: string;
  billTaxNumber?: string;
  billTaxOffice?: string;
  billAddress?: string;
  billDistrict?: string;
  billCity?: string;
  billCountry?: string;
  billPostalCode?: string;
}

// ---------------------------------------------------------------------------
// Hesap (storefront müşterisi — back-office kullanıcısı DEĞİL)
// ---------------------------------------------------------------------------

export interface StorefrontAccount {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  channelUid: string;
  partnerUid: string;
  emailVerified: boolean;
  kvkkAccepted: boolean;
  marketingConsent: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface StorefrontAuthPayload {
  /** Storefront JWT — typ:"storefront" damgalı; back-office'te geçmez. */
  token: string;
  account: StorefrontAccount;
}

export interface StorefrontAddress {
  uid: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
  compName: string;
  taxNumber: string;
  taxOffice: string;
  isDefaultShip: boolean;
  isDefaultBill: boolean;
}

export interface StorefrontOrder {
  uid: string;
  docNum: string;
  /** "YYYY-MM-DD" */
  issueDate: string;
  /** KDV dahil genel toplam. */
  total: string;
  curCode: number;
  /** 0 taslak · 1 onaylı · 2 tamamlandı · 3 iptal. */
  orderState: number;
  /** 0 bekliyor · 1 kısmi · 2 ödendi · 3 iade. */
  paymentState: number;
  /** 0 bekliyor · 1 kısmi · 2 karşılandı. */
  fulfillmentState: number;
}

// ---------------------------------------------------------------------------
// Ödeme
// ---------------------------------------------------------------------------

export interface PaymentTransaction {
  uid: string;
  /** 0 authorize · 1 capture · 2 refund · 3 void. */
  kind: number;
  /** 0 bekliyor · 1 başarılı · 2 başarısız. */
  status: number;
  amount: string;
  providerRef: string;
  errorCode: string;
  errorMessage: string;
  createdAt: string;
}

export interface PaymentSession {
  uid: string;
  providerCode: string;
  channelUid: string;
  cartUid: string;
  /** Sipariş uid'i — capture ile dolar (sipariş o anda doğar). */
  orderUid: string;
  /** 0 created · 1 pending · 2 authorized · 3 captured · 4 part-refund · 5 refunded · 6 failed · 7 cancelled. */
  status: number;
  statusLabel: string;
  amount: string;
  capturedAmount: string;
  refundedAmount: string;
  curCode: number;
  /** 3D/hosted ödeme sayfası — YALNIZ start yanıtında dolu gelir. */
  redirectUrl: string;
  providerRef: string;
  paymentUid: string;
  errorCode: string;
  errorMessage: string;
  createdAt: string;
  transactions: PaymentTransaction[];
}
