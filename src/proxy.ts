import { NextResponse, type NextRequest } from "next/server";

/**
 * ÖDEME DÖNÜŞÜ: POST → GET.
 *
 * iyzico ödeme formu müşteriyi callbackUrl'e POST ile (gövdede `token`) geri
 * yollar; Stripe ve PayTR GET kullanır. Sayfa bileşeni POST alamaz — bu yüzden
 * dönüş POST'u burada 303 ile AYNI adrese GET olarak çevrilir. Gövdedeki token
 * yalnız iz olarak `ref` parametresine taşınır: sonucu sunucu sağlayıcıdan
 * kendisi sorgular, tarayıcıdan gelen tokena güvenmez.
 *
 * Sorgu (özellikle `oturum`) olduğu gibi korunur; sağlayıcı callbackUrl'i
 * sorgusuyla birlikte çağırır.
 */
export async function proxy(request: NextRequest) {
  if (request.method !== "POST") return NextResponse.next();
  const hedef = request.nextUrl.clone();
  try {
    const form = await request.formData();
    const token = form.get("token");
    if (typeof token === "string" && token) hedef.searchParams.set("ref", token);
  } catch {
    /* gövde okunamadı — oturum yine de `oturum` parametresi ya da tarayıcı izinden bulunur */
  }
  return NextResponse.redirect(hedef, 303);
}

export const config = {
  matcher: ["/odeme/donus"],
};
