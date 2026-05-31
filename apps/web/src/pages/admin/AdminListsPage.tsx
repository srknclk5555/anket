import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function AdminListsPage() {
  const [lists, setLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);

  // Form states
  const [newListTitle, setNewListTitle] = useState("");
  const [bulkItemsText, setBulkItemsText] = useState("");

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ lists: any[] }>("/api/admin/custom-lists");
      setLists(res.lists);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    try {
      await api.post("/api/admin/custom-lists", { name: newListTitle });
      setNewListTitle("");
      setIsCreating(false);
      loadLists();
    } catch (err) {
      alert("Liste oluşturulurken hata oluştu");
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Bu listeyi silmek istediğinize emin misiniz? (Bağlı sorular varsa sorun çıkabilir)")) return;
    try {
      await api.delete(`/api/admin/custom-lists/${id}`);
      loadLists();
    } catch (err) {
      alert("Hata oluştu");
    }
  };

  const loadListDetails = async (id: string) => {
    try {
      const res = await api.get<{ list: any }>(`/api/admin/custom-lists/${id}`);
      setSelectedList(res.list);
    } catch (err) {
      alert("Liste detayları yüklenemedi");
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedList || !bulkItemsText.trim()) return;
    const items = bulkItemsText.split("\n").map(x => x.trim()).filter(x => x.length > 0);
    if (items.length === 0) return;

    try {
      const res = await api.post<{ list: any }>(`/api/admin/custom-lists/${selectedList.id}/bulk-items`, { items });
      setSelectedList(res.list);
      setBulkItemsText("");
    } catch (err) {
      alert("Ekleme sırasında hata oluştu");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedList) return;
    try {
      await api.delete(`/api/admin/custom-lists/${selectedList.id}/items/${itemId}`);
      // reload details
      loadListDetails(selectedList.id);
    } catch (err) {
      alert("Hata oluştu");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Özel Listeler</h2>
          <p className="text-muted-foreground">
            Arama yapılabilen dropdown veya çoklu seçimli TextBox'lar için veri kaynakları (Örn: Şehirler, Takımlar).
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
        >
          + Yeni Liste
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map(list => (
          <div key={list.id} className="bg-card border border-border rounded-lg p-5 flex flex-col">
            <h3 className="font-semibold text-lg mb-2">{list.name}</h3>
            <p className="text-xs text-muted-foreground mb-4 flex-1">
              {new Date(list.createdAt).toLocaleDateString("tr-TR")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadListDetails(list.id)}
                className="flex-1 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Elemanları Yönet
              </button>
              <button
                onClick={() => handleDeleteList(list.id)}
                className="py-2 px-3 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="text-center p-12 border border-dashed border-border rounded-lg text-muted-foreground">
          Henüz hiç özel liste eklenmemiş.
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Liste Oluştur</h3>
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Liste Adı (Örn: Süper Lig Takımları)"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                İptal
              </button>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEMS MODAL */}
      {selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-bold">{selectedList.name}</h3>
              <button
                onClick={() => setSelectedList(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                Kapat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sol: Toplu Ekleme */}
              <div className="flex flex-col">
                <h4 className="font-semibold mb-3">Toplu Veri Ekle (Her satıra bir tane)</h4>
                <textarea
                  value={bulkItemsText}
                  onChange={(e) => setBulkItemsText(e.target.value)}
                  placeholder="Fenerbahçe&#10;Galatasaray&#10;Beşiktaş..."
                  className="flex-1 min-h-[200px] w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mb-4 resize-y text-sm"
                />
                <button
                  onClick={handleBulkAdd}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                >
                  Listeye Ekle
                </button>
              </div>

              {/* Sağ: Mevcut Elemanlar */}
              <div className="flex flex-col h-[50vh] md:h-auto">
                <h4 className="font-semibold mb-3">Mevcut Elemanlar ({selectedList.items?.length || 0})</h4>
                <div className="flex-1 overflow-y-auto border border-border rounded-md bg-muted/10 p-2 space-y-1">
                  {selectedList.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-background border border-border rounded text-sm">
                      <span>{item.value}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive/80 font-bold px-2"
                        title="Sil"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(!selectedList.items || selectedList.items.length === 0) && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Henüz eleman yok. Yandan ekleyebilirsiniz.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
