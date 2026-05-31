import type { QuestionCategory } from "./types";

const PATTERNS: Record<Exclude<QuestionCategory, "unknown">, RegExp[]> = {
  city: [
    /şehir/i,
    /yaşadığınız/i,
    /yaşadığı/i,
    /bulunduğunuz\s*il/i,
    /konum/i,
    /iliniz/i,
    /city/i,
    /location/i,
  ],
  hometown: [/memleket/i, /doğduğunuz/i, /doğum\s*yeri/i, /nüfus/i, /köken/i, /geldiginiz/i],
  team: [
    /tuttuğunuz\s*takım/i,
    /hangi\s*takım/i,
    /taraftar/i,
    /kulüp/i,
    /desteklediğiniz/i,
    /team/i,
    /club/i,
  ],
  stadium: [
    /stadyum/i,
    /stad/i,
    /kombine/i,
    /maça\s*gidi/i,
    /tribün/i,
    /her\s*maç/i,
    /passolig/i,
  ],
  away: [/deplasman/i, /deplasmana/i, /deplasman\s*kültür/i, /away/i],
  broadcast: [/yayın/i, /izleme/i, /kaçak/i, /iptv/i, /\btv\b/i, /televizyon/i, /platform/i, /youtube/i],
  tff: [/tff/i, /federasyon/i, /türkiye\s*futbol/i],
  referee: [/hakem/i, /yabancı\s*hakem/i],
  var: [/\bvar\b/i, /video/i],
  academy: [/altyapı/i, /akademi/i, /torpil/i, /yabancı\s*oyuncu/i],
  national: [/milli\s*takım/i, /milli\s*maç/i, /avrupa\s*başarı/i],
  content: [/kanal/i, /içerik/i, /sosyal\s*medya/i, /bakış\s*açım/i],
  age: [/yaş/i, /age/i, /doğum\s*yıl/i],
};

export function categorizeQuestion(title: string): QuestionCategory {
  const t = title.trim();
  const order: Exclude<QuestionCategory, "unknown">[] = [
    "hometown",
    "away",
    "stadium",
    "referee",
    "var",
    "academy",
    "national",
    "content",
    "broadcast",
    "tff",
    "team",
    "city",
    "age",
  ];
  for (const cat of order) {
    if (PATTERNS[cat].some((r) => r.test(t))) return cat;
  }
  return "unknown";
}

export function findQuestionByCategory(
  titles: string[],
  category: QuestionCategory
): string {
  if (category === "unknown") return "";
  const found = titles.find((t) => categorizeQuestion(t) === category);
  return found || "";
}

export function findQuestionsByCategory(
  titles: string[],
  category: QuestionCategory
): string[] {
  if (category === "unknown") return [];
  return titles.filter((t) => categorizeQuestion(t) === category);
}

export function findBestTargetQuestion(
  titles: string[],
  hint?: QuestionCategory | "auto"
): string {
  if (hint && hint !== "auto" && hint !== "unknown") {
    const match = findQuestionByCategory(titles, hint);
    if (match) return match;
    if (hint === "away") {
      const stadium = findQuestionByCategory(titles, "stadium");
      if (stadium) return stadium;
    }
  }
  const priority: QuestionCategory[] = [
    "team",
    "city",
    "stadium",
    "away",
    "broadcast",
    "tff",
    "referee",
  ];
  for (const cat of priority) {
    const q = findQuestionByCategory(titles, cat);
    if (q) return q;
  }
  return titles[0] || "";
}

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  city: "Şehir (yaşadığı)",
  hometown: "Memleket",
  team: "Takım",
  stadium: "Stadyum / maça gitme",
  away: "Deplasman",
  broadcast: "Yayın / medya",
  tff: "TFF / federasyon",
  referee: "Hakem",
  var: "VAR",
  academy: "Altyapı",
  national: "Milli takım",
  content: "İçerik / kanal",
  age: "Yaş",
  unknown: "Diğer",
};
