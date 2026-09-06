import { apiSunucu, apiIstemci, sorgu } from "./client";
import type {
  ProductAttributeType,
  ProductCategoryLink,
  ProductComposeInput,
  ProductComposeResult,
  ProductSiblings,
  StorefrontMachine,
  StorefrontProduct,
} from "./types";

/**
 * Katalog okuma — hem sunucudan (ISR'lı sayfa iskeleti) hem tarayıcıdan
 * (canlı fiyat/stok tazeleme) çağrılır.
 *
 * Alan listesi ARTIK YOK: REST uçları sabit şekiller döndürür (yanıt
 * şekillendirme yapılmaz), bu yüzden iki yolun aynı şekli döndürmesi
 * sözleşmenin kendisinden gelir — istemcide senkron tutulacak bir alan
 * listesi kalmadı.
 *
 * Önbellek süresi artık İKİ TARAFTA da yaşıyor: backend Cache-Control
 * gönderir (CDN/ara katman), Next de `revalidate` ile kendi veri
 * önbelleğini tutar.
 */

export interface UrunListeParams {
  search?: string;
  /** Kategori filtresi — kategorileriGetir()'den gelen uid. */
  categoryUid?: string;
  /** Koleksiyon filtresi — doluyken liste koleksiyonun kürasyon sırasıyla döner. */
  collectionUid?: string;
  /** Backend sayfa başına en fazla 60 verir; fazlası sessizce kırpılır. */
  limit?: number;
  offset?: number;
  /** '' ad · fiyat-artan · fiyat-azalan · yeni (bilinmeyen değer ada düşer). */
  sort?: string;
  /** Marka süzgeci (harf duyarsız tam eşleşme). */
  brand?: string;
  /** true → satılabilir stoğu olmayanlar elenir. */
  inStock?: boolean;
  /** KDV dahil fiyat aralığı ('' = sınır yok). */
  minPrice?: string;
  maxPrice?: string;
  /**
   * Nitelik süzgeci {anahtar: değer}; anahtarlar arasında VE. Değerler
   * nitelikleriGetir()'in verdiği metinlerdir — sunucu jsonb metniyle
   * karşılaştırır, sayı da metin olarak gider.
   */
  attributes?: Record<string, string>;
}

/** {anahtar: değer} → {"attr.anahtar": değer} (sorgu dizesi sözleşmesi). */
function nitelikParametreleri(attributes?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attributes ?? {})) {
    if (k && v) out[`attr.${k}`] = v;
  }
  return out;
}

/** Liste yanıtı: ürünler + TOPLAM (sayfa numarası göstermek için). */
export interface UrunListeSonuc {
  urunler: StorefrontProduct[];
  /**
   * Süzgeçlere uyan toplam ürün sayısı. Sunucu KAPSAMI sayar; fiyatı
   * çözülemeyen ürünler listede elendiği için birkaç fazla olabilir —
   * sayfalama için yeterli, "tam olarak N ürün" iddiası için değil.
   */
  toplam: number;
}

function listeYolu(params: UrunListeParams): string {
  return `/products${sorgu({
    search: params.search,
    category: params.categoryUid,
    collection: params.collectionUid,
    limit: params.limit ?? 24,
    offset: params.offset,
    sort: params.sort,
    brand: params.brand,
    inStock: params.inStock ? "1" : undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    ...nitelikParametreleri(params.attributes),
  })}`;
}

/** Sunucu tarafı liste — arama yoksa 60 sn ISR, aramada önbelleksiz (kişiye özel sonuç). */
export async function urunleriGetir(params: UrunListeParams = {}): Promise<StorefrontProduct[]> {
  const d = await apiSunucu<{ products: StorefrontProduct[] }>(listeYolu(params), {
    revalidate: params.search ? 0 : 60,
  });
  return d.products;
}

/** Toplamıyla birlikte liste — sayfa numarası gösteren ekranlar bunu kullanır. */
export async function urunSayfasiGetir(params: UrunListeParams = {}): Promise<UrunListeSonuc> {
  const d = await apiSunucu<{ products: StorefrontProduct[]; total: number }>(
    listeYolu(params),
    { revalidate: params.search ? 0 : 60 },
  );
  return { urunler: d.products, toplam: d.total ?? 0 };
}

export interface StorefrontBrandItem {
  name: string;
  count: number;
}

/**
 * Marka süzgeci seçenekleri. MARKA süzgecini kendisi yok sayar — bir marka
 * seçiliyken de öteki markalar seçilebilir kalmalı.
 */
export async function markalariGetir(
  params: Omit<UrunListeParams, "brand" | "limit" | "offset" | "sort"> = {},
): Promise<StorefrontBrandItem[]> {
  const d = await apiSunucu<{ brands: StorefrontBrandItem[] }>(
    `/brands${sorgu({
      search: params.search,
      category: params.categoryUid,
      collection: params.collectionUid,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      ...nitelikParametreleri(params.attributes),
    })}`,
    { revalidate: 300 },
  );
  return d.brands;
}

/** Facet'teki tek değer ve kaç üründe geçtiği. */
export interface StorefrontAttributeValue {
  value: string;
  count: number;
}

/** Nitelik ekseni — etiket ve tip kategori şablonundan ('' = şablon dışı anahtar). */
export interface StorefrontAttributeFacet {
  key: string;
  label: string;
  type: ProductAttributeType;
  values: StorefrontAttributeValue[];
}

/**
 * Nitelik facet'leri — BAĞIMLI: seçili nitelikler gönderilir, her eksen
 * ÖTEKİ eksenlerin seçimiyle daralır, yalnız kendi seçimini yok sayar.
 * "Genişlik 27" seçiliyken kalınlık ekseni 27'de var olan kalınlıkları verir,
 * genişlik ekseni ise 34/41'e geçişi açık tutar — müşteri var olmayan
 * kombinasyon seçip boş sonuca düşemez.
 */
export async function nitelikleriGetir(
  params: Omit<UrunListeParams, "limit" | "offset" | "sort" | "inStock"> = {},
): Promise<StorefrontAttributeFacet[]> {
  const d = await apiSunucu<{ attributes: StorefrontAttributeFacet[] }>(
    `/attributes${sorgu({
      search: params.search,
      category: params.categoryUid,
      collection: params.collectionUid,
      brand: params.brand,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      ...nitelikParametreleri(params.attributes),
    })}`,
    { revalidate: 300 },
  );
  return d.attributes;
}

/**
 * Kardeş kartlar — nitelik kümesi → kart çözümü. Aynı yaprak kategorideki
 * kartların nitelik eksenleri ve her değerin hedef kartı (öteki eksenler
 * korunarak). Sunucuda çözülür; sayfa iskeletiyle birlikte 120 sn ISR.
 * Kategorisiz/niteliksiz üründe eksen listesi boştur; hata sayfayı kırmaz.
 */
export async function kardesleriGetir(uid: string): Promise<ProductSiblings | null> {
  try {
    return await apiSunucu<ProductSiblings>(`/products/${encodeURIComponent(uid)}/siblings`, {
      revalidate: 120,
    });
  } catch {
    return null;
  }
}

/**
 * Makine modelleri — kategori (alt ağacı) için "makinenizi seçin" listesi.
 * Tanım tenant genelidir; 5 dk ISR. Boş liste = bu kategoride makine tablosu yok.
 */
export async function makineleriGetir(categoryUid?: string): Promise<StorefrontMachine[]> {
  try {
    const d = await apiSunucu<{ machines: StorefrontMachine[] }>(
      `/machines${sorgu({ category: categoryUid })}`,
      { revalidate: 300 },
    );
    return d.machines;
  } catch {
    return [];
  }
}

/**
 * Parametre bileşimi — PDP'de şerit boyu/adet girilince fiyat, taban miktar
 * ve stok rozeti SUNUCUDAN gelir (G2/G5): istemci çarpmaz, gösterir. Tarayıcıdan
 * proxy üzerinden POST; önbelleksiz (girdiye bağlı).
 */
export async function bilesimHesapla(
  uid: string,
  girdi: ProductComposeInput,
): Promise<ProductComposeResult> {
  return apiIstemci<ProductComposeResult>(`/products/${encodeURIComponent(uid)}/compose`, {
    metot: "POST",
    govde: girdi,
  });
}

/**
 * Kategori satırı — ağacın DÜZ listesi. Ağaç `parentUid` ile kurulur
 * (lib/kategori.ts); liste derinlik → sıra → ad düzenindedir, ebeveyn her
 * zaman çocuğundan önce gelir.
 */
export interface StorefrontCategory {
  uid: string;
  name: string;
  /** '' = handle yok; adres uid'e düşer (kategoriYolu). */
  handle: string;
  /** Hiyerarşik ad ("Üst > Alt"). */
  fullName: string;
  /** '' = kök. */
  parentUid: string;
  sortOrder: number;
  /** Kökten uzaklık (kök = 1). */
  depth: number;
  /** Vitrin alanları ('' = yok): sayfa metni, üst görsel, SEO meta'sı. */
  description: string;
  imageUrl: string;
  metaTitle: string;
  metaDescription: string;
  /** Kanal kapsamındaki aktif ürün sayısı, ALT AĞAÇ DAHİL (bilgilendirme amaçlı). */
  productCount: number;
}

/** Kategori sayfası başlığı: kendisi + kırıntı zinciri + ürünü olan çocukları. */
export interface StorefrontCategoryDetail extends StorefrontCategory {
  /** Kök → ebeveyn sırasıyla; kökte []. */
  ancestors: ProductCategoryLink[];
  /** Alt ağacında ürünü olan doğrudan çocuklar. */
  children: StorefrontCategory[];
}

/**
 * Kanalın vitrininde (alt ağacı dahil) ürünü olan kategoriler — menü, kırıntı
 * ve süzgeç çubuğu aynı listeden beslenir (5 dk ISR).
 */
export async function kategorileriGetir(): Promise<StorefrontCategory[]> {
  const d = await apiSunucu<{ categories: StorefrontCategory[] }>("/categories", {
    revalidate: 300,
  });
  return d.categories;
}

/** Handle (ya da uid) ile tek kategori — bulunamazsa null (sayfa notFound'a çevirir). */
export async function kategoriGetir(handle: string): Promise<StorefrontCategoryDetail | null> {
  try {
    return await apiSunucu<StorefrontCategoryDetail>(
      `/categories/${encodeURIComponent(handle)}`,
      { revalidate: 300 },
    );
  } catch {
    return null;
  }
}

export interface StorefrontCollection {
  uid: string;
  name: string;
  /** Vitrin URL parçası (/koleksiyon/[handle]). */
  handle: string;
  /** '' = yok. */
  description: string;
  /** '' = yok. */
  imageUrl: string;
  /** Kanal kapsamındaki aktif ürün sayısı (bilgilendirme amaçlı). */
  productCount: number;
}

/** Kanalın vitrininde ürünü olan koleksiyonlar (5 dk ISR). */
export async function koleksiyonlariGetir(): Promise<StorefrontCollection[]> {
  const d = await apiSunucu<{ collections: StorefrontCollection[] }>("/collections", {
    revalidate: 300,
  });
  return d.collections;
}

/** Handle ile tek koleksiyon (sayfa başlığı) — bulunamazsa null. */
export async function koleksiyonGetir(handle: string): Promise<StorefrontCollection | null> {
  try {
    return await apiSunucu<StorefrontCollection>(
      `/collections/${encodeURIComponent(handle)}`,
      { revalidate: 300 },
    );
  } catch {
    // Kanal kapsamı dışındaki koleksiyon 404'tür — sayfa bunu notFound()'a çevirir.
    return null;
  }
}

/** Sunucu tarafı detay — statik iskelet için (canlı fiyat/stok istemciden tazelenir). */
export async function urunGetir(uid: string): Promise<StorefrontProduct | null> {
  try {
    return await apiSunucu<StorefrontProduct>(`/products/${encodeURIComponent(uid)}`, {
      revalidate: 120,
    });
  } catch {
    return null;
  }
}

/**
 * Tarayıcı tarafı arama — üst çubuğun ÖNERİ AÇILIR LİSTESİ.
 *
 * Sunucu yolundan (urunleriGetir) ayrıdır ve bilinçlidir: öneri listesi
 * kişiye özel değildir ama her tuş vuruşunda ISR önbelleği kirletmemelidir;
 * proxy üzerinden gitmek anahtarı da istemciden uzak tutar (V1). Hata
 * yutulur — arama kutusu, ağ hatası yüzünden yazmayı engellememelidir.
 */
export async function urunAraCanli(arama: string, limit = 6): Promise<StorefrontProduct[]> {
  const q = arama.trim();
  if (!q) return [];
  try {
    const d = await apiIstemci<{ products: StorefrontProduct[] }>(
      `/products${sorgu({ search: q, limit })}`,
    );
    return d.products ?? [];
  } catch {
    return [];
  }
}

/** Tarayıcı tarafı detay — PDP açıkken güncel fiyat/stok (TanStack Query ile). */
export async function urunGetirCanli(uid: string): Promise<StorefrontProduct | null> {
  try {
    return await apiIstemci<StorefrontProduct>(`/products/${encodeURIComponent(uid)}`);
  } catch {
    return null;
  }
}
