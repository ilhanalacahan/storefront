import Link from "next/link";

/**
 * FİYAT ARALIĞI SÜZGECİ — iki sayı kutusu + uygula.
 *
 * DÜZ BİR GET FORMUDUR ve bu bilinçlidir: paneldeki her süzgeç bir linktir,
 * fiyat aralığı ise iki alan birden dolduğunda gezinmelidir. Bunu istemci
 * durumuyla çözmek (React state + router.push) hem paneli istemciye taşır hem
 * de İKİNCİ BİR ADRES KURUCUSU doğurur — oysa adres kuralı tek yerdedir
 * (katalogLinkKurucu). GET formu aynı işi JavaScript olmadan yapar: tarayıcı
 * alanları sorgu dizesine çevirir.
 *
 * ÖTEKİ SÜZGEÇLER GİZLİ ALANLARLA TAŞINIR: marka, arama ve nitelik seçimleri
 * form gönderildiğinde kaybolmamalıdır. `sayfa` bilerek taşınmaz — süzgeç
 * değişince 1. sayfaya dönülür.
 *
 * BURADA PARASAL ARİTMETİK YOKTUR (G5): girilen değerler metin olarak gider,
 * süzgeci sunucu uygular.
 */
export function FiyatAraligiSuzgeci({
  enAz,
  enCok,
  /** Fiyat süzgeci KALDIRILMIŞ hâlin adresi — form hedefi ve gizli alanlar buradan türer. */
  temizHref,
}: {
  enAz: string;
  enCok: string;
  temizHref: string;
}) {
  const [yol, qs = ""] = temizHref.split("?");
  const gizli = Array.from(new URLSearchParams(qs).entries());
  const girdi =
    "h-9 w-full min-w-0 rounded-lg border border-line bg-background px-2.5 text-sm outline-none transition focus:border-accent";

  return (
    <form action={yol} method="get" className="space-y-2">
      {gizli.map(([ad, deger]) => (
        <input key={`${ad}=${deger}`} type="hidden" name={ad} value={deger} />
      ))}
      <div className="flex items-center gap-2">
        <input
          name="enaz"
          inputMode="decimal"
          defaultValue={enAz}
          placeholder="En az"
          aria-label="En düşük fiyat"
          className={girdi}
        />
        <span className="text-soft">–</span>
        <input
          name="encok"
          inputMode="decimal"
          defaultValue={enCok}
          placeholder="En çok"
          aria-label="En yüksek fiyat"
          className={girdi}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="h-8 flex-1 rounded-lg bg-accent text-xs font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          Uygula
        </button>
        {enAz || enCok ? (
          <Link
            href={temizHref}
            className="flex h-8 items-center rounded-lg border border-line px-3 text-xs font-medium text-soft transition hover:text-foreground"
          >
            Sıfırla
          </Link>
        ) : null}
      </div>
    </form>
  );
}
