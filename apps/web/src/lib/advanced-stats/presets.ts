import type { AnalysisPreset, PresetCategoryMeta } from "./types";

export const KARADENIZ_CITIES = [
  "Samsun",
  "Trabzon",
  "Rize",
  "Giresun",
  "Ordu",
  "Artvin",
];

export const BIG_THREE_TEAMS = ["Galatasaray", "Fenerbahçe", "Beşiktaş"];
export const BIG_THREE_ALIASES = ["Galatasaray", "GS", "Fenerbahçe", "FB", "Fener", "Beşiktaş", "BJK"];
export const ISTANBUL_NAMES = ["İstanbul", "Istanbul", "istanbul"];

export const PRESET_CATEGORIES: PresetCategoryMeta[] = [
  { id: "geo", label: "Şehir & Coğrafya" },
  { id: "team", label: "Takım & Taraftar" },
  { id: "media", label: "Medya & Yayın" },
  { id: "referee", label: "Hakem & TFF" },
  { id: "academy", label: "Altyapı & Milli Takım" },
  { id: "culture", label: "Taraftar Kültürü" },
  { id: "content", label: "İçerik & Kanal" },
];

export const ANALYSIS_PRESETS: AnalysisPreset[] = [
  // ── Şehir & Coğrafya ──
  {
    id: "geo-city-team-loyalty",
    name: "Şehir takımı sadakati",
    description: "Seçtiğiniz şehirde yaşayanların hangi takımı tuttuğu",
    category: "geo",
    param: "city",
    filters: [{ questionHint: "city", operator: "any_of", valueFromParam: "city" }],
    targetQuestionHint: "team",
  },
  {
    id: "geo-hometown-migration",
    name: "Memleket → yaşadığı şehir",
    description: "Memleketi X olanlar şu an hangi şehirlerde yaşıyor",
    category: "geo",
    param: "hometown",
    filters: [{ questionHint: "hometown", operator: "any_of", valueFromParam: "hometown" }],
    targetQuestionHint: "city",
  },
  {
    id: "geo-migrant-fans",
    name: "Göç eden taraftarlar",
    description: "Memleketi ile yaşadığı şehir farklı olanların takım dağılımı",
    category: "geo",
    filters: [],
    postFilter: "hometown_not_city",
    targetQuestionHint: "team",
  },
  {
    id: "geo-big3-outside-istanbul",
    name: "Anadolu'da 3 büyük taraftar",
    description: "İstanbul dışında GS/FB/BJK taraftarlarının şehir dağılımı",
    category: "geo",
    filters: [
      { questionHint: "team", operator: "any_of", values: BIG_THREE_ALIASES },
      { questionHint: "city", operator: "none_of", values: ISTANBUL_NAMES },
    ],
    targetQuestionHint: "city",
  },
  {
    id: "geo-pirate-by-city",
    name: "Kaçak yayın — şehir",
    description: "Şehir bazında kaçak yayın eğilimi",
    category: "geo",
    filters: [],
    targetQuestionHint: "broadcast",
  },

  // ── Takım & Taraftar ──
  {
    id: "team-big3-city",
    name: "3 büyük — şehir dağılımı",
    description: "GS, FB, BJK taraftarları hangi şehirlerde yoğun",
    category: "team",
    filters: [{ questionHint: "team", operator: "any_of", values: BIG_THREE_ALIASES }],
    targetQuestionHint: "city",
  },
  {
    id: "team-big3-city-param",
    name: "Seçilen takım — şehir dağılımı",
    description: "Belirli bir takım taraftarının şehir dağılımı",
    category: "team",
    param: "team",
    filters: [{ questionHint: "team", operator: "any_of", valueFromParam: "team" }],
    targetQuestionHint: "city",
  },
  {
    id: "team-away-culture",
    name: "Deplasman kültürü",
    description: "Deplasmana en çok giden taraftar grupları (takım bazında)",
    category: "team",
    filters: [],
    targetQuestionHint: "away",
  },
  {
    id: "team-stadium-attendance",
    name: "Stadyuma en çok giden taraftarlar",
    description: "Maça / stadyuma gitme alışkanlığı — takım bazında",
    category: "team",
    filters: [],
    targetQuestionHint: "stadium",
  },
  {
    id: "team-away-hometown",
    name: "Memleket + takım → deplasman",
    description: "Örn. memleketi Trabzon, Fenerbahçeli → deplasman alışkanlığı",
    category: "team",
    filters: [
      { questionHint: "hometown", operator: "any_of", valueFromParam: "hometown" },
      { questionHint: "team", operator: "any_of", valueFromParam: "team" },
    ],
    params: ["hometown", "team"],
    targetQuestionHint: "away",
  },
  {
    id: "team-city-stadium",
    name: "Şehir + takım → stadyum",
    description: "Örn. Samsun'da yaşayan Galatasaraylıların stadyum alışkanlığı",
    category: "team",
    filters: [
      { questionHint: "city", operator: "any_of", valueFromParam: "city" },
      { questionHint: "team", operator: "any_of", valueFromParam: "team" },
    ],
    params: ["city", "team"],
    targetQuestionHint: "stadium",
  },

  // ── Medya & Yayın ──
  {
    id: "media-pirate-team",
    name: "Kaçak yayın — takım",
    description: "Hangi takım taraftarları daha çok kaçak yayın kullanıyor",
    category: "media",
    filters: [],
    targetQuestionHint: "broadcast",
  },
  {
    id: "media-pirate-city-param",
    name: "Kaçak yayın — seçilen şehir",
    description: "Belirli şehirde kaçak yayın oranı",
    category: "media",
    param: "city",
    filters: [{ questionHint: "city", operator: "any_of", valueFromParam: "city" }],
    targetQuestionHint: "broadcast",
  },
  {
    id: "media-source",
    name: "Medya kaynağı profili",
    description: "YouTube / TV vb. kullanımı — takım ve şehir kırılımı",
    category: "media",
    filters: [],
    targetQuestionHint: "broadcast",
  },

  // ── Hakem & TFF ──
  {
    id: "ref-region-trust",
    name: "Bölge — hakem güvensizliği",
    description: "Hakemlere en az güvenen bölgeler / şehirler",
    category: "referee",
    filters: [{ questionHint: "city", operator: "any_of", values: KARADENIZ_CITIES }],
    targetQuestionHint: "referee",
  },
  {
    id: "ref-team-trust",
    name: "Takım — hakem güveni",
    description: "Hangi takım taraftarı hakemlere en az güveniyor",
    category: "referee",
    filters: [],
    targetQuestionHint: "referee",
  },
  {
    id: "ref-tff-trust",
    name: "TFF güveni — takım",
    description: "TFF'ye en düşük güven veren taraftar grupları",
    category: "referee",
    filters: [],
    targetQuestionHint: "tff",
  },
  {
    id: "ref-var-team",
    name: "VAR memnuniyeti",
    description: "VAR memnuniyeti — takım bazında",
    category: "referee",
    filters: [],
    targetQuestionHint: "var",
  },
  {
    id: "ref-tff-city-team",
    name: "Şehir + takım → TFF güveni",
    description: "Belirli şehir ve takım taraftarının TFF güven dağılımı",
    category: "referee",
    filters: [
      { questionHint: "city", operator: "any_of", valueFromParam: "city" },
      { questionHint: "team", operator: "any_of", valueFromParam: "team" },
    ],
    params: ["city", "team"],
    targetQuestionHint: "tff",
  },

  // ── Altyapı & Milli ──
  {
    id: "academy-torpil",
    name: "Altyapı torpili algısı",
    description: "Torpil algısı — bölge / şehir",
    category: "academy",
    filters: [],
    targetQuestionHint: "academy",
  },
  {
    id: "academy-national-repr",
    name: "Milli takım temsili",
    description: "Anadolu temsili yetersiz diyenlerin şehir dağılımı",
    category: "academy",
    filters: [],
    targetQuestionHint: "national",
  },

  // ── Taraftar Kültürü ──
  {
    id: "culture-stadium-city",
    name: "Stadyuma en çok giden şehirler",
    description: "Kombine / sık maça gidenler — şehir bazında",
    category: "culture",
    filters: [],
    targetQuestionHint: "stadium",
  },
  {
    id: "culture-stadium-city-team",
    name: "Şehir + takım → stadyum (detay)",
    description: "İki koşul: şehir ve takım seçin, stadyum cevaplarını görün",
    category: "culture",
    filters: [
      { questionHint: "city", operator: "any_of", valueFromParam: "city" },
      { questionHint: "team", operator: "any_of", valueFromParam: "team" },
    ],
    params: ["city", "team"],
    targetQuestionHint: "stadium",
  },
  {
    id: "culture-away-hometown-team",
    name: "Memleket + takım → deplasman",
    description: "Memleket ve takım seçerek deplasman kültürü analizi",
    category: "culture",
    filters: [
      { questionHint: "hometown", operator: "any_of", valueFromParam: "hometown" },
      { questionHint: "team", operator: "any_of", valueFromParam: "team" },
    ],
    params: ["hometown", "team"],
    targetQuestionHint: "away",
  },

  // ── İçerik ──
  {
    id: "content-impact",
    name: "İçerik etkisi",
    description: "Bakış açısı değişti diyenlerin takım ve şehir dağılımı",
    category: "content",
    filters: [],
    targetQuestionHint: "content",
  },
  {
    id: "content-youtube",
    name: "Kanalı YouTube ile bulanlar",
    description: "YouTube ile kanala gelenlerin profili",
    category: "content",
    filters: [],
    targetQuestionHint: "content",
  },
];

export function getPresetsByCategory(categoryId: string): AnalysisPreset[] {
  return ANALYSIS_PRESETS.filter((p) => p.category === categoryId);
}
