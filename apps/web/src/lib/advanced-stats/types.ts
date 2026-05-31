export interface ResponseAnswer {
  questionTitle: string;
  value: string;
}

export interface ResponseRow {
  id: string;
  userEmail?: string;
  submittedAt?: string;
  answers: ResponseAnswer[];
}

export interface NormalizedResponse {
  id: string;
  answers: Map<string, string[]>;
}

export type FilterOperator = "any_of" | "none_of" | "contains" | "gt" | "lt";

export interface FilterCondition {
  id: string;
  questionTitle: string;
  operator: FilterOperator;
  values: string[];
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export type QuestionCategory =
  | "city"
  | "hometown"
  | "team"
  | "stadium"
  | "away"
  | "broadcast"
  | "tff"
  | "referee"
  | "var"
  | "academy"
  | "national"
  | "content"
  | "age"
  | "unknown";

export type PresetCategoryId =
  | "geo"
  | "team"
  | "media"
  | "referee"
  | "academy"
  | "culture"
  | "content";

export type PresetParam = "city" | "team" | "hometown" | "region";

/** Şablon filtresi — soru başlığı anketten otomatik bulunur */
export interface PresetFilterDef {
  questionHint: QuestionCategory;
  operator: FilterOperator;
  /** Sabit değerler (örnek şehir listesi) */
  values?: string[];
  /** Seçilen parametreden gelir (şehir/takım/memleket) */
  valueFromParam?: PresetParam;
}

/** Şablon sonrası ek satır filtresi */
export type PresetPostFilter = "hometown_not_city";

export interface AnalysisPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategoryId;
  filters: PresetFilterDef[];
  targetQuestionHint: QuestionCategory;
  /** Tek parametre (geriye uyumluluk) */
  param?: PresetParam;
  /** Birden fazla parametre (örn. şehir + takım) */
  params?: PresetParam[];
  postFilter?: PresetPostFilter;
}

export interface PresetCategoryMeta {
  id: PresetCategoryId;
  label: string;
}
