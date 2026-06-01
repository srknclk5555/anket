import { useState, useEffect, useRef } from "react";
import type { QuestionWithOptions, QuestionType } from "@gorunmeyen-lig/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { QuestionRenderer } from "./QuestionRenderer";
import { GoalAnimation } from "./GoalAnimation";

interface SurveyFormProps {
  // Flat list of all questions (kept for backward compatibility)
  questions: QuestionWithOptions[];
  // Optional sections data to render accordion UI
  sections?: { id: string; title?: string | null; description?: string | null; questions: QuestionWithOptions[] }[];
  onSubmit: (answers: Record<string, any>) => Promise<void>;
  isSubmitting: boolean;
  onSuccess?: () => void;
  onProgressChange?: (progress: number, answered: number, total: number) => void;
}

export function SurveyForm({ questions, sections, onSubmit, isSubmitting, onSuccess, onProgressChange }: SurveyFormProps) {
  const { theme } = useTheme();
  const isStadium = theme === "stadium";
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formOpenedAt] = useState(Date.now());
  const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isGoal, setIsGoal] = useState(false);
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
      // scroll into view after state updates, offset by sticky headers
      setTimeout(() => {
        const el = sectionRefs.current[firstIncomplete.id];
        if (el) {
          // Compute bottom edge of all sticky headers (navbar + survey header).
          // Fallback to 144px if not available.
          const stickyEls = document.querySelectorAll('.sticky');
          let headerBottom = 144;
          if (stickyEls.length > 0) {
            headerBottom = Array.from(stickyEls).reduce((acc, el) => {
              const rect = el.getBoundingClientRect();
              return Math.max(acc, rect.bottom);
            }, 0);
          }

          // Calculate target scroll position so the section sits below the headers.
          const target = Math.max(0, window.scrollY + el.getBoundingClientRect().top - headerBottom - 8);
          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      }, 0);
    }
  }, [answers, sections]);

  

  // Determine the list of questions to use for validation/progress/submission
  const flatQuestions: QuestionWithOptions[] = sections ? sections.flatMap((s) => s.questions) : questions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoal || isSubmitting) return;

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
          answer.optionId = value;
          break;
        }

        case "multiple_choice": {
          for (const v of (value as string[])) {
            answersArray.push({ questionId, optionId: v });
          }
          continue;
        }

        case "linear_scale":
        case "rating":
        case "number":
          answer.numberValue = value;
          break;

        case "ranking": {
          for (let i = 0; i < (value as string[]).length; i++) {
            answersArray.push({ questionId, optionId: value[i], rankValue: i + 1 });
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

    try {
      await onSubmit({
        turnstileToken: "placeholder", // Will be replaced with actual Turnstile token
        answers: answersArray,
        formOpenedAt,
        honeypot: "", // Hidden field — bots will fill this
      });
      setIsGoal(true);
      window.setTimeout(() => {
        onSuccess?.();
      }, 2500);
    } catch {
      // Let parent show errors if submission fails.
    }
  };

  const requiredQuestions = flatQuestions.filter((q) => q.isRequired);
  const answeredRequired = requiredQuestions.filter((q) => {
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === "") return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  });

  const progress = requiredQuestions.length > 0 ? Math.round((answeredRequired.length / requiredQuestions.length) * 100) : 100;

  useEffect(() => {
    onProgressChange?.(progress, answeredRequired.length, requiredQuestions.length);
  }, [progress, answeredRequired.length, requiredQuestions.length, onProgressChange]);

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  return (
    <>
      <GoalAnimation isOpen={isGoal} isStadium={isStadium} />
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8 pt-4">
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
              className={`w-full flex justify-between items-center p-3 sm:p-4 border rounded-md text-left text-sm sm:text-base transition-all ${theme === "stadium" ? "border-[#334155] bg-gradient-to-r from-[#12263b] via-[#1e3a5f] to-[#0c2033] text-white shadow-[0_8px_25px_-18px_rgba(0,0,0,0.8)] hover:border-green-400" : completedSections.has(section.id) ? "border-border bg-green-200" : "border-border bg-card"}`}
            >
              <span className="flex items-center gap-3">
                {theme === "stadium" && (
                  <span className="inline-flex h-10 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-lime-500" />
                )}
                <span className="font-medium text-foreground">
                  {theme === "stadium" ? `⚽ ${section.title ?? "Bölüm"}` : section.title ?? "Bölüm"}
                </span>
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
                  <div key={question.id} className={`rounded-lg p-3 sm:p-6 transition-all ${theme === "stadium" ? "bg-[#152237] border border-[#1e3a5f] shadow-[0_0_0_1px_rgba(22,163,74,0.15)] hover:shadow-[0_0_0_15px_rgba(22,163,74,0.14)]" : "bg-card border border-border"}`}>
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
          <div key={question.id} className={`rounded-lg p-3 sm:p-6 transition-all ${theme === "stadium" ? "bg-[#152237] border border-[#1e3a5f] shadow-[0_0_0_1px_rgba(22,163,74,0.15)] hover:shadow-[0_0_0_15px_rgba(22,163,74,0.14)]" : "bg-card border border-border"}`}>
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
      <div className="bg-background pt-3 pb-4 sm:pt-0 sm:pb-0">
        <button
          type="submit"
          disabled={isSubmitting || isGoal || progress < 100}
          className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isGoal ? "Gol atılıyor..." : isSubmitting ? "Gönderiliyor..." : "Anketi Gönder"}
        </button>
      </div>
    </form>
  </>
  );
}
