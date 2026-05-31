import { useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  Filter,
  Plus,
  Trash2,
  Download,
  FileText,
  Sparkles,
} from "lucide-react";
import type {
  ResponseRow,
  FilterCondition,
  FilterOperator,
} from "@/lib/advanced-stats/types";
import {
  normalizeResponses,
  filterResponses,
  computeDistribution,
  collectQuestionTitles,
  getUniqueValuesForQuestion,
  filterWhereAnswersDiffer,
} from "@/lib/advanced-stats/filter-engine";
import { findQuestionByCategory } from "@/lib/advanced-stats/question-matcher";
import {
  PRESET_CATEGORIES,
  ANALYSIS_PRESETS,
} from "@/lib/advanced-stats/presets";
import {
  buildCityToTeamFilters,
  buildTeamToCityFilters,
  buildComboFilters,
  buildFiltersFromPreset,
  resolveTargetFromPreset,
  type ApplyPresetParams,
} from "@/lib/advanced-stats/apply-preset";
import type { AnalysisPreset, PresetParam } from "@/lib/advanced-stats/types";

interface AdvancedStatsProps {
  responses: ResponseRow[];
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  any_of: "şunlardan biri",
  none_of: "şunlardan hiçbiri değil",
  contains: "içerir",
  gt: "büyüktür",
  lt: "küçüktür",
};

function newConditionId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AdvancedStats({ responses }: AdvancedStatsProps) {
  const questionTitles = useMemo(() => collectQuestionTitles(responses), [responses]);
  const normalizedAll = useMemo(() => normalizeResponses(responses), [responses]);

  const defaultCityQ = useMemo(
    () => findQuestionByCategory(questionTitles, "city"),
    [questionTitles]
  );

  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [targetQuestion, setTargetQuestion] = useState("");
  const [subTab, setSubTab] = useState<"table" | "distribution">("table");

  // Hızlı analiz seçiciler
  const [quickCity, setQuickCity] = useState("");
  const [quickTeam, setQuickTeam] = useState("");
  const [quickHometown, setQuickHometown] = useState("");

  // Şablon akışı
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<AnalysisPreset | null>(null);
  const [presetParams, setPresetParams] = useState<ApplyPresetParams>({});
  const [activePostFilter, setActivePostFilter] = useState<AnalysisPreset["postFilter"]>();

  const resolvedTarget = targetQuestion || questionTitles[0] || "";

  const baseFilteredRows = useMemo(
    () => filterResponses(normalizedAll, filters),
    [normalizedAll, filters]
  );

  const cityQ = useMemo(() => findQuestionByCategory(questionTitles, "city"), [questionTitles]);
  const hometownQ = useMemo(
    () => findQuestionByCategory(questionTitles, "hometown"),
    [questionTitles]
  );

  const filteredRows = useMemo(() => {
    if (!activePostFilter) return baseFilteredRows;
    if (activePostFilter === "hometown_not_city") {
      return filterWhereAnswersDiffer(baseFilteredRows, hometownQ, cityQ);
    }
    return baseFilteredRows;
  }, [baseFilteredRows, cityQ, hometownQ, activePostFilter]);

  const totalCount = normalizedAll.length;
  const filteredCount = filteredRows.length;
  const filteredPercent = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;

  const targetDistribution = useMemo(
    () => computeDistribution(filteredRows, resolvedTarget, 100),
    [filteredRows, resolvedTarget]
  );

  const allQuestionDistributions = useMemo(() => {
    return questionTitles
      .map((title) => ({
        title,
        items: computeDistribution(filteredRows, title, 12),
      }))
      .filter((q) => q.items.length > 0);
  }, [questionTitles, filteredRows]);

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      {
        id: newConditionId(),
        questionTitle: defaultCityQ || questionTitles[0] || "",
        operator: "any_of",
        values: [],
      },
    ]);
  };

  const updateFilter = (id: string, patch: Partial<FilterCondition>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleFilterValue = (filterId: string, value: string) => {
    setFilters((prev) =>
      prev.map((f) => {
        if (f.id !== filterId) return f;
        const has = f.values.includes(value);
        return {
          ...f,
          values: has ? f.values.filter((v) => v !== value) : [...f.values, value],
        };
      })
    );
  };

  const updateFilterValuesFromText = (id: string, text: string) => {
    const values = text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    updateFilter(id, { values });
  };

  const getQuestionValueText = (rowId: string, questionTitle: string): string => {
    const row = filteredRows.find((r) => r.id === rowId);
    if (!row) return "";
    return (row.answers.get(questionTitle) || []).join(" | ");
  };

  const exportExcelLikeCsv = () => {
    const headers = ["response_id", ...questionTitles];
    const lines = [headers.join(",")];
    for (const row of filteredRows) {
      const values = headers.map((h, idx) => {
        if (idx === 0) return `"${row.id}"`;
        const val = (row.answers.get(h) || []).join(" | ").replace(/"/g, '""');
        return `"${val}"`;
      });
      lines.push(values.join(","));
    }
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gelismis-rapor-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const htmlRows = targetDistribution
      .slice(0, 30)
      .map(
        (item) =>
          `<tr><td>${item.label}</td><td style="text-align:right">${item.count}</td><td style="text-align:right">%${item.percentage.toFixed(1)}</td></tr>`
      )
      .join("");

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>Gelişmiş Rapor</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px;">
          <h2>Gelişmiş Rapor (Sade)</h2>
          <p>Toplam katılım: ${totalCount} | Filtreye uyan: ${filteredCount} (%${filteredPercent.toFixed(1)})</p>
          <p>Hedef soru: ${resolvedTarget}</p>
          <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">
            <thead><tr><th style="text-align:left">Cevap</th><th style="text-align:right">Sayı</th><th style="text-align:right">Yüzde</th></tr></thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const applyQuickCityToTeam = () => {
    if (!quickCity) return;
    const { filters: f, target } = buildCityToTeamFilters(questionTitles, quickCity);
    setFilters(f);
    setTargetQuestion(target);
    setSubTab("table");
  };

  const applyQuickTeamToCity = () => {
    if (!quickTeam) return;
    const { filters: f, target } = buildTeamToCityFilters(questionTitles, quickTeam);
    setFilters(f);
    setTargetQuestion(target);
    setSubTab("table");
  };

  const applyQuickCityTeamToStadium = () => {
    if (!quickCity || !quickTeam) return;
    const { filters: f, target } = buildComboFilters(questionTitles, {
      city: quickCity,
      team: quickTeam,
      targetHint: "stadium",
    });
    setFilters(f);
    setTargetQuestion(target);
    setSubTab("table");
  };

  const applyQuickHometownTeamToAway = () => {
    if (!quickHometown || !quickTeam) return;
    const { filters: f, target } = buildComboFilters(questionTitles, {
      hometown: quickHometown,
      team: quickTeam,
      targetHint: "away",
    });
    setFilters(f);
    setTargetQuestion(target);
    setSubTab("table");
  };

  const openPreset = (preset: AnalysisPreset) => {
    // params varsa modal ile alalım, yoksa direkt uygula
    const needsParams = (preset.params && preset.params.length > 0) || !!preset.param;
    if (!needsParams) {
      const newFilters = buildFiltersFromPreset(preset, questionTitles, {});
      const target = resolveTargetFromPreset(preset, questionTitles) || questionTitles[0] || "";
      setFilters(newFilters);
      setTargetQuestion(target);
      setActivePostFilter(preset.postFilter);
      setSubTab("table");
      return;
    }

    const required = preset.params?.length ? preset.params : preset.param ? [preset.param] : [];
    const nextParams: ApplyPresetParams = {};
    for (const p of required) {
      if (p === "city") nextParams.city = quickCity || "";
      if (p === "team") nextParams.team = quickTeam || "";
      if (p === "hometown") nextParams.hometown = quickHometown || "";
      if (p === "region") nextParams.region = "";
    }
    setPresetParams(nextParams);
    setPendingPreset(preset);
    setPresetModalOpen(true);
  };

  const applyPresetNow = () => {
    if (!pendingPreset) return;
    const newFilters = buildFiltersFromPreset(pendingPreset, questionTitles, presetParams);
    const target = resolveTargetFromPreset(pendingPreset, questionTitles) || questionTitles[0] || "";
    setFilters(newFilters);
    setTargetQuestion(target);
    setActivePostFilter(pendingPreset.postFilter);
    setSubTab("table");
    setPresetModalOpen(false);
    setPendingPreset(null);
  };

  const requiredParams: PresetParam[] = useMemo(() => {
    if (!pendingPreset) return [];
    if (pendingPreset.params?.length) return pendingPreset.params;
    if (pendingPreset.param) return [pendingPreset.param];
    return [];
  }, [pendingPreset]);

  if (questionTitles.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Analiz için henüz cevap verisi yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" /> Toplam: <strong>{totalCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Filter className="w-4 h-4" /> Filtreli: <strong>{filteredCount}</strong> (%{filteredPercent.toFixed(1)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcelLikeCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted">
              <Download className="w-3.5 h-3.5" /> Excel (CSV)
            </button>
            <button onClick={exportPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Hızlı analizler (senaryolar) */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Hızlı Analiz</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          1) Kimler? (şehir / takım / memleket) seçin. 2) Ne analiz edilsin? otomatik seçilir.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="border rounded-md p-3 space-y-2">
            <div className="text-xs font-semibold">Şehir seç → o şehirde yaşayanların takım dağılımı</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={quickCity}
                onChange={(e) => setQuickCity(e.target.value)}
                placeholder="Şehir (örn. Samsun)"
                className="flex-1 border rounded px-2 py-1.5 text-xs bg-background"
              />
              <button
                type="button"
                onClick={applyQuickCityToTeam}
                className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted"
              >
                Uygula
              </button>
            </div>
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <div className="text-xs font-semibold">Takım seç → o takım taraftarının şehir dağılımı</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={quickTeam}
                onChange={(e) => setQuickTeam(e.target.value)}
                placeholder="Takım (örn. Galatasaray)"
                className="flex-1 border rounded px-2 py-1.5 text-xs bg-background"
              />
              <button
                type="button"
                onClick={applyQuickTeamToCity}
                className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted"
              >
                Uygula
              </button>
            </div>
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <div className="text-xs font-semibold">Şehir + takım → stadyuma gitme alışkanlığı</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={quickCity}
                onChange={(e) => setQuickCity(e.target.value)}
                placeholder="Şehir (örn. Samsun)"
                className="border rounded px-2 py-1.5 text-xs bg-background"
              />
              <input
                value={quickTeam}
                onChange={(e) => setQuickTeam(e.target.value)}
                placeholder="Takım (örn. Galatasaray)"
                className="border rounded px-2 py-1.5 text-xs bg-background"
              />
            </div>
            <button
              type="button"
              onClick={applyQuickCityTeamToStadium}
              className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted"
            >
              Uygula
            </button>
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <div className="text-xs font-semibold">Memleket + takım → deplasman kültürü</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={quickHometown}
                onChange={(e) => setQuickHometown(e.target.value)}
                placeholder="Memleket (örn. Trabzon)"
                className="border rounded px-2 py-1.5 text-xs bg-background"
              />
              <input
                value={quickTeam}
                onChange={(e) => setQuickTeam(e.target.value)}
                placeholder="Takım (örn. Fenerbahçe)"
                className="border rounded px-2 py-1.5 text-xs bg-background"
              />
            </div>
            <button
              type="button"
              onClick={applyQuickHometownTeamToAway}
              className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Kimler? (Filtreler)</h3>
          <button
            type="button"
            onClick={addFilter}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border hover:bg-muted"
          >
            <Plus className="w-3.5 h-3.5" /> Filtre ekle
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          İstediğiniz kadar filtre ekleyebilirsiniz. Bu bölüm “kimleri seçiyoruz?” kısmı.
        </p>

        {filters.length === 0 ? (
          <p className="text-xs text-muted-foreground">Henüz filtre yok.</p>
        ) : (
          <div className="space-y-2">
            {filters.map((condition) => {
              const suggestions = getUniqueValuesForQuestion(normalizedAll, condition.questionTitle).slice(0, 50);
              const listId = `${condition.id}-list`;
              return (
                <div key={condition.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border border-border/60 rounded-md p-2">
                  <select
                    value={condition.questionTitle}
                    onChange={(e) => updateFilter(condition.id, { questionTitle: e.target.value })}
                    className="md:col-span-4 border rounded px-2 py-1.5 text-xs bg-background"
                  >
                    {questionTitles.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateFilter(condition.id, { operator: e.target.value as FilterOperator, values: [] })}
                    className="md:col-span-2 border rounded px-2 py-1.5 text-xs bg-background"
                  >
                    {(Object.keys(OPERATOR_LABELS) as FilterOperator[]).map((op) => (
                      <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                    ))}
                  </select>
                  {(condition.operator === "gt" || condition.operator === "lt") ? (
                    <input
                      type="number"
                      value={condition.values[0] || ""}
                      onChange={(e) => updateFilter(condition.id, { values: [e.target.value] })}
                      placeholder="Örn: 25"
                      className="md:col-span-5 border rounded px-2 py-1.5 text-xs bg-background"
                    />
                  ) : (
                    <>
                      <input
                        list={listId}
                        value={condition.values.join(", ")}
                        onChange={(e) => updateFilterValuesFromText(condition.id, e.target.value)}
                        placeholder="Virgülle ayırın (örn: Samsun, Trabzon)"
                        className="md:col-span-5 border rounded px-2 py-1.5 text-xs bg-background"
                      />
                      <datalist id={listId}>
                        {suggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </>
                  )}
                  <button onClick={() => removeFilter(condition.id)} className="md:col-span-1 inline-flex justify-center p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ne analiz edilsin? (Hedef soru)</label>
            <select
              value={resolvedTarget}
              onChange={(e) => setTargetQuestion(e.target.value)}
              className="w-full max-w-xl border rounded px-3 py-2 text-sm bg-background"
            >
              {questionTitles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-1 bg-muted p-1 rounded-md w-fit">
            <button onClick={() => setSubTab("table")} className={`px-3 py-1.5 text-xs rounded ${subTab === "table" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Tablo</button>
            <button onClick={() => setSubTab("distribution")} className={`px-3 py-1.5 text-xs rounded ${subTab === "distribution" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Dağılım</button>
          </div>
        </div>

        {subTab === "table" && (
          <div className="overflow-auto border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Cevap</th>
                  <th className="text-right px-3 py-2">Sayı</th>
                  <th className="text-right px-3 py-2">Yüzde</th>
                </tr>
              </thead>
              <tbody>
                {targetDistribution.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Veri yok</td></tr>
                ) : (
                  targetDistribution.map((item) => (
                    <tr key={item.label} className="border-t">
                      <td className="px-3 py-2">{item.label}</td>
                      <td className="px-3 py-2 text-right">{item.count}</td>
                      <td className="px-3 py-2 text-right">%{item.percentage.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {subTab === "distribution" && (
          <div className="space-y-4">
            {allQuestionDistributions.map((q) => (
              <div key={q.title} className="border rounded-md p-3">
                <h4 className="text-xs font-semibold mb-2">{q.title}</h4>
                <div className="space-y-1.5">
                  {q.items.slice(0, 8).map((item) => (
                    <div key={item.label} className="grid grid-cols-12 gap-2 text-xs items-center">
                      <div className="col-span-6 truncate">{item.label}</div>
                      <div className="col-span-2 text-right">{item.count}</div>
                      <div className="col-span-2 text-right">%{item.percentage.toFixed(1)}</div>
                      <div className="col-span-2 h-2 bg-muted rounded overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.max(item.percentage, 2)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {allQuestionDistributions.length === 0 && <p className="text-xs text-muted-foreground">Dağılım verisi yok.</p>}
          </div>
        )}
      </div>

      {/* Şablonlar */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Hazır Rapor Şablonları</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Bir şablona tıklayın; filtreler otomatik dolar ve hedef soru seçilir.
        </p>

        <div className="space-y-2">
          {PRESET_CATEGORIES.map((cat) => {
            const items = ANALYSIS_PRESETS.filter((p) => p.category === cat.id);
            if (items.length === 0) return null;
            return (
              <details key={cat.id} className="border rounded-md p-3">
                <summary className="cursor-pointer text-sm font-semibold">{cat.label} <span className="text-xs text-muted-foreground">({items.length})</span></summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPreset(p)}
                      className="text-left border rounded-md p-2 hover:bg-muted/40"
                    >
                      <div className="text-xs font-semibold">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.description}</div>
                    </button>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {subTab === "table" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Satır Bazlı Veri (Filtreli)</h3>
          <div className="overflow-auto border rounded-md max-h-[360px]">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Response ID</th>
                  {questionTitles.slice(0, 6).map((q) => (
                    <th key={q} className="text-left px-3 py-2">{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(0, 200).map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{row.id.slice(0, 8)}</td>
                    {questionTitles.slice(0, 6).map((q) => (
                      <td key={q} className="px-3 py-2">{getQuestionValueText(row.id, q) || "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Not: Ekran sadeliği için ilk 6 soru ve ilk 200 satır gösteriliyor. Excel dışa aktarmada tüm sütunlar yer alır.
          </p>
        </div>
      )}

      {/* Şablon parametre modalı */}
      {presetModalOpen && pendingPreset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  {pendingPreset.name}
                </div>
                <div className="text-xs text-muted-foreground">{pendingPreset.description}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPresetModalOpen(false);
                  setPendingPreset(null);
                }}
                className="text-xs border rounded px-2 py-1 hover:bg-muted"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-2">
              {requiredParams.includes("city") && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Şehir</label>
                  <input
                    value={presetParams.city || ""}
                    onChange={(e) => setPresetParams((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Örn: Samsun"
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background"
                  />
                </div>
              )}
              {requiredParams.includes("team") && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Takım</label>
                  <input
                    value={presetParams.team || ""}
                    onChange={(e) => setPresetParams((p) => ({ ...p, team: e.target.value }))}
                    placeholder="Örn: Galatasaray"
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background"
                  />
                </div>
              )}
              {requiredParams.includes("hometown") && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Memleket</label>
                  <input
                    value={presetParams.hometown || ""}
                    onChange={(e) => setPresetParams((p) => ({ ...p, hometown: e.target.value }))}
                    placeholder="Örn: Trabzon"
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={applyPresetNow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted"
              >
                <Sparkles className="w-3.5 h-3.5" /> Şablonu uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
