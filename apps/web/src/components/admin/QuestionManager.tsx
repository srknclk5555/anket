import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { QuestionWithOptions, QuestionType, QuestionOption } from "@gorunmeyen-lig/shared";
import { QUESTION_TYPE_LABELS } from "@gorunmeyen-lig/shared";

// Seçenek editörü gerektiren soru tipleri
const OPTION_BASED_TYPES: QuestionType[] = [
  "single_choice",
  "multiple_choice",
  "dropdown",
  "ranking",
  "searchable_dropdown",
  "searchable_list",
];

// Özel Liste bağlanabilecek soru tipleri
const CUSTOM_LIST_TYPES: QuestionType[] = [
  "searchable_dropdown",
  "searchable_list",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "ranking",
];

// Ölçek ayarı gerektiren soru tipleri
const SCALE_TYPES: QuestionType[] = ["linear_scale", "rating", "number"];

// Matris tipi
const MATRIX_TYPE: QuestionType = "matrix";

interface QuestionManagerProps {
  questions: QuestionWithOptions[];
  sectionId: string;
  onAddQuestion: (sectionId: string, data: {
    questionType: QuestionType;
    title: string;
    customListId?: string;
    scaleMin?: number;
    scaleMax?: number;
    scaleMinLabel?: string;
    scaleMaxLabel?: string;
  }) => void;
  onUpdateQuestion: (questionId: string, data: Partial<QuestionWithOptions>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (sectionId: string, questionIds: string[]) => void;
}

export function QuestionManager({
  questions,
  sectionId,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onReorderQuestions,
}: QuestionManagerProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<QuestionType>("short_text");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [newCustomListId, setNewCustomListId] = useState<string>("");
  const [newScaleMin, setNewScaleMin] = useState(1);
  const [newScaleMax, setNewScaleMax] = useState(5);
  const [newScaleMinLabel, setNewScaleMinLabel] = useState("");
  const [newScaleMaxLabel, setNewScaleMaxLabel] = useState("");
  const [customLists, setCustomLists] = useState<any[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedOptionsId, setExpandedOptionsId] = useState<string | null>(null);
  const [localOptions, setLocalOptions] = useState<Record<string, QuestionOption[]>>({});
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [addingOptionForId, setAddingOptionForId] = useState<string | null>(null);
  // Matris için satır/sütun
  const [newMatrixLabel, setNewMatrixLabel] = useState("");
  const [matrixAddType, setMatrixAddType] = useState<"ROW" | "COL">("ROW");

  useEffect(() => {
    const opts: Record<string, QuestionOption[]> = {};
    questions.forEach((q) => { opts[q.id] = q.options || []; });
    setLocalOptions(opts);
  }, [questions]);

  useEffect(() => {
    api.get<{ lists: any[] }>("/api/admin/custom-lists")
      .then(res => setCustomLists(res.lists))
      .catch(console.error);
  }, []);

  const resetNewForm = () => {
    setNewTitle("");
    setNewType("short_text");
    setNewCustomListId("");
    setNewScaleMin(1);
    setNewScaleMax(5);
    setNewScaleMinLabel("");
    setNewScaleMaxLabel("");
    setAddingNew(false);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const data: Parameters<typeof onAddQuestion>[1] = {
      questionType: newType,
      title: newTitle.trim(),
    };
    if (CUSTOM_LIST_TYPES.includes(newType) && newCustomListId) {
      data.customListId = newCustomListId;
    }
    if (SCALE_TYPES.includes(newType)) {
      data.scaleMin = newScaleMin;
      data.scaleMax = newScaleMax;
      if (newType === "linear_scale") {
        data.scaleMinLabel = newScaleMinLabel;
        data.scaleMaxLabel = newScaleMaxLabel;
      }
    }
    onAddQuestion(sectionId, data);
    resetNewForm();
  };

  const handleStartEdit = (q: QuestionWithOptions) => {
    setEditingId(q.id);
    setEditTitle(q.title);
  };

  const handleSaveEdit = (questionId: string) => {
    if (!editTitle.trim()) return;
    onUpdateQuestion(questionId, { title: editTitle.trim() } as Partial<QuestionWithOptions>);
    setEditingId(null);
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...questions];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onReorderQuestions(sectionId, reordered.map((q) => q.id));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleAddOption = async (questionId: string, labelOverride?: string) => {
    const label = labelOverride ?? newOptionLabel;
    if (!label.trim()) return;
    try {
      const res = await api.post<{ option: QuestionOption }>(`/api/admin/questions/${questionId}/options`, {
        label: label.trim(),
        isOther: false,
      });
      setLocalOptions(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), res.option],
      }));
      if (!labelOverride) setNewOptionLabel("");
    } catch (err) {
      console.error("Seçenek eklenemedi", err);
    }
  };

  const handleDeleteOption = async (questionId: string, optionId: string) => {
    try {
      await api.delete(`/api/admin/options/${optionId}`);
      setLocalOptions(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter(o => o.id !== optionId),
      }));
    } catch (err) {
      console.error("Seçenek silinemedi", err);
    }
  };

  const handleAddMatrixItem = async (questionId: string) => {
    if (!newMatrixLabel.trim()) return;
    const prefix = matrixAddType === "ROW" ? "ROW::" : "COL::";
    await handleAddOption(questionId, prefix + newMatrixLabel.trim());
    setNewMatrixLabel("");
  };

  const toggleOptionsPanel = (questionId: string) => {
    setExpandedOptionsId(prev => (prev === questionId ? null : questionId));
    setNewOptionLabel("");
    setNewMatrixLabel("");
    setAddingOptionForId(null);
    setMatrixAddType("ROW");
  };

  const getScaleSummary = (q: QuestionWithOptions) => {
    if (q.questionType === "rating") return `${q.scaleMax ?? 5} yıldız`;
    if (q.questionType === "linear_scale") {
      return `${q.scaleMin ?? 1}–${q.scaleMax ?? 5}`;
    }
    if (q.questionType === "number") {
      if (q.scaleMin !== null || q.scaleMax !== null) {
        return `${q.scaleMin ?? "∞"}–${q.scaleMax ?? "∞"}`;
      }
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Sorular ({questions.length})
        </h3>
        <button
          onClick={() => setAddingNew(true)}
          className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + Soru Ekle
        </button>
      </div>

      {/* ── Yeni Soru Formu ── */}
      {addingNew && (
        <div className="p-4 border border-primary/30 bg-primary/5 rounded-lg space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Soru başlığı..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={newType}
              onChange={(e) => { setNewType(e.target.value as QuestionType); setNewCustomListId(""); }}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Özel Liste seçimi */}
            {CUSTOM_LIST_TYPES.includes(newType) && (
              <select
                value={newCustomListId}
                onChange={(e) => setNewCustomListId(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              >
                <option value="">-- Özel Liste (İsteğe Bağlı) --</option>
                {customLists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Ölçek ayarları */}
          {SCALE_TYPES.includes(newType) && (
            <div className="flex flex-wrap gap-3 p-3 bg-background border border-border rounded-md">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  {newType === "rating" ? "Yıldız sayısı:" : "Min:"}
                </label>
                {newType === "rating" ? (
                  <input
                    type="number" min={1} max={10}
                    value={newScaleMax}
                    onChange={(e) => setNewScaleMax(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-input rounded text-sm bg-background"
                  />
                ) : (
                  <input
                    type="number"
                    value={newScaleMin}
                    onChange={(e) => setNewScaleMin(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-input rounded text-sm bg-background"
                  />
                )}
              </div>
              {newType !== "rating" && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Max:</label>
                  <input
                    type="number"
                    value={newScaleMax}
                    onChange={(e) => setNewScaleMax(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-input rounded text-sm bg-background"
                  />
                </div>
              )}
              {newType === "linear_scale" && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Min etiketi:</label>
                    <input
                      type="text"
                      value={newScaleMinLabel}
                      onChange={(e) => setNewScaleMinLabel(e.target.value)}
                      placeholder="Hiç"
                      className="w-24 px-2 py-1 border border-input rounded text-sm bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Max etiketi:</label>
                    <input
                      type="text"
                      value={newScaleMaxLabel}
                      onChange={(e) => setNewScaleMaxLabel(e.target.value)}
                      placeholder="Çok"
                      className="w-24 px-2 py-1 border border-input rounded text-sm bg-background"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Matris bilgisi */}
          {newType === "matrix" && (
            <p className="text-xs text-muted-foreground p-2 bg-amber-50 border border-amber-200 rounded">
              ℹ️ Matris sorusunu ekledikten sonra "Seçenekler" panelinden satır ve sütunları ekleyebilirsiniz.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Kaydet
            </button>
            <button
              onClick={resetNewForm}
              className="text-sm px-4 py-2 border border-border rounded-md hover:bg-muted"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Soru Listesi ── */}
      {questions.map((question, index) => {
        const isOptionBased = OPTION_BASED_TYPES.includes(question.questionType);
        const isMatrix = question.questionType === MATRIX_TYPE;
        const isCustomListType = CUSTOM_LIST_TYPES.includes(question.questionType);
        const isScaleType = SCALE_TYPES.includes(question.questionType);
        const hasCustomList = !!question.customList;
        const options = localOptions[question.id] || [];
        const isExpanded = expandedOptionsId === question.id;
        const scaleSummary = getScaleSummary(question);

        // Matris için satır/sütun ayrımı
        const matrixRows = options.filter(o => o.label.startsWith("ROW::")).map(o => ({ ...o, display: o.label.replace("ROW::", "") }));
        const matrixCols = options.filter(o => o.label.startsWith("COL::")).map(o => ({ ...o, display: o.label.replace("COL::", "") }));

        return (
          <div
            key={question.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            className={`border rounded-lg transition-colors cursor-grab active:cursor-grabbing ${
              dragOverIndex === index
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            {/* ── Soru Başlık Satırı ── */}
            <div className="flex items-start gap-3 p-4">
              <span className="text-sm font-medium text-muted-foreground mt-0.5 select-none">⠿</span>

              <div className="flex-1 min-w-0">
                {editingId === question.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-input rounded bg-background text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(question.id)}
                    />
                    <button onClick={() => handleSaveEdit(question.id)} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Kaydet</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border border-border rounded">İptal</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{question.title}</span>
                      {question.isRequired && (
                        <span className="text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">Zorunlu</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {QUESTION_TYPE_LABELS[question.questionType]}
                      {scaleSummary && <span className="ml-1 text-blue-500">• {scaleSummary}</span>}
                      {hasCustomList && <span className="ml-1 text-primary">({question.customList!.name})</span>}
                      {isOptionBased && !hasCustomList && (
                        <span className="ml-1 text-amber-500">• {options.length} seçenek</span>
                      )}
                      {isMatrix && (
                        <span className="ml-1 text-amber-500">• {matrixRows.length} satır / {matrixCols.length} sütun</span>
                      )}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onUpdateQuestion(question.id, { isRequired: !question.isRequired } as Partial<QuestionWithOptions>)}
                  className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                  title={question.isRequired ? "İsteğe bağlı yap" : "Zorunlu yap"}
                >
                  {question.isRequired ? "Z" : "İ"}
                </button>
                <button onClick={() => handleStartEdit(question)} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">
                  Düzenle
                </button>
                {(isOptionBased || isMatrix) && (
                  <button
                    onClick={() => toggleOptionsPanel(question.id)}
                    className={`text-xs px-2 py-1 border rounded transition-colors ${
                      isExpanded ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {isMatrix ? "Satır/Sütun" : "Seçenekler"} {isExpanded ? "▲" : "▼"}
                  </button>
                )}
                {isScaleType && (
                  <button
                    onClick={() => toggleOptionsPanel(question.id)}
                    className={`text-xs px-2 py-1 border rounded transition-colors ${
                      isExpanded ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    Ayarlar {isExpanded ? "▲" : "▼"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Bu soruyu silmek istediğinizden emin misiniz?")) {
                      onDeleteQuestion(question.id);
                    }
                  }}
                  className="text-xs px-2 py-1 border border-destructive/30 text-destructive rounded hover:bg-destructive/10"
                >
                  Sil
                </button>
              </div>
            </div>

            {/* ── Genişletilmiş Panel ── */}
            {isExpanded && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-muted/30">

                {/* ─ ÖLÇEK AYARLARI ─ */}
                {isScaleType && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Ölçek Ayarları</p>
                    <div className="flex flex-wrap gap-3">
                      {question.questionType === "rating" ? (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Yıldız sayısı:</label>
                          <select
                            defaultValue={question.scaleMax ?? 5}
                            onChange={async (e) => {
                              const v = Number(e.target.value);
                              await api.patch(`/api/admin/questions/${question.id}`, { scaleMax: v });
                              onUpdateQuestion(question.id, { scaleMax: v } as any);
                            }}
                            className="px-2 py-1 border border-input rounded text-sm bg-background"
                          >
                            {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <option key={n} value={n}>{n} ★</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Min:</label>
                            <input
                              type="number"
                              defaultValue={question.scaleMin ?? 1}
                              onBlur={async (e) => {
                                const v = Number(e.target.value);
                                await api.patch(`/api/admin/questions/${question.id}`, { scaleMin: v });
                                onUpdateQuestion(question.id, { scaleMin: v } as any);
                              }}
                              className="w-16 px-2 py-1 border border-input rounded text-sm bg-background"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Max:</label>
                            <input
                              type="number"
                              defaultValue={question.scaleMax ?? 5}
                              onBlur={async (e) => {
                                const v = Number(e.target.value);
                                await api.patch(`/api/admin/questions/${question.id}`, { scaleMax: v });
                                onUpdateQuestion(question.id, { scaleMax: v } as any);
                              }}
                              className="w-16 px-2 py-1 border border-input rounded text-sm bg-background"
                            />
                          </div>
                          {question.questionType === "linear_scale" && (
                            <>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground">Min etiketi:</label>
                                <input
                                  type="text"
                                  defaultValue={question.scaleMinLabel ?? ""}
                                  onBlur={async (e) => {
                                    await api.patch(`/api/admin/questions/${question.id}`, { scaleMinLabel: e.target.value });
                                    onUpdateQuestion(question.id, { scaleMinLabel: e.target.value } as any);
                                  }}
                                  placeholder="Hiç"
                                  className="w-24 px-2 py-1 border border-input rounded text-sm bg-background"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground">Max etiketi:</label>
                                <input
                                  type="text"
                                  defaultValue={question.scaleMaxLabel ?? ""}
                                  onBlur={async (e) => {
                                    await api.patch(`/api/admin/questions/${question.id}`, { scaleMaxLabel: e.target.value });
                                    onUpdateQuestion(question.id, { scaleMaxLabel: e.target.value } as any);
                                  }}
                                  placeholder="Çok"
                                  className="w-24 px-2 py-1 border border-input rounded text-sm bg-background"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ─ MATRİS SATIR/SÜTUN EDİTÖRÜ ─ */}
                {isMatrix && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Satırlar */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Satırlar</p>
                        {matrixRows.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">Henüz satır eklenmedi.</p>
                        )}
                        <div className="space-y-1">
                          {matrixRows.map((row, i) => (
                            <div key={row.id} className="flex items-center gap-1 px-2 py-1 bg-background border border-border rounded text-xs">
                              <span className="text-muted-foreground w-4">{i + 1}.</span>
                              <span className="flex-1">{row.display}</span>
                              <button onClick={() => handleDeleteOption(question.id, row.id)} className="text-destructive hover:opacity-70">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Sütunlar */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Sütunlar</p>
                        {matrixCols.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">Henüz sütun eklenmedi.</p>
                        )}
                        <div className="space-y-1">
                          {matrixCols.map((col, i) => (
                            <div key={col.id} className="flex items-center gap-1 px-2 py-1 bg-background border border-border rounded text-xs">
                              <span className="text-muted-foreground w-4">{i + 1}.</span>
                              <span className="flex-1">{col.display}</span>
                              <button onClick={() => handleDeleteOption(question.id, col.id)} className="text-destructive hover:opacity-70">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ekleme formu */}
                    <div className="flex items-center gap-2">
                      <select
                        value={matrixAddType}
                        onChange={(e) => setMatrixAddType(e.target.value as "ROW" | "COL")}
                        className="px-2 py-1.5 border border-input rounded text-xs bg-background text-foreground"
                      >
                        <option value="ROW">Satır</option>
                        <option value="COL">Sütun</option>
                      </select>
                      <input
                        type="text"
                        value={newMatrixLabel}
                        onChange={(e) => setNewMatrixLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddMatrixItem(question.id)}
                        placeholder={`Yeni ${matrixAddType === "ROW" ? "satır" : "sütun"} ekle...`}
                        className="flex-1 px-2 py-1.5 text-sm border border-input rounded bg-background text-foreground focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={() => handleAddMatrixItem(question.id)}
                        className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded whitespace-nowrap"
                      >
                        + Ekle
                      </button>
                    </div>
                  </div>
                )}

                {/* ─ SEÇENEK EDİTÖRÜ (normal tipler) ─ */}
                {isOptionBased && (
                  <>
                    {/* Özel Liste Bağlama */}
                    {isCustomListType && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Özel Liste:</label>
                        <select
                          defaultValue={question.customListId || ""}
                          onChange={async (e) => {
                            const val = e.target.value || null;
                            await api.patch(`/api/admin/questions/${question.id}`, { customListId: val });
                            onUpdateQuestion(question.id, { customListId: val } as any);
                          }}
                          className="flex-1 px-2 py-1.5 border border-input rounded-md bg-background text-foreground text-xs"
                        >
                          <option value="">-- Bağlı liste yok (Manuel seçenekler) --</option>
                          {customLists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!hasCustomList && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium">Manuel Seçenekler</p>
                        {options.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">Henüz seçenek eklenmemiş.</p>
                        )}
                        <div className="space-y-1">
                          {options.map((opt, i) => (
                            <div key={opt.id} className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md">
                              <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                              <span className="text-sm text-foreground flex-1">{opt.label}</span>
                              {opt.isOther && <span className="text-xs px-1 bg-muted rounded text-muted-foreground">Diğer</span>}
                              <button onClick={() => handleDeleteOption(question.id, opt.id)} className="text-xs text-destructive hover:text-destructive/70 px-1">✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={addingOptionForId === question.id ? newOptionLabel : ""}
                            onFocus={() => setAddingOptionForId(question.id)}
                            onChange={(e) => setNewOptionLabel(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddOption(question.id)}
                            placeholder="Yeni seçenek ekle..."
                            className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background text-foreground focus:ring-1 focus:ring-ring"
                          />
                          <button
                            onClick={() => handleAddOption(question.id)}
                            className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md whitespace-nowrap"
                          >
                            + Ekle
                          </button>
                        </div>
                      </>
                    )}

                    {hasCustomList && (
                      <p className="text-xs text-muted-foreground italic">
                        Seçenekler "<span className="text-primary font-medium">{question.customList!.name}</span>" listesinden geliyor.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {questions.length === 0 && !addingNew && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Henüz soru eklenmemiş. "Soru Ekle" butonuna tıklayın.
        </p>
      )}
    </div>
  );
}
