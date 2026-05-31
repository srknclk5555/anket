import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { ResponseTable } from "@/components/admin/ResponseTable";
import { AdvancedStats } from "@/components/admin/AdvancedStats";
import { DetailedReport } from "@/components/admin/DetailedReport";
import { X, Search, Trophy, BarChart3, TrendingUp, Users, MessageSquare } from "lucide-react";

export default function AdminResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"table" | "stats" | "detailed" | "advanced">("table");
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [responsesData, statsData] = await Promise.all([
          api.get<{ responses: any[] }>(`/api/admin/surveys/${id}/responses?limit=10000`),
          api.get<{ stats: any }>(`/api/admin/surveys/${id}/stats`),
        ]);
        setResponses(responsesData.responses);
        setStats(statsData.stats);
      } catch {
        // Use empty data
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleExportCSV = async () => {
    if (!id) return;
    try {
      const blob = await fetch(`/api/admin/surveys/${id}/export-csv`).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `anket-cevaplari-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("CSV indirilemedi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/surveys")}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Geri
        </button>
        <h2 className="text-2xl font-bold text-foreground">Cevaplar</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("table")}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "table"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cevap Tablosu
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "stats"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          İstatistikler
        </button>
        <button
          onClick={() => setActiveTab("detailed")}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "detailed"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Detaylı Rapor
        </button>
        <button
          onClick={() => setActiveTab("advanced")}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            activeTab === "advanced"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Gelişmiş Raporlar
        </button>
      </div>

      {activeTab === "table" ? (
        <ResponseTable
          responses={responses.map((r: any) => ({
            id: r.id,
            userEmail: r.user?.email || r.userEmail || r.userId,
            submittedAt: r.submittedAt,
            answers: (r.answers || []).map((a: any) => ({
              questionTitle: a.question?.title || a.questionTitle || a.questionId,
              value:
                a.textValue ||
                a.numberValue?.toString() ||
                a.option?.label ||
                a.optionLabel ||
                a.optionId ||
                "-",
            })),
          }))}
          surveyTitle="Anket"
          onExportCSV={handleExportCSV}
        />
      ) : activeTab === "stats" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats?.questionStats ? (
            stats.questionStats.map((qs: any) => (
              <div 
                key={qs.questionId} 
                onClick={() => {
                  setSelectedQuestion(qs);
                  setQuestionSearchQuery("");
                }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base line-clamp-2">
                      {qs.questionTitle}
                    </h3>
                    <span className="text-[10px] whitespace-nowrap bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Detaylı Rapor →
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Tip: <span className="capitalize">{qs.questionType.replace("_", " ")}</span> | Cevap sayısı: {qs.responseCount}
                  </p>
                </div>

                <div>
                  {qs.averageValue !== undefined && (
                    <div className="flex items-center gap-3 bg-secondary/35 p-3 rounded-lg border border-border/40">
                      <span className="text-xs text-muted-foreground">Ortalama Değer:</span>
                      <span className="text-xl font-black text-primary">
                        {qs.averageValue.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {qs.optionCounts && (
                    <div className="space-y-2.5">
                      {/* Show top 3 options sorted high-to-low in preview */}
                      {[...qs.optionCounts]
                        .sort((a: any, b: any) => b.count - a.count)
                        .slice(0, 3)
                        .map((oc: any) => {
                          const percent = qs.responseCount > 0 ? (oc.count / qs.responseCount) * 100 : 0;
                          return (
                            <div key={oc.label} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground font-medium truncate max-w-[180px]">{oc.label}</span>
                                <span className="text-muted-foreground font-semibold">%{percent.toFixed(0)} ({oc.count})</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-primary rounded-full h-1.5 transition-all"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      {qs.optionCounts.length > 3 && (
                        <p className="text-[11px] text-primary font-semibold text-right pt-1">
                          +{qs.optionCounts.length - 3} seçenek daha...
                        </p>
                      )}
                    </div>
                  )}

                  {/* For text questions, show response preview */}
                  {!qs.optionCounts && qs.averageValue === undefined && (
                    <div className="text-xs text-muted-foreground bg-secondary/30 border border-border/40 p-3 rounded-lg flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span>Metin cevaplarını listelemek için tıklayın</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8 col-span-2">
              İstatistik verisi yok
            </p>
          )}
        </div>
      ) : activeTab === "detailed" ? (
        <DetailedReport
          responses={responses.map((r: any) => ({
            id: r.id,
            userEmail: r.user?.email || r.userEmail || r.userId,
            submittedAt: r.submittedAt,
            answers: (r.answers || []).map((a: any) => ({
              questionTitle: a.question?.title || a.questionTitle || a.questionId,
              value:
                a.textValue ||
                a.numberValue?.toString() ||
                a.option?.label ||
                a.optionLabel ||
                a.optionId ||
                "-",
            })),
          }))}
        />
      ) : (
        <AdvancedStats
          responses={responses.map((r: any) => ({
            id: r.id,
            userEmail: r.user?.email || r.userEmail || r.userId,
            submittedAt: r.submittedAt,
            answers: (r.answers || []).map((a: any) => ({
              questionTitle: a.question?.title || a.questionTitle || a.questionId,
              value:
                a.textValue ||
                a.numberValue?.toString() ||
                a.option?.label ||
                a.optionLabel ||
                a.optionId ||
                "-",
            })),
          }))}
        />
      )}

      {/* QUESTION DETAIL MODAL */}
      {selectedQuestion && (() => {
        const qs = selectedQuestion;
        
        // 1. Gather all raw responses for this specific question
        const rawAnswers = responses
          .map((r: any) => {
            const ans = r.answers.find((a: any) => 
              a.question?.title === qs.questionTitle || 
              a.questionTitle === qs.questionTitle ||
              a.questionId === qs.questionId
            );
            return {
              userEmail: r.user?.email || r.userEmail || r.userId,
              submittedAt: r.submittedAt,
              value: ans ? (
                ans.textValue ||
                ans.numberValue?.toString() ||
                ans.option?.label ||
                ans.optionLabel ||
                ans.optionId ||
                ""
              ) : ""
            };
          })
          .filter((a) => a.value && a.value !== "-");

        // 2. Sort optionCounts from highest to lowest
        const sortedOptions = qs.optionCounts
          ? [...qs.optionCounts].sort((a: any, b: any) => b.count - a.count)
          : [];

        // 3. For numeric/scale answers, calculate complete distribution
        const numericDistribution = !qs.optionCounts && qs.averageValue !== undefined
          ? (() => {
              const counts: Record<string, number> = {};
              rawAnswers.forEach((a) => {
                counts[a.value] = (counts[a.value] || 0) + 1;
              });
              return Object.entries(counts)
                .map(([val, cnt]) => ({ value: val, count: cnt }))
                .sort((a, b) => Number(b.value) - Number(a.value)); // sorted by score desc
            })()
          : [];

        // 4. For text questions, group identical answers and sort by frequency
        const groupedTextAnswers = !qs.optionCounts && qs.averageValue === undefined
          ? (() => {
              const counts: Record<string, number> = {};
              rawAnswers.forEach((a) => {
                const val = a.value.trim();
                if (val) {
                  counts[val] = (counts[val] || 0) + 1;
                }
              });
              const total = rawAnswers.length;
              return Object.entries(counts)
                .map(([label, count]) => ({
                  label,
                  count,
                  percentage: total > 0 ? (count / total) * 100 : 0
                }))
                .sort((a: any, b: any) => b.count - a.count);
            })()
          : [];

        // 5. Search filters
        const filteredOptions = sortedOptions.filter((o: any) => 
          o.label.toLowerCase().includes(questionSearchQuery.toLowerCase())
        );

        const filteredGroupedTextAnswers = groupedTextAnswers.filter((item: any) =>
          item.label.toLowerCase().includes(questionSearchQuery.toLowerCase())
        );

        // Styling helpers for progress bar gradients
        const getProgressColor = (label: string) => {
          const name = label.toLowerCase();
          if (name.includes("galatasaray") || name === "gs") return "from-amber-500 to-red-600";
          if (name.includes("fenerbahçe") || name === "fb") return "from-yellow-400 to-blue-600";
          if (name.includes("beşiktaş") || name === "bjk") return "from-slate-700 to-slate-900";
          if (name.includes("trabzon") || name === "ts") return "from-red-700 to-sky-600";
          if (name.includes("samsun")) return "from-red-500 to-red-700";
          return "from-primary to-indigo-600";
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in-50 duration-200">
            <div 
              className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button Top Right */}
              <button 
                onClick={() => setSelectedQuestion(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-xl transition-all"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="p-6 border-b border-border/80 bg-muted/20">
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  Soru Raporu ve İstatistikleri
                </span>
                <h3 className="font-extrabold text-xl text-foreground pr-8 leading-snug">
                  {qs.questionTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="bg-secondary px-2.5 py-0.5 rounded-full font-medium">
                    Tip: <span className="capitalize">{qs.questionType.replace("_", " ")}</span>
                  </span>
                  <span>•</span>
                  <span>Toplam Cevap: <strong>{qs.responseCount} kişi</strong></span>
                  {qs.averageValue !== undefined && (
                    <>
                      <span>•</span>
                      <span>Genel Ortalama: <strong className="text-primary">{qs.averageValue.toFixed(2)}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Filter / Search Bar */}
              <div className="px-6 py-3 border-b border-border/55 bg-background flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="Seçeneklerde ve cevaplarda ara..."
                    className="w-full bg-secondary/50 border border-input rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                  />
                </div>
                {questionSearchQuery && (
                  <button 
                    onClick={() => setQuestionSearchQuery("")}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Temizle
                  </button>
                )}
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* 1. Choice Based Questions (Ordered high to low) */}
                {qs.optionCounts && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Seçenek (Çoktan Aza Sıralı)</span>
                      <span>Oy Sayısı / Yüzde</span>
                    </div>

                    <div className="space-y-3.5">
                      {filteredOptions.map((oc: any, index: number) => {
                        const percent = qs.responseCount > 0 ? (oc.count / qs.responseCount) * 100 : 0;
                        return (
                          <div 
                            key={oc.label} 
                            className="bg-secondary/20 hover:bg-secondary/40 p-4 rounded-xl border border-border/40 transition-all flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black border ${
                                  index === 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-background text-muted-foreground border-border"
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="font-bold text-foreground text-sm">{oc.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">{oc.count} oy</span>
                                <span className="text-xs font-black text-foreground bg-background border border-border px-2 py-0.5 rounded-md">
                                  %{percent.toFixed(1)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-secondary/80 rounded-full h-3 overflow-hidden border border-border/40 p-[2px]">
                              <div
                                className={`bg-gradient-to-r rounded-full h-1.5 transition-all duration-700 ease-out ${getProgressColor(oc.label)}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {filteredOptions.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">Aramanızla eşleşen seçenek bulunamadı.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Numeric / Rating Questions */}
                {!qs.optionCounts && qs.averageValue !== undefined && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Glowing circular card */}
                    <div className="bg-card border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                      <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
                      <Trophy className="w-8 h-8 text-primary mb-3" />
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ortalama Puan</span>
                      <h4 className="text-4xl font-black text-primary mt-1">{qs.averageValue.toFixed(2)}</h4>
                      <p className="text-[10px] text-muted-foreground mt-2">Toplam {qs.responseCount} katılım üzerinden hesaplanmıştır</p>
                    </div>

                    {/* Numeric distribution */}
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border/50 pb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Puan Dağılımı (Yüksekten Düşüğe)
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {numericDistribution.map((item: any) => {
                          const percent = qs.responseCount > 0 ? (item.count / qs.responseCount) * 100 : 0;
                          return (
                            <div key={item.value} className="flex items-center justify-between text-xs gap-3">
                              <span className="font-bold text-foreground w-12 text-right bg-secondary px-2 py-1 rounded border border-border">
                                {item.value} Puan
                              </span>
                              <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                                <div 
                                  className="bg-primary rounded-full h-3" 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground w-16 text-right font-medium">
                                %{percent.toFixed(0)} ({item.count})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Text / Textual Questions (Grouped and Sorted by Percentage, No Emails) */}
                {!qs.optionCounts && qs.averageValue === undefined && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Cevaplar (Çoktan Aza Sıralı)</span>
                      <span>Kişi Sayısı / Yüzde</span>
                    </div>

                    <div className="space-y-3.5">
                      {filteredGroupedTextAnswers.map((item: any, index: number) => {
                        return (
                          <div 
                            key={item.label} 
                            className="bg-secondary/20 hover:bg-secondary/40 p-4 rounded-xl border border-border/40 transition-all flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black border ${
                                  index === 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-background text-muted-foreground border-border"
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="font-bold text-foreground text-sm whitespace-pre-wrap">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">{item.count} kişi</span>
                                <span className="text-xs font-black text-foreground bg-background border border-border px-2 py-0.5 rounded-md">
                                  %{item.percentage.toFixed(1)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-secondary/80 rounded-full h-3 overflow-hidden border border-border/40 p-[2px]">
                              <div
                                className={`bg-gradient-to-r rounded-full h-1.5 transition-all duration-700 ease-out ${getProgressColor(item.label)}`}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {filteredGroupedTextAnswers.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">Aramanızla eşleşen cevap bulunamadı.</p>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                <span>Filtrelenen sonuç: <strong>{qs.optionCounts ? filteredOptions.length : filteredGroupedTextAnswers.length}</strong></span>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
            {/* Backdrop click close */}
            <div className="absolute inset-0 -z-10" onClick={() => setSelectedQuestion(null)} />
          </div>
        );
      })()}
    </div>
  );
}
