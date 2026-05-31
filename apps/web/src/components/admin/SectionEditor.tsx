import { useState } from "react";
import type { SectionWithQuestions, QuestionType } from "@gorunmeyen-lig/shared";
import { QuestionManager } from "./QuestionManager";

interface SectionEditorProps {
  sections: SectionWithQuestions[];
  onAddSection: (title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, title: string) => void;
  onAddQuestion: (sectionId: string, data: { questionType: QuestionType; title: string }) => void;
  onUpdateQuestion: (questionId: string, data: Partial<any>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (sectionId: string, questionIds: string[]) => void;
}

export function SectionEditor({
  sections,
  onAddSection,
  onDeleteSection,
  onUpdateSection,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onReorderQuestions,
}: SectionEditorProps) {
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    onAddSection(newSectionTitle.trim());
    setNewSectionTitle("");
    setAddingSection(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Bölümler</h3>
        <button
          onClick={() => setAddingSection(true)}
          className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + Bölüm Ekle
        </button>
      </div>

      {addingSection && (
        <div className="flex items-center gap-2 p-3 border border-primary/30 bg-primary/5 rounded-lg">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="Bölüm başlığı..."
            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
          />
          <button
            onClick={handleAddSection}
            className="text-sm px-3 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Kaydet
          </button>
          <button
            onClick={() => setAddingSection(false)}
            className="text-sm px-3 py-2 border border-border rounded-md"
          >
            İptal
          </button>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.id} className="border border-border rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer"
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                {expandedSections.has(section.id) ? "▼" : "▶"}
              </span>
              {editingSectionId === section.id ? (
                <input
                  type="text"
                  value={editSectionTitle}
                  onChange={(e) => setEditSectionTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 border border-input rounded bg-background text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onUpdateSection(section.id, editSectionTitle);
                      setEditingSectionId(null);
                    }
                  }}
                />
              ) : (
                <h4 className="font-medium text-foreground">{section.title}</h4>
              )}
              <span className="text-xs text-muted-foreground">
                ({section.questions.length} soru)
              </span>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {editingSectionId === section.id ? (
                <>
                  <button
                    onClick={() => {
                      onUpdateSection(section.id, editSectionTitle);
                      setEditingSectionId(null);
                    }}
                    className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingSectionId(null)}
                    className="text-xs px-2 py-1 border border-border rounded"
                  >
                    İptal
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setEditSectionTitle(section.title);
                    }}
                    className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Bu bölümü ve tüm sorularını silmek istediğinizden emin misiniz?")) {
                        onDeleteSection(section.id);
                      }
                    }}
                    className="text-xs px-2 py-1 border border-destructive/30 text-destructive rounded hover:bg-destructive/10"
                  >
                    Sil
                  </button>
                </>
              )}
            </div>
          </div>

          {expandedSections.has(section.id) && (
            <div className="p-4">
              <QuestionManager
                questions={section.questions}
                sectionId={section.id}
                onAddQuestion={onAddQuestion}
                onUpdateQuestion={onUpdateQuestion}
                onDeleteQuestion={onDeleteQuestion}
                onReorderQuestions={onReorderQuestions}
              />
            </div>
          )}
        </div>
      ))}

      {sections.length === 0 && !addingSection && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Henüz bölüm eklenmemiş. "Bölüm Ekle" butonuna tıklayın.
        </p>
      )}
    </div>
  );
}
