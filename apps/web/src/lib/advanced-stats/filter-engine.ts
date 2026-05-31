import type {
  FilterCondition,
  FilterOperator,
  NormalizedResponse,
  ResponseRow,
  DistributionItem,
} from "./types";

function normalizeText(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export function splitAnswerValues(value: string): string[] {
  if (!value || value === "-") return [];
  return value
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function normalizeResponses(rows: ResponseRow[]): NormalizedResponse[] {
  return rows.map((row) => {
    const answers = new Map<string, string[]>();
    for (const a of row.answers) {
      const title = a.questionTitle?.trim();
      if (!title) continue;
      const parts = splitAnswerValues(a.value);
      const existing = answers.get(title) || [];
      answers.set(title, [...existing, ...parts]);
    }
    return { id: row.id, answers };
  });
}

function valueMatches(
  responseValue: string,
  filterValue: string,
  operator: FilterOperator
): boolean {
  const rv = normalizeText(responseValue);
  const fv = normalizeText(filterValue);

  if (operator === "contains") {
    return rv.includes(fv) || fv.includes(rv);
  }
  return rv === fv;
}

function matchesOperator(
  responseValues: string[],
  condition: FilterCondition
): boolean {
  if (responseValues.length === 0) return false;

  const { operator, values } = condition;
  if (values.length === 0) return true;

  switch (operator) {
    case "any_of":
      return responseValues.some((rv) =>
        values.some((fv) => valueMatches(rv, fv, "contains"))
      );
    case "none_of":
      return !responseValues.some((rv) =>
        values.some((fv) => valueMatches(rv, fv, "contains"))
      );
    case "contains":
      return responseValues.some((rv) =>
        values.some((fv) => normalizeText(rv).includes(normalizeText(fv)))
      );
    case "gt": {
      const num = Number(responseValues[0]);
      const threshold = Number(values[0]);
      return !Number.isNaN(num) && !Number.isNaN(threshold) && num > threshold;
    }
    case "lt": {
      const num = Number(responseValues[0]);
      const threshold = Number(values[0]);
      return !Number.isNaN(num) && !Number.isNaN(threshold) && num < threshold;
    }
    default:
      return true;
  }
}

export function filterResponses(
  rows: NormalizedResponse[],
  conditions: FilterCondition[]
): NormalizedResponse[] {
  const active = conditions.filter((c) => c.questionTitle);
  if (active.length === 0) return rows;

  return rows.filter((row) =>
    active.every((condition) => {
      const responseValues = row.answers.get(condition.questionTitle) || [];
      return matchesOperator(responseValues, condition);
    })
  );
}

export function getUniqueValuesForQuestion(
  rows: NormalizedResponse[],
  questionTitle: string
): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const vals = row.answers.get(questionTitle) || [];
    for (const v of vals) {
      const key = v.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);
}

export function computeDistribution(
  rows: NormalizedResponse[],
  questionTitle: string,
  limit = 20
): DistributionItem[] {
  if (!questionTitle) return [];
  const counts = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    const vals = row.answers.get(questionTitle) || [];
    if (vals.length === 0) continue;
    for (const v of vals) {
      const key = v.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
      total++;
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** İki sorunun cevabı farklı olan satırlar (örn. memleket ≠ yaşadığı şehir) */
export function filterWhereAnswersDiffer(
  rows: NormalizedResponse[],
  questionA: string,
  questionB: string
): NormalizedResponse[] {
  if (!questionA || !questionB) return rows;
  return rows.filter((row) => {
    const aVals = row.answers.get(questionA) || [];
    const bVals = row.answers.get(questionB) || [];
    if (aVals.length === 0 || bVals.length === 0) return false;
    const a = normalizeText(aVals[0]);
    const b = normalizeText(bVals[0]);
    return a !== b && a.length > 0 && b.length > 0;
  });
}

export function collectQuestionTitles(rows: ResponseRow[]): string[] {
  const titles = new Set<string>();
  for (const row of rows) {
    for (const a of row.answers) {
      if (a.questionTitle?.trim()) titles.add(a.questionTitle.trim());
    }
  }
  return Array.from(titles);
}
