# StoreFront Anayasası — vitrin

> Bu belge tek başına yeterli değildir. Birden fazla depoyu bağlayan kurallar
> genel anayasadadır: `TicariGo/ANAYASA.md`. Buradaki maddeler yalnız
> StoreFront'a özgüdür ve genel maddeleri tekrarlamaz.

Next.js (App Router) headless e-ticaret vitrini; TicariCore'un vitrin yüzeyine
bağlanır. Para/vergi G5–G6, sipariş atomikliği G18, misafir carisi G19,
kimlik damgası G12.

---

### V1 — Tarayıcı backend'e doğrudan gitmez

Her istemci isteği kendi `/api/store` proxy'mizden geçer (`apiIstemci`);
publishable key orada eklenir. Sunucu bileşenleri ISR için `apiSunucu` ile
TicariCore'un `/store/v1` REST yüzeyine doğrudan gider.

*Neden:* publishable key tarayıcıya sızmaz ve tenant çözümü tek yerde kalır.

### V2 — Sepetin kimliği `cart.uid`'dir

Ayrı bir sepet token'ı yoktur. Girişte `cartMerge` çağrılır ve **dönen uid
saklanır** — birleşmede uid değişebilir.

### V3 — `checkout` mutation'ı yoktur

Sipariş, ödeme oturumu **capture** anında doğar:
`cartSetAddress → paymentSessionStart → authorize`.

`clientUid` idempotency anahtarıdır (`tsf-odeme-{cartUid}`).

### V4 — Ödeme başlatılmış sepet donar

Değişiklik için önce `paymentSessionVoid` çağrılır.

*Neden:* para peşin çekilir (G18); donmamış sepet, tahsil edilen tutarla
gönderilen mal arasında sessiz fark üretir.

### V5 — Sepetin tek doğruluk kaynağı use-cart'tır

`src/hooks/use-cart.ts` sepetin tek doğruluk kaynağıdır; mutasyonlar dönen
sepeti **cache'e yazar** — invalidation ile yeniden çekmez. REST uçları sabit
şekiller döndürdüğü için (G31) istemcide senkron tutulacak alan listesi yoktur.

### V6 — Hesaplar kanal kapsamlıdır

Aynı e-posta **başka kanalda başka hesaptır**. Vitrin hesabı kanalına bağlıdır;
kanallar arası kimlik taşınmaz.

*Neden:* kanal carisi ve fiyat bağlamı kanala aittir (G19, G10); tek bir kimliğin
iki kanalda dolaşması, hangi kanalın müşterisi olduğu belirsiz bir hesap üretir.

### V7 — Liste sorgusu kırpılır, ağır alanlar yalnız detayda gelir

Liste sorgusu sayfa başına en çok **60** kayıt döndürür — sunucu kırpar, istemci
daha fazlasını isteyemez. `images`/`gallery`, `categories`, `attributes`,
`options` ve `variants` **yalnız detay** sorgusunda doludur; listede boş dizi
döner (null değil).

*Neden:* vitrin listesi kataloğun tamamını çekmeye çalışırsa ilk boyama süresi
görsel yüküyle çöker; kategori ve nitelik şablonu ise ürün başına ayrı
sorgudur (N+1) ve kart onları zaten göstermez.

### V9 — Kategori ağacı düz listedir, sayfa alt ağacı kapsar

`/categories` ağacı **düz liste** verir (`parentUid`, `depth`, `sortOrder`);
menü, kırıntı ve dizin ağacı `lib/kategori.ts` ile kurar — ikinci bir ağaç
kurucu yazılmaz. `productCount` ve kategori süzgeci **alt ağacı kapsar**:
"Elektronik" sayfası "Telefon"un ürünlerini de listeler. Kategori adresi
ürünle aynı kuraldadır: handle varsa okunabilir, yoksa uid (`kategoriYolu`).

*Neden:* iç içe ağaç üç yüzeye üç şekil isterdi; alt ağacı kapsamayan
kategori sayfası, yalnız yaprağa ürün bağlayan bir katalogda üst kategorileri
boş gösterirdi.

### V10 — İçerik Markdown'dır ve React düğümü olarak çizilir

CMS sayfası, ürün ve kategori açıklaması **Markdown alt kümesidir** ve
`lib/markdown.tsx` ile React düğümlerine çevrilir. `dangerouslySetInnerHTML`
yalnız JSON-LD için kullanılır; içerik HİÇBİR yerde HTML olarak işlenmez.
Bağlantı hedefi yalnız `http(s)`, `mailto`, göreli ve çapa olabilir. Yorum,
talep gerekçesi ve mağaza yanıtı düz metindir.

*Neden:* yönetici hesabı da bir saldırı yüzeyidir; ham HTML işlenseydi tek bir
yapıştırma vitrindeki her ziyaretçide script çalıştırırdı. Alt küme, harici
sanitize bağımlılığı olmadan bunu yapısal olarak imkânsız kılar.

### V11 — Talep belge değildir

Vitrinden açılan iptal/iade talebi bir KAYITTIR: siparişi iptal etmez, iade
kesmez, stok ve deftere dokunmaz. Mağaza karar verir; belge kendi ekranından
kesilir (G47/4 çizgisi). Vitrin yalnız "şu an ne açılabilir" bayraklarını
(`canCancel` / `canReturn`) sunucudan okur; kuralı yeniden beyan etmez.

*Neden:* para alınmış bir siparişi müşterinin tek tıkla iptal etmesi
tahsilat–iade eşleşmesini ve stok rezervasyonunu vitrin kapısından deftere
taşımak olurdu.

### V12 — Ölçülü ürünün bileşimi ve rozeti sunucudandır

Parametreli üründe (şerit boyu, kaynak ücreti) PDP yalnız GİRDİ toplar;
bileşik fiyat, taban miktar, kırılım ve "stokta" rozeti
`/products/{uid}/compose` ucundan gelir — istemci çarpmaz, ölçüyü metreye
çevirmez, sabiti brütleştirmez (G2/G5/G6). Rozet girdilerden SONRA ve taban
miktara göre çizilir: ölçü girilmeden "stokta" denmez. Sepet satırı ürün +
ölçü kümesiyle kimliklenir (`lineUid`); miktar değişimi ve silme satırla
adreslenir. Nitelik kümesi → kart çözümü (`/siblings`) ve nitelik facet'i
sunucunun verdiği eksenlerle çizilir; eksenler birbirini daraltır, istemci
kombinasyon üretmez.

*Neden:* 2 adet × 2.850 mm = 5,7 m; stok 5 m ise ürün stokta değildir. Rozet
girdiden bağımsız yeşil yandığı sürece yalan söyler. Bileşimi istemci
hesaplasaydı kasadaki fiş ile vitrindeki fiyat kuruş ayrılırdı ve iki
"doğru" fiyat doğardı.

### V8 — Next.js sürüm notları

- `params` ve `searchParams` **Promise**'tir, `await` edilir.
- Klasik önbellek modeli kullanılır (`next: { revalidate }`).
  `cacheComponents` / `"use cache"` **bilinçli olarak** açılmadı — şablon
  sadeliği tercih edildi.
- Bu sürüm eğitim verisinden farklıdır: kod yazmadan önce
  `node_modules/next/dist/docs/` altındaki ilgili kılavuz okunur.
