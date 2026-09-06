import { BellRing, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * KAMPANYA ÇAĞRISI — footer'daki "bülten" bloğu.
 *
 * DİKKAT: burada e-posta toplayan bir form YOKTUR ve bu bilinçlidir. Backend'in
 * bülten aboneliği diye bir ucu yok; olmayan bir uca e-posta yollayan bir
 * kutu koymak, müşteriye "kaydedildi" deyip hiçbir şey kaydetmemek olurdu.
 *
 * Gerçek olan yol üyeliktir: `storefront_account.marketing_consent` KVKK
 * izninin kayıtlı tek yeridir (kayıt formunda onay kutusu). Blok müşteriyi
 * oraya taşır. Bülten ayrı bir modül olarak açılırsa (tablo + uç + yönetim
 * ekranı) burası forma dönüşür.
 */
export function BultenFormu() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-background p-6 md:flex-row md:items-center">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <BellRing className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Kampanyalardan ilk siz haberdar olun</p>
          <p className="text-sm text-soft">
            Üye olurken pazarlama iznini işaretleyin; indirim ve yeni ürün duyuruları
            e-postanıza gelsin. İzni istediğiniz an geri alabilirsiniz.
          </p>
        </div>
      </div>
      <Link
        href="/hesap"
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
      >
        Üye Ol <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
