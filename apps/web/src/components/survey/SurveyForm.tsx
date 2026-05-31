import { useState, useEffect, useRef } from "react";
import type { QuestionWithOptions, QuestionType } from "@gorunmeyen-lig/shared";
import { QuestionRenderer } from "./QuestionRenderer";

interface SurveyFormProps {
  // Flat list of all questions (kept for backward compatibility)
  questions: QuestionWithOptions[];
  // Optional sections data to render accordion UI
  sections?: { id: string; title?: string | null; description?: string | null; questions: QuestionWithOptions[] }[];
  onSubmit: (answers: Record<string, any>) => Promise<void>;
  isSubmitting: boolean;
}

export function SurveyForm({ questions, sections, onSubmit, isSubmitting }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formOpenedAt] = useState(Date.now());
  const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Detect completed sections and auto‑open the next one
  useEffect(() => {
    if (!sections) return;
    const newlyCompleted = new Set<string>();
    sections.forEach((section) => {
      const required = section.questions.filter((q) => q.isRequired);
      const allAnswered = required.every((q) => {
        const ans = answers[q.id];
        if (ans === undefined || ans === null || ans === "") return false;
        if (Array.isArray(ans) && ans.length === 0) return false;
        return true;
      });
      if (allAnswered) newlyCompleted.add(section.id);
    });
    setCompletedSections((prev) => {
      // only update if changed
      if (prev.size === newlyCompleted.size && [...prev].every((id) => newlyCompleted.has(id))) {
        return prev;
      }
      return newlyCompleted;
    });

    // Auto‑open first incomplete section
    const firstIncomplete = sections.find((sec) => !newlyCompleted.has(sec.id));
    if (firstIncomplete && !openSectionIds.includes(firstIncomplete.id)) {
      setOpenSectionIds((prev) => [...prev, firstIncomplete.id]);
      // scroll into view after state updates
      setTimeout(() => {
        const el = sectionRefs.current[firstIncomplete.id];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [answers, sections]);

  

  // Determine the list of questions to use for validation/progress/submission
  const flatQuestions: QuestionWithOptions[] = sections ? sections.flatMap((s) => s.questions) : questions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build answers array for API
    const answersArray: any[] = [];
    for (const [questionId, value] of Object.entries(answers)) {
      const question = flatQuestions.find((q) => q.id === questionId);
      if (!question) continue;

      const answer: any = { questionId };

      switch (question.questionType) {
        case "short_text":
        case "long_text":
        case "date":
          answer.textValue = value;
          break;

        case "yes_no":
          // "yes" veya "no" string olarak metin olarak sakla
          answer.textValue = value;
          break;

                case "single_choice":
        case "dropdown": {
          // Custom list kullanıyorsa item.id değil item.value (label) textValue olarak gönder
          const q = flatQuestions.find((fq) => fq.id === questionId);
          if (q?.customList && (q.customList.items?.length ?? 0) > 0) {
            const item = q.customList.items?.find((i) => i.id === value);
            answer.textValue = item ? item.value : value;
          } else {
            answer.optionId = value;
          }
          break;
        }

        case "multiple_choice": {
          // Custom list kullanıyorsa textValue, normal seçeneklerde optionId
          const qm = flatQuestions.find((fq) => fq.id === questionId);
          if (qm?.customList && (qm.customList.items?.length ?? 0) > 0) {
            for (const v of (value as string[])) {
              const item = qm.customList.items?.find((i) => i.id === v);
              answersArray.push({ questionId, textValue: item ? item.value : v });
            }
          } else {
            for (const v of (value as string[])) {
              answersArray.push({ questionId, optionId: v });
            }
          }
          continue;
        }

        case "linear_scale":
        case "rating":
        case "number":
          answer.numberValue = value;
          break;

        case "ranking": {
          const rankHasCustomList = question.customList && question.customList.items && question.customList.items.length > 0;
          for (let i = 0; i < (value as string[]).length; i++) {
            if (rankHasCustomList) {
              answersArray.push({ questionId, textValue: value[i], rankValue: i + 1 });
            } else {
              answersArray.push({ questionId, optionId: value[i], rankValue: i + 1 });
            }
          }
          continue;
        }

        case "matrix":
          // value: { [rowId]: colId } - JSON olarak sakla
          answer.textValue = JSON.stringify(value);
          break;

        default:
          answer.textValue = typeof value === "string" ? value : JSON.stringify(value);
      }

      answersArray.push(answer);
    }

    await onSubmit({
      turnstileToken: "placeholder", // Will be replaced with actual Turnstile token
      answers: answersArray,
      formOpenedAt,
      honeypot: "", // Hidden field — bots will fill this
    });
  };

  const requiredQuestions = flatQuestions.filter((q) => q.isRequired);
  const answeredRequired = requiredQuestions.filter((q) => {
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === "") return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  });

  const progress = requiredQuestions.length > 0 ? Math.round((answeredRequired.length / requiredQuestions.length) * 100) : 100;

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary rounded-full h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        İlerleme: {answeredRequired.length}/{requiredQuestions.length} zorunlu soru
      </p>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="honeypot"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Sections or flat questions */}
      {sections ? (
        sections.map((section) => (
          <div key={section.id} className="mb-3 sm:mb-4" ref={el => { sectionRefs.current[section.id] = el; }}>
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className={`w-full flex justify-between items-center p-3 sm:p-4 border border-border rounded-md text-left text-sm sm:text-base ${completedSections.has(section.id) ? "bg-green-200" : "bg-card"}`}
            >
              <span className="font-medium text-foreground">
                {section.title ?? "Bölüm"}
              </span>
              <span>{openSectionIds.includes(section.id) ? "▲" : "▼"}</span>
            </button>
            {openSectionIds.includes(section.id) && (
              <div className="mt-2 space-y-3 sm:space-y-4">
                {section.description && (
                  <p className="text-muted-foreground text-sm mb-2">
                    {section.description}
                  </p>
                )}
                {section.questions.map((question, index) => (
                  <div key={question.id} className="bg-card border border-border rounded-lg p-3 sm:p-6">
                    <QuestionRenderer
                      question={question}
                      index={index}
                      value={answers[question.id]}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        // Fallback to flat list if sections prop not provided
        questions.map((question, index) => (
          <div key={question.id} className="bg-card border border-border rounded-lg p-3 sm:p-6">
            <QuestionRenderer
              question={question}
              index={index}
              value={answers[question.id]}
              onChange={(value) => handleAnswerChange(question.id, value)}
            />
          </div>
        ))
      )}

      {/* Submit */}
      <div className="sticky bottom-0 bg-background pt-3 pb-4 sm:static sm:pt-0 sm:pb-0">
        <button
          type="submit"
          disabled={isSubmitting || progress < 100}
          className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isSubmitting ? "Gönderiliyor..." : "Anketi Gönder"}
        </button>
      </div>
    </form>
  );
}
