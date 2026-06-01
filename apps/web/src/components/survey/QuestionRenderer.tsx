import { useState, useRef, useEffect } from "react";
import type { QuestionWithOptions, QuestionType } from "@gorunmeyen-lig/shared";
import { useTheme } from "@/contexts/ThemeContext";

interface QuestionRendererProps {
  question: QuestionWithOptions;
  index: number;
  value: any;
  onChange: (value: any) => void;
}

export function QuestionRenderer({ question, index, value, onChange }: QuestionRendererProps) {
  const { theme } = useTheme();
  const isStadium = theme === "stadium";

  return (
    <div className={`space-y-3 rounded-2xl border p-4 transition ${isStadium ? "bg-slate-950/40 border-slate-700 shadow-[0_10px_60px_-45px_rgba(15,23,42,0.8)]" : ""}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-muted-foreground min-w-[24px]">{index + 1}.</span>
        <div className="flex-1">
          <label className="text-base font-medium text-foreground">
            {question.title}
            {question.isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          {question.description && (
            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
          )}
        </div>
      </div>

      <div className="ml-8">
        {renderInput(question, value, onChange, isStadium)}
      </div>
    </div>
  );
}

function renderInput(question: QuestionWithOptions, value: any, onChange: (v: any) => void, isStadium: boolean) {
  switch (question.questionType) {

    // ─── Kısa Metin ───────────────────────────────────────────────
    case "short_text":
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cevabınızı yazın..."
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          maxLength={500}
        />
      );

    // ─── Uzun Metin ───────────────────────────────────────────────
    case "long_text":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cevabınızı yazın..."
          rows={4}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          maxLength={5000}
        />
      );

    // ─── Tek Seçim (Radio) ────────────────────────────────────────
    case "single_choice": {
      const singleItems = question.customList?.items || [];
      const singleOptions = question.options || [];
      if (singleItems.length > 0) {
        return (
          <div className="space-y-2">
            {singleItems.map((item) => (
              <label key={item.id} className={`flex items-center gap-3 cursor-pointer group rounded-xl px-3 py-2 transition ${isStadium ? "bg-slate-950/5 border border-slate-700 hover:border-emerald-300" : ""}`}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={item.id}
                  checked={value === item.id}
                  onChange={() => onChange(item.id)}
                  className="w-4 h-4 text-primary focus:ring-ring"
                />
                <span className={`text-sm font-medium transition ${isStadium ? "text-slate-100 group-hover:text-emerald-200" : "text-foreground group-hover:text-primary"}`}>{item.value}</span>
              </label>
            ))}
          </div>
        );
      }
      if (singleOptions.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Bu soru için henüz seçenek eklenmemiş.</p>;
      }
      return (
        <div className="space-y-2">
          {singleOptions.map((option) => (
            <label key={option.id} className={`flex items-center gap-3 cursor-pointer group rounded-xl px-3 py-2 transition ${isStadium ? "bg-slate-950/5 border border-slate-700 hover:border-emerald-300" : ""}`}>
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                className="w-4 h-4 text-primary focus:ring-ring"
              />
              <span className={`text-sm font-medium transition ${isStadium ? "text-slate-100 group-hover:text-emerald-200" : "text-foreground group-hover:text-primary"}`}>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    // ─── Çoklu Seçim (Checkbox) ───────────────────────────────────
    case "multiple_choice": {
      const multiItems = question.customList?.items || [];
      const multiOptions = question.options || [];
      const selectedMulti: string[] = value || [];

      if (multiItems.length > 0) {
        return (
          <div className="space-y-2">
            {multiItems.map((item) => (
              <label key={item.id} className={`flex items-center gap-3 cursor-pointer group rounded-xl px-3 py-2 transition ${isStadium ? "bg-slate-950/5 border border-slate-700 hover:border-emerald-300" : ""}`}>
                <input
                  type="checkbox"
                  value={item.id}
                  checked={selectedMulti.includes(item.id)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...selectedMulti, item.id]
                      : selectedMulti.filter((v: string) => v !== item.id);
                    onChange(updated);
                  }}
                  className="w-4 h-4 text-primary focus:ring-ring rounded"
                />
                <span className={`text-sm font-medium transition ${isStadium ? "text-slate-100 group-hover:text-emerald-200" : "text-foreground group-hover:text-primary"}`}>{item.value}</span>
              </label>
            ))}
          </div>
        );
      }
      if (multiOptions.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Bu soru için henüz seçenek eklenmemiş.</p>;
      }
      return (
        <div className="space-y-2">
          {multiOptions.map((option) => (
            <label key={option.id} className={`flex items-center gap-3 cursor-pointer group rounded-xl px-3 py-2 transition ${isStadium ? "bg-slate-950/5 border border-slate-700 hover:border-emerald-300" : ""}`}>
              <input
                type="checkbox"
                value={option.id}
                checked={selectedMulti.includes(option.id)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...selectedMulti, option.id]
                    : selectedMulti.filter((id: string) => id !== option.id);
                  onChange(updated);
                }}
                className="w-4 h-4 text-primary focus:ring-ring rounded"
              />
              <span className={`text-sm font-medium transition ${isStadium ? "text-slate-100 group-hover:text-emerald-200" : "text-foreground group-hover:text-primary"}`}>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    // ─── Açılır Liste (Dropdown) ──────────────────────────────────
    case "dropdown": {
      const ddItems = question.customList?.items || [];
      const ddOptions = question.options || [];
      if (ddItems.length > 0) {
        return (
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring transition ${isStadium ? "border-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)] hover:border-emerald-300" : "border-input"}`}
          >
            <option value="">Seçiniz...</option>
            {ddItems.map((item) => (
              <option key={item.id} value={item.id}>{item.value}</option>
            ))}
          </select>
        );
      }
      if (ddOptions.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Bu soru için henüz seçenek eklenmemiş.</p>;
      }
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring transition ${isStadium ? "border-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)] hover:border-emerald-300" : "border-input"}`}
        >
          <option value="">Seçiniz...</option>
          {ddOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      );
    }

    // ─── Arama (Searchable) ───────────────────────────────────────
    case "searchable_dropdown":
    case "searchable_list":
      return (
        <SearchableSelect
          question={question}
          value={value}
          onChange={onChange}
          isMultiple={question.questionType === "searchable_list"}
        />
      );

    // ─── Doğrusal Ölçek ──────────────────────────────────────────
    case "linear_scale": {
      const min = question.scaleMin ?? 1;
      const max = question.scaleMax ?? 5;
      const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-center gap-2">
            {steps.map((num) => (
              <label
                key={num}
                className="flex flex-col items-center gap-1 cursor-pointer min-w-[3rem]"
              >
                <span className={`text-xs font-medium transition-colors ${value === num ? "text-primary" : "text-muted-foreground"}`}>
                  {num}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(num)}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-sm font-medium ${
                    value === num
                      ? isStadium
                        ? "border-emerald-400 bg-emerald-500 text-slate-950 shadow-[0_0_0_6px_rgba(16,185,129,0.1)]"
                        : "border-primary bg-primary text-primary-foreground"
                      : isStadium
                        ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-300 hover:bg-slate-800"
                        : "border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  }`}
                >
                  {value === num ? "✓" : ""}
                </button>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span className="break-words">{question.scaleMinLabel || ""}</span>
            <span className="break-words text-right">{question.scaleMaxLabel || ""}</span>
          </div>
          {value !== undefined && value !== null && (
            <p className="text-xs text-primary font-medium">Seçiminiz: {value}</p>
          )}
        </div>
      );
    }

    // ─── Yıldız Puanı ─────────────────────────────────────────────
    case "rating": {
      const ratingValue = value || 0;
      const maxStars = question.scaleMax || 5;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(ratingValue === star ? 0 : star)}
                className={`text-3xl transition-all hover:scale-110 ${
                  star <= ratingValue ? "text-yellow-400 drop-shadow-sm" : "text-gray-300 hover:text-yellow-200"
                }`}
                title={`${star} yıldız`}
              >
                ★
              </button>
            ))}
          </div>
          {ratingValue > 0 && (
            <p className="text-xs text-muted-foreground">
              {ratingValue} / {maxStars} yıldız seçildi
            </p>
          )}
        </div>
      );
    }

    // ─── Evet / Hayır ─────────────────────────────────────────────
    case "yes_no":
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(value === "yes" ? null : "yes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 transition-all font-medium text-sm ${
              value === "yes"
                ? isStadium
                  ? "border-emerald-400 bg-emerald-500 text-slate-950 shadow-[0_8px_30px_-20px_rgba(16,185,129,0.9)]"
                  : "border-green-500 bg-green-50 text-green-700"
                : isStadium
                  ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-300 hover:bg-slate-900"
                  : "border-border bg-background text-foreground hover:border-green-300 hover:bg-green-50/50"
            }`}
          >
            <span className="text-lg">✓</span> Evet
          </button>
          <button
            type="button"
            onClick={() => onChange(value === "no" ? null : "no")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 transition-all font-medium text-sm ${
              value === "no"
                ? isStadium
                  ? "border-rose-500 bg-rose-500/15 text-rose-100 shadow-[0_8px_30px_-20px_rgba(244,63,94,0.8)]"
                  : "border-red-500 bg-red-50 text-red-700"
                : isStadium
                  ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-rose-300 hover:bg-slate-900"
                  : "border-border bg-background text-foreground hover:border-red-300 hover:bg-red-50/50"
            }`}
          >
            <span className="text-lg">✗</span> Hayır
          </button>
        </div>
      );

    // ─── Tarih ────────────────────────────────────────────────────
    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring"
        />
      );

    // ─── Sayı ────────────────────────────────────────────────────
    case "number":
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value !== "" ? Number(e.target.value) : null)}
            placeholder="Sayı girin..."
            min={question.scaleMin ?? undefined}
            max={question.scaleMax ?? undefined}
            className="w-full max-w-xs px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring"
          />
          {(question.scaleMin !== null || question.scaleMax !== null) && (
            <span className="text-xs text-muted-foreground">
              ({question.scaleMin ?? "∞"} – {question.scaleMax ?? "∞"})
            </span>
          )}
        </div>
      );

    // ─── Sıralama ─────────────────────────────────────────────────
    case "ranking": {
      const rankItems = question.customList?.items || [];
      const rankOptions = question.options || [];
      const rankSource: { id: string; label: string }[] =
        rankItems.length > 0
          ? rankItems.map(i => ({ id: i.id, label: i.value }))
          : rankOptions.map(o => ({ id: o.id, label: o.label }));

      if (rankSource.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Bu soru için henüz seçenek eklenmemiş.</p>;
      }

      const ranked: string[] = value || rankSource.map((s) => s.id);
      return (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground mb-2">Öğeleri yukarı/aşağı butonlarıyla sıralayın.</p>
          {ranked.map((itemId, idx) => {
            const item = rankSource.find((s) => s.id === itemId);
            return (
              <div key={itemId} className="flex items-center gap-2 p-2.5 bg-secondary/50 border border-border rounded-lg">
                <span className="text-sm font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                <span className="text-sm text-foreground flex-1">{item?.label}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx > 0) {
                        const nr = [...ranked];
                        [nr[idx - 1], nr[idx]] = [nr[idx], nr[idx - 1]];
                        onChange(nr);
                      }
                    }}
                    disabled={idx === 0}
                    className="text-xs px-2 py-1 bg-background border border-border rounded hover:bg-muted disabled:opacity-30 transition-colors"
                    title="Yukarı taşı"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx < ranked.length - 1) {
                        const nr = [...ranked];
                        [nr[idx], nr[idx + 1]] = [nr[idx + 1], nr[idx]];
                        onChange(nr);
                      }
                    }}
                    disabled={idx === ranked.length - 1}
                    className="text-xs px-2 py-1 bg-background border border-border rounded hover:bg-muted disabled:opacity-30 transition-colors"
                    title="Aşağı taşı"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ─── Matris ────────────────────────────────────────────────────
    // Satırlar: label "ROW::..." ile başlar, Sütunlar: "COL::..." ile başlar
    case "matrix": {
      const allOpts = question.options || [];
      const rows = allOpts.filter(o => o.label.startsWith("ROW::")).map(o => ({
        id: o.id,
        label: o.label.replace("ROW::", ""),
      }));
      const cols = allOpts.filter(o => o.label.startsWith("COL::")).map(o => ({
        id: o.id,
        label: o.label.replace("COL::", ""),
      }));

      if (rows.length === 0 || cols.length === 0) {
        return (
          <p className="text-sm text-muted-foreground italic">
            Bu matris sorusu için henüz satır ve sütun eklenmemiş. Lütfen yönetici panelinden ekleyin.
          </p>
        );
      }

      // value: { [rowId]: colId }
      const matrixValue: Record<string, string> = value || {};

      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-medium min-w-[120px]"></th>
                {cols.map((col) => (
                  <th key={col.id} className="text-center p-2 text-foreground font-medium min-w-[80px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr
                  key={row.id}
                  className={rIdx % 2 === 0 ? "bg-muted/30" : "bg-background"}
                >
                  <td className="p-2 text-foreground font-medium">{row.label}</td>
                  {cols.map((col) => (
                    <td key={col.id} className="text-center p-2">
                      <input
                        type="radio"
                        name={`matrix-${question.id}-row-${row.id}`}
                        value={col.id}
                        checked={matrixValue[row.id] === col.id}
                        onChange={() =>
                          onChange({ ...matrixValue, [row.id]: col.id })
                        }
                        className="w-4 h-4 text-primary focus:ring-ring cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring"
        />
      );
  }
}

// ═══════════════════════════════════════
// Searchable Select (Dropdown / List)
// ═══════════════════════════════════════

function SearchableSelect({
  question,
  value,
  onChange,
  isMultiple,
}: {
  question: QuestionWithOptions;
  value: any;
  onChange: (val: any) => void;
  isMultiple: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = question.customList?.items || [];
  const filtered = items.filter((i) => i.value.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedValues: string[] = isMultiple ? (value || []) : (value ? [value] : []);

  const toggleSelection = (val: string) => {
    if (isMultiple) {
      if (selectedValues.includes(val)) {
        onChange(selectedValues.filter((v) => v !== val));
      } else {
        onChange([...selectedValues, val]);
      }
    } else {
      onChange(val);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const removeValue = (val: string) => {
    if (isMultiple) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange("");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedValues.map((val) => {
            const item = items.find((i) => i.id === val);
            const display = item ? item.value : val;
            return (
              <div key={val} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                <span>{display}</span>
                <button
                  type="button"
                  onClick={() => removeValue(val)}
                  className="hover:text-primary/70 font-bold ml-1"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(!value || isMultiple) && (
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={question.customList?.name ? `${question.customList.name} içinde ara...` : "Ara..."}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring"
        />
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-md shadow-md">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Sonuç bulunamadı.</div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedValues.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-muted ${isSelected ? "bg-primary/5 font-medium text-primary" : ""}`}
                >
                  {item.value}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
