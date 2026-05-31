import type {
  AnalysisPreset,
  FilterCondition,
  PresetParam,
} from "./types";
import { findQuestionByCategory } from "./question-matcher";
import type { QuestionCategory } from "./types";

export interface ApplyPresetParams {
  city?: string;
  team?: string;
  hometown?: string;
  region?: string;
}

function newConditionId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function resolveParamValue(param: PresetParam, values: ApplyPresetParams): string[] {
  switch (param) {
    case "city":
      return values.city ? [values.city] : [];
    case "team":
      return values.team ? [values.team] : [];
    case "hometown":
      return values.hometown ? [values.hometown] : [];
    case "region":
      return values.region ? values.region.split(",").map((s) => s.trim()).filter(Boolean) : [];
    default:
      return [];
  }
}

export function buildFiltersFromPreset(
  preset: AnalysisPreset,
  questionTitles: string[],
  params: ApplyPresetParams
): FilterCondition[] {
  const conditions: FilterCondition[] = [];

  for (const def of preset.filters) {
    const questionTitle = findQuestionByCategory(questionTitles, def.questionHint);
    if (!questionTitle) continue;

    let values: string[] = def.values ? [...def.values] : [];
    if (def.valueFromParam) {
      values = resolveParamValue(def.valueFromParam, params);
    }

    if (values.length === 0 && def.operator !== "gt" && def.operator !== "lt") continue;

    conditions.push({
      id: newConditionId(),
      questionTitle,
      operator: def.operator,
      values,
    });
  }

  return conditions;
}

export function resolveTargetFromPreset(
  preset: AnalysisPreset,
  questionTitles: string[]
): string {
  return findQuestionByCategory(questionTitles, preset.targetQuestionHint);
}

/** Şehir → takım dağılımı */
export function buildCityToTeamFilters(
  questionTitles: string[],
  city: string
): { filters: FilterCondition[]; target: string } {
  const cityQ = findQuestionByCategory(questionTitles, "city");
  const teamQ = findQuestionByCategory(questionTitles, "team");
  return {
    filters: cityQ
      ? [
          {
            id: newConditionId(),
            questionTitle: cityQ,
            operator: "any_of",
            values: [city],
          },
        ]
      : [],
    target: teamQ || questionTitles[0] || "",
  };
}

/** Takım → şehir dağılımı */
export function buildTeamToCityFilters(
  questionTitles: string[],
  team: string
): { filters: FilterCondition[]; target: string } {
  const cityQ = findQuestionByCategory(questionTitles, "city");
  const teamQ = findQuestionByCategory(questionTitles, "team");
  return {
    filters: teamQ
      ? [
          {
            id: newConditionId(),
            questionTitle: teamQ,
            operator: "any_of",
            values: [team],
          },
        ]
      : [],
    target: cityQ || questionTitles[0] || "",
  };
}

/** Çoklu koşul: örn. şehir + takım → hedef soru */
export function buildComboFilters(
  questionTitles: string[],
  opts: {
    city?: string;
    team?: string;
    hometown?: string;
    targetHint: QuestionCategory;
  }
): { filters: FilterCondition[]; target: string } {
  const filters: FilterCondition[] = [];
  const cityQ = findQuestionByCategory(questionTitles, "city");
  const teamQ = findQuestionByCategory(questionTitles, "team");
  const hometownQ = findQuestionByCategory(questionTitles, "hometown");

  if (opts.city && cityQ) {
    filters.push({
      id: newConditionId(),
      questionTitle: cityQ,
      operator: "any_of",
      values: [opts.city],
    });
  }
  if (opts.team && teamQ) {
    filters.push({
      id: newConditionId(),
      questionTitle: teamQ,
      operator: "any_of",
      values: [opts.team],
    });
  }
  if (opts.hometown && hometownQ) {
    filters.push({
      id: newConditionId(),
      questionTitle: hometownQ,
      operator: "any_of",
      values: [opts.hometown],
    });
  }

  const target = findQuestionByCategory(questionTitles, opts.targetHint);
  return { filters, target: target || questionTitles[0] || "" };
}
