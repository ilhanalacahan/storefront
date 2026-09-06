import { apiIstemci, apiSunucu, sorgu } from "./client";

/**
 * TAKSİT TABLOSU — tutarın banka × taksit karşılığı.
 *
 * HESAP SUNUCUDADIR (G5): vitrin tutarı gönderir, tabloyu hazır alır. Aylık
 * taksiti burada bölmek, JavaScript'in float64'ü yüzünden "6 × aylık ≠ toplam"
 * bir tablo üretirdi — üstelik sessizce.
 *
 * Tarife tanımlı değilse BOŞ dizi döner ve çağıran bölümü hiç çizmez: boş bir
 * "Taksit Seçenekleri" başlığı, taksit yokmuş gibi değil sistem bozukmuş gibi
 * görünür.
 */
export interface TaksitSecenegi {
  count: number;
  /** Aylık taksit tutarı (gösterim değeri). */
  monthly: string;
  /** İlk taksit — kuruş kalanı buradadır; monthly ile eşitse fark yok. */
  firstMonthly: string;
  total: string;
  /** Vade farkı tutarı (total − tutar). */
  extra: string;
  /** Vade farkı yüzdesi ("0" = farksız). */
  rate: string;
}

export interface TaksitBankasi {
  bankName: string;
  options: TaksitSecenegi[];
}

/** Sunucu tarafı (PDP iskeleti) — 5 dk ISR; tarife nadiren değişir. */
export async function taksitleriGetir(tutar: string): Promise<TaksitBankasi[]> {
  const t = (tutar ?? "").trim();
  if (!t || Number(t) <= 0) return [];
  try {
    const d = await apiSunucu<{ banks: TaksitBankasi[] }>(
      `/installments${sorgu({ amount: t })}`,
      { revalidate: 300 },
    );
    return d.banks ?? [];
  } catch {
    return [];
  }
}

/** Tarayıcı tarafı (sepet toplamı değiştikçe) — proxy üzerinden. */
export async function taksitleriGetirCanli(tutar: string): Promise<TaksitBankasi[]> {
  const t = (tutar ?? "").trim();
  if (!t || Number(t) <= 0) return [];
  try {
    const d = await apiIstemci<{ banks: TaksitBankasi[] }>(
      `/installments${sorgu({ amount: t })}`,
    );
    return d.banks ?? [];
  } catch {
    return [];
  }
}
