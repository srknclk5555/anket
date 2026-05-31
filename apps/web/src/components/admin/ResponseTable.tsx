import { useState } from "react";

interface ResponseRow {
  id: string;
  userEmail: string;
  submittedAt: string;
  answers: { questionTitle: string; value: string }[];
}

interface ResponseTableProps {
  responses: ResponseRow[];
  surveyTitle: string;
  onExportCSV: () => void;
}

export function ResponseTable({ responses, surveyTitle, onExportCSV }: ResponseTableProps) {
  const [sortField, setSortField] = useState<"submittedAt" | "userEmail">("submittedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterEmail, setFilterEmail] = useState("");

  const [selectedResponse, setSelectedResponse] = useState<ResponseRow | null>(null);

  const filtered = responses.filter((r) =>
    r.userEmail.toLowerCase().includes(filterEmail.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (field: "submittedAt" | "userEmail") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Cevaplar ({responses.length})
        </h3>
        <button
          onClick={onExportCSV}
          className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          CSV İndir
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
          placeholder="E-posta ile filtrele..."
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm flex-1 max-w-xs"
        />
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th
                className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("userEmail")}
              >
                E-posta {sortField === "userEmail" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("submittedAt")}
              >
                Tarih {sortField === "submittedAt" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Cevap Sayısı
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((response) => (
              <tr 
                key={response.id} 
                className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedResponse(response)}
                title="Detayları görmek için tıklayın"
              >
                <td className="px-4 py-3 text-foreground font-medium">{response.userEmail}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(response.submittedAt).toLocaleString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                    {response.answers.length} cevap
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Henüz cevap yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div 
            className="bg-card border border-border shadow-xl rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{selectedResponse.userEmail}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedResponse.submittedAt).toLocaleString("tr-TR")} tarihinde gönderildi
                </p>
              </div>
              <button 
                onClick={() => setSelectedResponse(null)} 
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-md transition-colors"
              >
                Kapat
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {selectedResponse.answers.map((a, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="font-medium text-foreground mb-2 text-sm">{a.questionTitle}</div>
                  <div className="text-muted-foreground bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">{a.value}</div>
                </div>
              ))}
              {selectedResponse.answers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Soruya cevap verilmemiş.</p>
              )}
            </div>
          </div>
          {/* Overlay click to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setSelectedResponse(null)}
          />
        </div>
      )}
    </div>
  );
}
