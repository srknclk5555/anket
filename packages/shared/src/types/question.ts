export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "searchable_dropdown"
  | "searchable_list"
  | "linear_scale"
  | "rating"
  | "yes_no"
  | "date"
  | "number"
  | "ranking"
  | "matrix";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Kısa Metin",
  long_text: "Uzun Metin",
  single_choice: "Çoktan Seçmeli (Tek / Radio)",
  multiple_choice: "Çoklu Seçim (Checkbox)",
  dropdown: "Açılır Liste",
  searchable_dropdown: "İçeren Metin Araması ile Dropdown",
  searchable_list: "İçeren Metin Araması ile Liste",
  linear_scale: "Doğrusal Ölçek",
  rating: "Yıldız Puanı",
  yes_no: "Evet / Hayır",
  date: "Tarih",
  number: "Sayı",
  ranking: "Sıralama",
  matrix: "Matris",
};

export interface Question {
  id: string;
  sectionId: string;
  questionType: QuestionType;
  title: string;
  description: string | null;
  isRequired: boolean;
  orderIndex: number;
  scaleMin: number | null;
  scaleMax: number | null;
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
  customListId?: string | null;
  customList?: CustomList | null;
  createdAt: Date;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  label: string;
  orderIndex: number;
  isOther: boolean;
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export interface MatrixRow {
  id: string;
  label: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
}

export interface CustomList {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: CustomListItem[];
}

export interface CustomListItem {
  id: string;
  listId: string;
  value: string;
  orderIndex: number;
}
