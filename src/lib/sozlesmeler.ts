import { saticiBilgisi, type Satici } from "./satici";

/**
 * YASAL METİNLER — mesafeli satışın zorunlu belgeleri.
 *
 * Türkiye'de internetten satış üç belgeyi zorunlu kılar (6502 sayılı Kanun +
 * Mesafeli Sözleşmeler Yönetmeliği): ön bilgilendirme formu, mesafeli satış
 * sözleşmesi ve cayma/iade koşulları. KVKK aydınlatma metni ile çerez
 * politikası ayrı mevzuattan gelir.
 *
 * BU METİNLER ŞABLONDUR. Yönetmeliğin istediği başlıkları ve asgari içeriği
 * taşırlar; satılan ürüne, teslimat modeline ve satıcının kendi koşullarına
 * göre HUKUK DANIŞMANINA UYARLATILMALIDIR. Şablonu olduğu gibi yayımlamak
 * satıcıyı bağlar — bu yüzden künyesi eksik olan sayfa uyarı gösterir.
 *
 * Metin neden kodda: sayfa sunucuda render edilir ve SEO botu tam içeriği
 * görür; ayrıca satıcı künyesi tek yerden (lib/satici.ts) beslenir, beş
 * belgede beş kopya adres tutulmaz.
 */

export type BelgeAnahtari =
  | "on-bilgilendirme"
  | "mesafeli-satis"
  | "iptal-iade"
  | "gizlilik"
  | "cerez";

export interface Bolum {
  baslik: string;
  paragraflar: string[];
  maddeler?: string[];
}

export interface Belge {
  anahtar: BelgeAnahtari;
  baslik: string;
  ozet: string;
  bolumler: Bolum[];
}

/** Cayma hakkı süresi (gün) — yönetmeliğin asgarisi 14'tür. */
const CAYMA_GUN = 14;

export const BELGE_SIRASI: BelgeAnahtari[] = [
  "on-bilgilendirme",
  "mesafeli-satis",
  "iptal-iade",
  "gizlilik",
  "cerez",
];

export const BELGE_ADLARI: Record<BelgeAnahtari, string> = {
  "on-bilgilendirme": "Ön Bilgilendirme Formu",
  "mesafeli-satis": "Mesafeli Satış Sözleşmesi",
  "iptal-iade": "İptal ve İade Koşulları",
  gizlilik: "Gizlilik ve KVKK Aydınlatma Metni",
  cerez: "Çerez Politikası",
};

function kunye(s: Satici): Bolum {
  return {
    baslik: "Satıcı Bilgileri",
    paragraflar: [],
    maddeler: [
      `Ünvan: ${s.unvan}`,
      `Adres: ${s.adres}`,
      `Telefon: ${s.telefon}`,
      `E-posta: ${s.eposta}`,
      `MERSİS No: ${s.mersis}`,
      `Vergi Dairesi / No: ${s.vergi}`,
    ],
  };
}

function onBilgilendirme(s: Satici): Belge {
  return {
    anahtar: "on-bilgilendirme",
    baslik: BELGE_ADLARI["on-bilgilendirme"],
    ozet:
      "Siparişinizi tamamlamadan önce bilmeniz gereken satıcı, ürün, ödeme, " +
      "teslimat ve cayma hakkı bilgileri.",
    bolumler: [
      kunye(s),
      {
        baslik: "Sözleşme Konusu",
        paragraflar: [
          "İşbu formun konusu, alıcının elektronik ortamda siparişini verdiği " +
            "ürün ve hizmetlerin nitelikleri, satış fiyatı, ödeme şekli, teslimat " +
            "koşulları ve cayma hakkı konusunda bilgilendirilmesidir.",
          "Sipariş konusu ürünlerin cinsi, adedi, KDV dahil satış fiyatı, kargo " +
            "bedeli ve ödenecek toplam tutar, ödeme adımında ekranda gösterilir ve " +
            "sipariş onayınızla birlikte tarafınıza iletilir.",
        ],
      },
      {
        baslik: "Ödeme",
        paragraflar: [
          "Ödeme, ödeme kuruluşunun güvenli ödeme sayfası üzerinden yapılır. " +
            "Kart bilgileriniz satıcıya iletilmez ve satıcı sistemlerinde saklanmaz.",
          "Sipariş, ödemenin tahsil edildiği anda oluşur. Ödeme tamamlanmazsa " +
            "sipariş kurulmaz ve stok rezervasyonu yapılmaz.",
        ],
      },
      {
        baslik: "Teslimat",
        paragraflar: [
          "Ürünler, sipariş sırasında bildirdiğiniz teslimat adresine, seçtiğiniz " +
            "teslimat yöntemiyle gönderilir. Yasal teslim süresi, siparişin " +
            "kurulmasından itibaren 30 gündür.",
          "Kargo bedeli, ödeme adımında ayrı bir satır olarak gösterilir. " +
            "Ücretsiz kargo sınırı tanımlıysa sınırın üstündeki siparişlerde " +
            "kargo bedeli alınmaz.",
        ],
      },
      {
        baslik: "Cayma Hakkı",
        paragraflar: [
          `Alıcı, ürünü teslim aldığı tarihten itibaren ${CAYMA_GUN} gün içinde ` +
            "hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden " +
            "cayma hakkına sahiptir.",
          `Cayma bildirimi ${s.eposta} adresine ya da ${s.telefon} numarasına ` +
            "yapılabilir. Ürün, faturası ve tüm aksesuarlarıyla birlikte iade " +
            `edilir. İade adresi: ${s.iadeAdresi}`,
        ],
      },
      {
        baslik: "Cayma Hakkının Kullanılamayacağı Ürünler",
        paragraflar: [
          "Mevzuat gereği aşağıdaki ürünlerde cayma hakkı kullanılamaz:",
        ],
        maddeler: [
          "Alıcının istekleri doğrultusunda kişiye özel hazırlanan ürünler",
          "Çabuk bozulan veya son kullanma tarihi geçebilecek ürünler",
          "Tesliminden sonra ambalajı açılmış hijyen ve sağlık ürünleri",
          "Dijital içerik ve elektronik ortamda anında ifa edilen hizmetler",
        ],
      },
      {
        baslik: "Uyuşmazlık",
        paragraflar: [
          "Şikâyet ve itirazlar, Ticaret Bakanlığınca ilan edilen parasal " +
            "sınırlar dâhilinde alıcının yerleşim yerindeki Tüketici Hakem " +
            "Heyetine veya Tüketici Mahkemesine yapılabilir.",
        ],
      },
    ],
  };
}

function mesafeliSatis(s: Satici): Belge {
  return {
    anahtar: "mesafeli-satis",
    baslik: BELGE_ADLARI["mesafeli-satis"],
    ozet:
      "Siparişinizle birlikte satıcı ile aranızda kurulan sözleşmenin tam metni.",
    bolumler: [
      kunye(s),
      {
        baslik: "Taraflar ve Konu",
        paragraflar: [
          "İşbu sözleşme, yukarıda bilgileri yer alan SATICI ile sipariş " +
            "sırasında bilgilerini bildiren ALICI arasında, 6502 sayılı Tüketicinin " +
            "Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği " +
            "hükümlerine uygun olarak kurulmuştur.",
          "Sözleşmenin konusu, alıcının elektronik ortamda sipariş verdiği " +
            "ürünlerin satışı ve teslimidir. Sipariş içeriği, tutarları ve " +
            "teslimat bilgileri sipariş özetinde yer alır ve bu sözleşmenin " +
            "ayrılmaz parçasıdır.",
        ],
      },
      {
        baslik: "Alıcının Beyanı",
        paragraflar: [
          "Alıcı, siparişi onaylamadan önce Ön Bilgilendirme Formunu okuduğunu, " +
            "satıcının ünvanı ve iletişim bilgilerini, ürünün temel niteliklerini, " +
            "vergiler dâhil satış fiyatını, ödeme ve teslimat koşullarını, cayma " +
            "hakkını ve şikâyet başvuru yollarını öğrendiğini kabul eder.",
        ],
      },
      {
        baslik: "Satıcının Yükümlülükleri",
        paragraflar: [],
        maddeler: [
          "Sipariş konusu ürünü, sağlam ve eksiksiz olarak, yasal süre içinde teslim etmek",
          "Ürünün temel niteliklerine uygun ürün göndermek",
          "Fatura ve varsa garanti belgesini ürünle birlikte iletmek",
          "Cayma hakkı kullanıldığında ödemeyi 14 gün içinde iade etmek",
        ],
      },
      {
        baslik: "Alıcının Yükümlülükleri",
        paragraflar: [],
        maddeler: [
          "Sipariş sırasında doğru ve eksiksiz bilgi vermek",
          "Ürünü teslim alırken kargo paketini kontrol etmek; hasarlı paket için tutanak tutturmak",
          "Cayma hakkında ürünü kutusu, aksesuarları ve faturasıyla iade etmek",
        ],
      },
      {
        baslik: "Teslimat ve Gecikme",
        paragraflar: [
          "Ürün, alıcının bildirdiği adrese kargo firması aracılığıyla teslim " +
            "edilir. Alıcının adreste bulunmaması hâlinde kargo firmasının " +
            "bıraktığı bildirim üzerine teslim alınması alıcının sorumluluğundadır.",
          "Stok tükenmesi gibi ifanın imkânsızlaştığı hâllerde satıcı durumu " +
            "alıcıya bildirir ve tahsil edilen tutarı 14 gün içinde iade eder.",
        ],
      },
      {
        baslik: "Cayma Hakkı",
        paragraflar: [
          `Alıcı, teslim tarihinden itibaren ${CAYMA_GUN} gün içinde cayma ` +
            "hakkını kullanabilir. Cayma hâlinde ürün bedeli, ödeme aracına " +
            "14 gün içinde iade edilir.",
          "Cayma hakkının kullanılamayacağı ürünler Ön Bilgilendirme Formunda " +
            "sayılmıştır.",
        ],
      },
      {
        baslik: "Yürürlük",
        paragraflar: [
          "Alıcı, siparişi onayladığında bu sözleşmenin tüm koşullarını kabul " +
            "etmiş sayılır. Sözleşme elektronik ortamda kurulur ve satıcı " +
            "tarafından saklanır.",
        ],
      },
    ],
  };
}

function iptalIade(s: Satici): Belge {
  return {
    anahtar: "iptal-iade",
    baslik: BELGE_ADLARI["iptal-iade"],
    ozet: "Siparişinizi nasıl iptal edersiniz, iade süreci nasıl işler.",
    bolumler: [
      {
        baslik: "Sipariş İptali",
        paragraflar: [
          "Kargoya verilmemiş siparişler için iptal talebinizi " +
            `${s.eposta} adresine iletebilirsiniz. Kargoya verilmiş siparişlerde ` +
            "iptal yerine cayma hakkı işletilir.",
          "Ödemesi tamamlanmamış siparişlerde ödemeyi ödeme adımında " +
            "iptal edebilirsiniz; sepetiniz düzenlenebilir hâle gelir.",
        ],
      },
      {
        baslik: "Cayma ve İade",
        paragraflar: [
          `Ürünü teslim aldığınız tarihten itibaren ${CAYMA_GUN} gün içinde ` +
            "cayma hakkınızı kullanabilirsiniz.",
          `İade edeceğiniz ürünü kutusu, aksesuarları ve faturasıyla birlikte ` +
            `${s.iadeAdresi} adresine gönderin.`,
        ],
        maddeler: [
          `İade bildirimi: ${s.eposta} · ${s.telefon}`,
          "İade kargo bedeli: anlaşmalı kargo kullanıldığında satıcıya aittir",
          "Ücret iadesi: ürün satıcıya ulaştıktan sonra 14 gün içinde, ödeme aracına",
        ],
      },
      {
        baslik: "Hasarlı veya Ayıplı Ürün",
        paragraflar: [
          "Kargo paketinde hasar varsa ürünü teslim almadan kargo görevlisine " +
            "tutanak tutturun. Ayıplı ürün tesliminde ürünün değiştirilmesini, " +
            "bedelin iadesini veya onarımını talep edebilirsiniz.",
        ],
      },
    ],
  };
}

function gizlilik(s: Satici): Belge {
  return {
    anahtar: "gizlilik",
    baslik: BELGE_ADLARI.gizlilik,
    ozet:
      "Kişisel verilerinizi hangi amaçla işlediğimiz, kimlerle paylaştığımız ve " +
      "haklarınız.",
    bolumler: [
      {
        baslik: "Veri Sorumlusu",
        paragraflar: [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca veri sorumlusu ` +
            `${s.unvan}'dır. İletişim: ${s.eposta} · ${s.adres}`,
        ],
      },
      {
        baslik: "İşlenen Veriler ve Amaçları",
        paragraflar: [],
        maddeler: [
          "Kimlik ve iletişim bilgileri — siparişin kurulması, faturalandırma ve teslimat",
          "Adres bilgileri — kargo gönderimi",
          "Sipariş ve ödeme kayıtları — yasal saklama yükümlülüğü ve muhasebe",
          "Açık rıza verdiyseniz e-posta adresi — kampanya bildirimleri",
        ],
      },
      {
        baslik: "Aktarım",
        paragraflar: [
          "Verileriniz; siparişin ifası için kargo firmasına, ödemenin alınması " +
            "için ödeme kuruluşuna, yasal yükümlülükler kapsamında yetkili kamu " +
            "kurumlarına aktarılabilir. Bunun dışında üçüncü kişilerle paylaşılmaz " +
            "ve pazarlama amacıyla satılmaz.",
        ],
      },
      {
        baslik: "Saklama Süresi",
        paragraflar: [
          "Sipariş ve fatura kayıtları, vergi mevzuatının öngördüğü süre boyunca " +
            "saklanır. Pazarlama izniniz, iznini geri çekene kadar geçerlidir.",
        ],
      },
      {
        baslik: "Haklarınız",
        paragraflar: [
          "KVKK'nın 11. maddesi uyarınca verilerinize erişme, düzeltilmesini, " +
            "silinmesini veya anonimleştirilmesini isteme ve işlemeye itiraz etme " +
            `haklarınız vardır. Başvurularınızı ${s.eposta} adresine iletebilirsiniz.`,
        ],
      },
    ],
  };
}

function cerez(): Belge {
  return {
    anahtar: "cerez",
    baslik: BELGE_ADLARI.cerez,
    ozet: "Sitede hangi çerezleri kullandığımız ve nasıl yönetebileceğiniz.",
    bolumler: [
      {
        baslik: "Kullandığımız Çerezler",
        paragraflar: [
          "Bu sitede yalnız sitenin çalışması için gerekli olan zorunlu çerezler " +
            "ve tarayıcı depolaması kullanılır.",
        ],
        maddeler: [
          "Sepet kimliği — sepetinizin sayfalar arasında korunması",
          "Oturum bilgisi — giriş yaptıysanız hesabınızın tanınması",
          "Ödeme izi — ödeme sayfasından döndüğünüzde siparişinizin bulunması",
        ],
      },
      {
        baslik: "Reklam ve İzleme Çerezleri",
        paragraflar: [
          "Bu sitede üçüncü taraf reklam veya izleme çerezi kullanılmamaktadır. " +
            "İleride eklenmesi hâlinde bu metin güncellenir ve açık rızanız alınır.",
        ],
      },
      {
        baslik: "Çerezleri Yönetme",
        paragraflar: [
          "Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. " +
            "Zorunlu çerezler engellenirse sepet ve giriş işlevleri çalışmaz.",
        ],
      },
    ],
  };
}

/** Belgeyi satıcı künyesiyle üretir. */
export function belgeGetir(anahtar: BelgeAnahtari): Belge {
  const s = saticiBilgisi();
  switch (anahtar) {
    case "on-bilgilendirme":
      return onBilgilendirme(s);
    case "mesafeli-satis":
      return mesafeliSatis(s);
    case "iptal-iade":
      return iptalIade(s);
    case "gizlilik":
      return gizlilik(s);
    case "cerez":
      return cerez();
  }
}

export function belgeAnahtariMi(v: string): v is BelgeAnahtari {
  return (BELGE_SIRASI as string[]).includes(v);
}
