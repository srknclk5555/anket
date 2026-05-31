import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { SurveyWithDetails, QuestionType } from "@gorunmeyen-lig/shared";
import { api } from "@/lib/api";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { AssignmentManager } from "@/components/admin/AssignmentManager";

export default function AdminSurveyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showAssignments, setShowAssignments] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const data = await api.get<{ survey: SurveyWithDetails }>(`/api/admin/surveys/${id}`);
        setSurvey(data.survey);
      } catch {
        alert("Anket yüklenemedi");
        navigate("/admin/surveys");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchSurvey();
  }, [id, navigate]);

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || !id) return;
    try {
      await api.patch(`/api/admin/surveys/${id}`, {
        title: editTitle.trim(),
        description: editDescription,
      });
      setSurvey((prev) =>
        prev ? { ...prev, title: editTitle.trim(), description: editDescription } : prev
      );
      setEditingTitle(false);
    } catch {
      alert("Başlık güncellenemedi");
    }
  };

  const handleAddSection = async (title: string) => {
    if (!id) return;
    try {
      const data = await api.post<{ section: any }>(`/api/admin/surveys/${id}/sections`, { title });
      setSurvey((prev) =>
        prev
          ? {
              ...prev,
              sections: [
                ...prev.sections,
                { ...data.section, questions: [] },
              ],
            }
          : prev
      );
    } catch {
      alert("Bölüm eklenemedi");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!id) return;
    try {
      await api.delete(`/api/admin/surveys/${id}/sections/${sectionId}`);
      setSurvey((prev) =>
        prev
          ? { ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }
          : prev
      );
    } catch {
      alert("Bölüm silinemedi");
    }
  };

  const handleUpdateSection = async (sectionId: string, title: string) => {
    if (!id) return;
    try {
      await api.patch(`/api/admin/surveys/${id}/sections/${sectionId}`, { title });
      setSurvey((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === sectionId ? { ...s, title } : s
              ),
            }
          : prev
      );
    } catch {
      alert("Bölüm güncellenemedi");
    }
  };

  const handleAddQuestion = async (
    sectionId: string,
    data: {
      questionType: QuestionType;
      title: string;
      customListId?: string;
      scaleMin?: number;
      scaleMax?: number;
      scaleMinLabel?: string;
      scaleMaxLabel?: string;
    }
  ) => {
    if (!id) return;
    try {
      const result = await api.post<{ question: any }>(
        `/api/admin/sections/${sectionId}/questions`,
        data
      );
      setSurvey((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === sectionId
                  ? { ...s, questions: [...s.questions, { ...result.question, options: [], customList: null }] }
                  : s
              ),
            }
          : prev
      );
    } catch {
      alert("Soru eklenemedi");
    }
  };

  const handleUpdateQuestion = async (questionId: string, data: Partial<any>) => {
    if (!id) return;
    try {
      await api.patch(`/api/admin/questions/${questionId}`, data);
      setSurvey((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) => ({
                ...s,
                questions: s.questions.map((q) =>
                  q.id === questionId ? { ...q, ...data } : q
                ),
              })),
            }
          : prev
      );
    } catch {
      alert("Soru güncellenemedi");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!id) return;
    try {
      await api.delete(`/api/admin/questions/${questionId}`);
      setSurvey((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) => ({
                ...s,
                questions: s.questions.filter((q) => q.id !== questionId),
              })),
            }
          : prev
      );
    } catch {
      alert("Soru silinemedi");
    }
  };

  const handleReorderQuestions = async (sectionId: string, questionIds: string[]) => {
    if (!id) return;
    try {
      await api.put(`/api/admin/sections/${sectionId}/questions/reorder`, {
        items: questionIds.map((id, orderIndex) => ({ id, orderIndex })),
      });
      setSurvey((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) => {
                if (s.id !== sectionId) return s;
                const reordered = questionIds
                  .map((qid) => s.questions.find((q) => q.id === qid))
                  .filter(Boolean) as typeof s.questions;
                return { ...s, questions: reordered };
              }),
            }
          : prev
      );
    } catch {
      alert("Soru sıralaması güncellenemedi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Anket bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/surveys")}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Geri
        </button>

        {editingTitle ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 text-2xl font-bold px-2 py-1 border border-input rounded bg-background"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Açıklama..."
              className="flex-1 px-2 py-1 border border-input rounded bg-background text-sm"
              rows={2}
            />
            <button
              onClick={handleUpdateTitle}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
            >
              Kaydet
            </button>
            <button
              onClick={() => setEditingTitle(false)}
              className="px-3 py-1 border border-border rounded text-sm"
            >
              İptal
            </button>
          </div>
        ) : (
          <div
            className="flex-1 cursor-pointer"
            onClick={() => {
              setEditTitle(survey.title);
              setEditDescription(survey.description || "");
              setEditingTitle(true);
            }}
          >
            <h1 className="text-2xl font-bold text-foreground">{survey.title}</h1>
            {survey.description && (
              <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
            )}
          </div>
        )}

        <button
          onClick={() => setShowAssignments(!showAssignments)}
          className="text-sm px-3 py-1.5 border border-border rounded-md hover:bg-muted"
        >
          Yetkiler
        </button>
      </div>

      {/* Assignments panel */}
      {showAssignments && (
        <AssignmentManager
          surveyId={survey.id}
          assignments={[]}
          users={[]}
          onAddAssignment={async (data) => {
            try {
              await api.post(`/api/admin/surveys/${survey.id}/assignments`, data);
            } catch {
              alert("Yetki atanamadı");
            }
          }}
          onUpdateAssignment={async (assignmentId, data) => {
            try {
              await api.patch(`/api/admin/surveys/${survey.id}/assignments/${assignmentId}`, data);
            } catch {
              alert("Yetki güncellenemedi");
            }
          }}
          onRemoveAssignment={async (assignmentId) => {
            try {
              await api.delete(`/api/admin/surveys/${survey.id}/assignments/${assignmentId}`);
            } catch {
              alert("Yetki kaldırılamadı");
            }
          }}
        />
      )}

      {/* Section editor */}
      <SectionEditor
        sections={survey.sections}
        onAddSection={handleAddSection}
        onDeleteSection={handleDeleteSection}
        onUpdateSection={handleUpdateSection}
        onAddQuestion={handleAddQuestion}
        onUpdateQuestion={handleUpdateQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        onReorderQuestions={handleReorderQuestions}
      />
    </div>
  );
}
