import { useMemo, useState } from "react";
import { BarChart3, Database, Download, FileText, Filter, Sparkles, Users } from "lucide-react";
import type { AnalysisPreset, FilterCondition, PresetParam, ResponseRow } from "@/lib/advanced-stats/types";
import {
  collectQuestionTitles,
  computeDistribution,
  filterResponses,
  filterWhereAnswersDiffer,
  getUniqueValuesForQuestion,
  normalizeResponses,
} from "@/lib/advanced-stats/filter-engine";
import { findQuestionByCategory } from "@/lib/advanced-stats/question-matcher";
import { ANALYSIS_PRESETS, PRESET_CATEGORIES } from "@/lib/advanced-stats/presets";
import {
  buildCityToTeamFilters,
  buildComboFilters,
  buildFiltersFromPreset,
  buildTeamToCityFilters,
  resolveTargetFromPreset,
  type ApplyPresetParams,
} from "@/lib/advanced-stats/apply-preset";

interface DetailedReportProps {
  responses: ResponseRow[];
}

function conditionId() {
  return `dr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DetailedReport({ responses }: DetailedReportProps) {
  const questionTitles = useMemo(() => collectQuestionTitles(responses), [responses]);
  const normalizedAll = useMemo(() => normalizeResponses(responses), [responses]);

  const cityQ = useMemo(() => findQuestionByCategory(questionTitles, "city"), [questionTitles]);
  const teamQ = useMemo(() => findQuestionByCategory(questionTitles, "team"), [questionTitles]);
  const hometownQ = useMemo(() => findQuestionByCategory(questionTitles, "hometown"), [questionTitles]);

  const cityOptions = useMemo(
    () => (cityQ ? getUniqueValuesForQuestion(normalizedAll, cityQ).slice(0, 150) : []),
    [normalizedAll, cityQ]
  );
  const teamOptions = useMemo(
    () => (teamQ ? getUniqueValuesForQuestion(normalizedAll, teamQ).slice(0, 80) : []),
    [normalizedAll, teamQ]
  );
  const hometownOptions = useMemo(
    () => (hometownQ ? getUniqueValuesForQuestion(normalizedAll, hometownQ).slice(0, 150) : []),
    [normalizedAll, hometownQ]
  );

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedHometown, setSelectedHometown] = useState("");
  const [targetQuestion, setTargetQuestion] = useState("");
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [activePostFilter, setActivePostFilter] = useState<AnalysisPreset["postFilter"]>();
  const [selectedCategory, setSelectedCategory] = useState(PRESET_CATEGORIES[0]?.id || "geo");
  const [paramModalOpen, setParamModalOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<AnalysisPreset | null>(null);
  const [presetParams, setPresetParams] = useState<ApplyPresetParams>({});

  const baseRows = useMemo(() => filterResponses(normalizedAll, filters), [normalizedAll, filters]);
  const filteredRows = useMemo(() => {
    if (activePostFilter === "hometown_not_city") {
      return filterWhereAnswersDiffer(baseRows, hometownQ, cityQ);
    }
    return baseRows;
  }, [activePostFilter, baseRows, hometownQ, cityQ]);

  const resolvedTarget = targetQuestion || questionTitles[0] || "";
  const distribution = useMemo(
    () => computeDistribution(filteredRows, resolvedTarget, 200),
    [filteredRows, resolvedTarget]
  );
  const topFive = distribution.slice(0, 5);
  const totalCount = normalizedAll.length;
  const filteredCount = filteredRows.length;

  // Şehir seçildiyse, o şehirde gerçekten seçilmiş takımlar (ayırt edicilik yüksek)
  const teamOptionsForSelectedCity = useMemo(() => {
    if (!selectedCity || !cityQ || !teamQ) return teamOptions;
    const set = new Set<string>();
    for (const row of normalizedAll) {
      const cityAns = row.answers.get(cityQ) || [];
      if (!cityAns.some((v) => v.trim() === selectedCity)) continue;
      const teamAns = row.answers.get(teamQ) || [];
      for (const t of teamAns) {
        const trimmed = t.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    const result = Array.from(set);
    // Eğer bu şehirde hiç takım kaydı yoksa, global listeye düş
    return result.length > 0 ? result : teamOptions;
  }, [selectedCity, cityQ, teamQ, normalizedAll, teamOptions]);

  const applyGeneralFromSelections = () => {
    const next: FilterCondition[] = [];
    if (selectedCity && cityQ) {
      next.push({
        id: conditionId(),
        questionTitle: cityQ,
        operator: "any_of",
        values: [selectedCity],
      });
    }
    if (selectedTeam && teamQ) {
      next.push({
        id: conditionId(),
        questionTitle: teamQ,
        operator: "any_of",
        values: [selectedTeam],
      });
    }
    if (selectedHometown && hometownQ) {
      next.push({
        id: conditionId(),
        questionTitle: hometownQ,
        operator: "any_of",
        values: [selectedHometown],
      });
    }
    setFilters(next);
    setActivePostFilter(undefined);
  };

  const applyQuickCityTeam = () => {
    if (!selectedCity) return;
    const result = buildCityToTeamFilters(questionTitles, selectedCity);
    setFilters(result.filters);
    setTargetQuestion(result.target);
    setActivePostFilter(undefined);
  };

  const applyQuickTeamCity = () => {
    if (!selectedTeam) return;
    const result = buildTeamToCityFilters(questionTitles, selectedTeam);
    setFilters(result.filters);
    setTargetQuestion(result.target);
    setActivePostFilter(undefined);
  };

  const applyQuickCityTeamStadium = () => {
    if (!selectedCity || !selectedTeam) return;
    const result = buildComboFilters(questionTitles, {
      city: selectedCity,
      team: selectedTeam,
      targetHint: "stadium",
    });
    setFilters(result.filters);
    setTargetQuestion(result.target);
    setActivePostFilter(undefined);
  };

  const applyQuickHometownTeamAway = () => {
    if (!selectedHometown || !selectedTeam) return;
    const result = buildComboFilters(questionTitles, {
      hometown: selectedHometown,
      team: selectedTeam,
      targetHint: "away",
    });
    setFilters(result.filters);
    setTargetQuestion(result.target);
    setActivePostFilter(undefined);
  };

  const exportCsv = () => {
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
    a.download = `detayli-rapor-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const rows = distribution
      .slice(0, 40)
      .map(
        (item) =>
          `<tr><td>${item.label}</td><td style="text-align:right">${item.count}</td><td style="text-align:right">%${item.percentage.toFixed(1)}</td></tr>`
      )
      .join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>Detaylı Rapor</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px;">
          <h2>Detaylı Rapor</h2>
          <p>Toplam cevap: ${totalCount} | Filtreye uyan: ${filteredCount}</p>
          <p>Hedef soru: ${resolvedTarget}</p>
          <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">
            <thead><tr><th style="text-align:left">Cevap</th><th style="text-align:right">Sayı</th><th style="text-align:right">Yüzde</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  const openPreset = (preset: AnalysisPreset) => {
    const requires = preset.params?.length ? preset.params : preset.param ? [preset.param] : [];
    if (requires.length === 0) {
      setFilters(buildFiltersFromPreset(preset, questionTitles, {}));
      setTargetQuestion(resolveTargetFromPreset(preset, questionTitles));
      setActivePostFilter(preset.postFilter);
      return;
    }
    setPendingPreset(preset);
    setPresetParams({
      city: selectedCity,
      team: selectedTeam,
      hometown: selectedHometown,
      region: "",
    });
    setParamModalOpen(true);
  };

  const requiredParams: PresetParam[] = useMemo(() => {
    if (!pendingPreset) return [];
    if (pendingPreset.params?.length) return pendingPreset.params;
    if (pendingPreset.param) return [pendingPreset.param];
    return [];
  }, [pendingPreset]);

  const applyPreset = () => {
    if (!pendingPreset) return;
    setFilters(buildFiltersFromPreset(pendingPreset, questionTitles, presetParams));
    setTargetQuestion(resolveTargetFromPreset(pendingPreset, questionTitles));
    setActivePostFilter(pendingPreset.postFilter);
    setParamModalOpen(false);
    setPendingPreset(null);
  };

  const clearAll = () => {
    setFilters([]);
    setTargetQuestion("");
    setActivePostFilter(undefined);
  };

  if (questionTitles.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Detaylı rapor için henüz cevap verisi yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Detaylı Rapor</h3>
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Şehir / takım / memleket seçenekleri anket cevaplarından otomatik gelir.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted">
              <Download className="w-3.5 h-3.5" /> Excel (CSV)
            </button>
            <button onClick={exportPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 lg:col-span-2">
          <h4 className="text-sm font-semibold inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Hızlı Senaryolar
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold">Şehir → Takım dağılımı</div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs bg-background"
              >
                <option value="">Şehir seçin</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <button onClick={applyQuickCityTeam} className="w-full text-xs border rounded px-2 py-1.5 hover:bg-muted">Analiz Et</button>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold">Takım → Şehir dağılımı</div>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs bg-background"
              >
                <option value="">Takım seçin</option>
                {teamOptions.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <button onClick={applyQuickTeamCity} className="w-full text-xs border rounded px-2 py-1.5 hover:bg-muted">Analiz Et</button>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold">Şehir + Takım → Stadyum</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Şehir</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Takım</option>
                  {teamOptionsForSelectedCity.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <button onClick={applyQuickCityTeamStadium} className="w-full text-xs border rounded px-2 py-1.5 hover:bg-muted">Analiz Et</button>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold">Memleket + Takım → Deplasman</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedHometown}
                  onChange={(e) => setSelectedHometown(e.target.value)}
                  className="border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Memleket</option>
                  {hometownOptions.map((hometown) => (
                    <option key={hometown} value={hometown}>{hometown}</option>
                  ))}
                </select>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Takım</option>
                  {teamOptionsForSelectedCity.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <button onClick={applyQuickHometownTeamAway} className="w-full text-xs border rounded px-2 py-1.5 hover:bg-muted">Analiz Et</button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-semibold inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Sonuç Özeti
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="border rounded-md p-2">
              <div className="text-[11px] text-muted-foreground">Toplam</div>
              <div className="font-semibold text-sm">{totalCount}</div>
            </div>
            <div className="border rounded-md p-2">
              <div className="text-[11px] text-muted-foreground">Filtreli</div>
              <div className="font-semibold text-sm">{filteredCount}</div>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">En yüksek 5 sonuç</div>
          <div className="space-y-1.5">
            {topFive.length === 0 && <p className="text-xs text-muted-foreground">Henüz veri yok.</p>}
            {topFive.map((item) => (
              <div key={item.label} className="grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-7 truncate">{item.label}</div>
                <div className="col-span-2 text-right">{item.count}</div>
                <div className="col-span-3 text-right">%{item.percentage.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Ne analiz edilsin? (Hedef soru)
            </label>
            <select
              value={resolvedTarget}
              onChange={(e) => setTargetQuestion(e.target.value)}
              className="w-full max-w-xl border rounded px-3 py-2 text-sm bg-background"
            >
              {questionTitles.map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={applyGeneralFromSelections}
              className="text-xs border rounded-md px-3 py-1.5 hover:bg-muted"
            >
              Genel analiz (şehir/takım/memleket)
            </button>
            <button onClick={clearAll} className="text-xs border rounded-md px-3 py-1.5 hover:bg-muted">
              Filtreleri Temizle
            </button>
          </div>
        </div>

        <div className="overflow-auto border rounded-md">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">Cevap</th>
                <th className="text-right px-3 py-2">Sayı</th>
                <th className="text-right px-3 py-2">Yüzde</th>
              </tr>
            </thead>
            <tbody>
              {distribution.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">Seçili filtrelerle sonuç bulunamadı.</td>
                </tr>
              ) : (
                distribution.map((item) => (
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
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-semibold">Hazır Şablonlar</h4>
        <div className="flex flex-wrap gap-2">
          {PRESET_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {ANALYSIS_PRESETS.filter((preset) => preset.category === selectedCategory).map((preset) => (
            <button
              key={preset.id}
              onClick={() => openPreset(preset)}
              className="text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="text-xs font-semibold">{preset.name}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {paramModalOpen && pendingPreset && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 space-y-3">
            <h5 className="text-sm font-semibold">{pendingPreset.name}</h5>
            <p className="text-xs text-muted-foreground">{pendingPreset.description}</p>

            {requiredParams.includes("city") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Şehir</label>
                <select
                  value={presetParams.city || ""}
                  onChange={(e) => setPresetParams((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Şehir seçin</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}
            {requiredParams.includes("team") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Takım</label>
                <select
                  value={presetParams.team || ""}
                  onChange={(e) => setPresetParams((prev) => ({ ...prev, team: e.target.value }))}
                  className="w-full border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Takım seçin</option>
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            )}
            {requiredParams.includes("hometown") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Memleket</label>
                <select
                  value={presetParams.hometown || ""}
                  onChange={(e) => setPresetParams((prev) => ({ ...prev, hometown: e.target.value }))}
                  className="w-full border rounded px-2 py-1.5 text-xs bg-background"
                >
                  <option value="">Memleket seçin</option>
                  {hometownOptions.map((hometown) => (
                    <option key={hometown} value={hometown}>{hometown}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setParamModalOpen(false);
                  setPendingPreset(null);
                }}
                className="text-xs border rounded px-3 py-1.5 hover:bg-muted"
              >
                Vazgeç
              </button>
              <button onClick={applyPreset} className="text-xs border rounded px-3 py-1.5 hover:bg-muted">
                Şablonu Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
