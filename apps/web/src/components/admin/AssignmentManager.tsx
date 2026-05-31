import { useState } from "react";

interface Assignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "editor" | "viewer";
  canEdit: boolean;
  canView: boolean;
  canExport: boolean;
}

interface AssignmentManagerProps {
  surveyId: string;
  assignments: Assignment[];
  users: { id: string; email: string; name: string | null }[];
  onAddAssignment: (data: { userId: string; role: "editor" | "viewer"; canEdit: boolean; canView: boolean; canExport: boolean }) => void;
  onUpdateAssignment: (assignmentId: string, data: Partial<Assignment>) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}

export function AssignmentManager({
  surveyId,
  assignments,
  users,
  onAddAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
}: AssignmentManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("viewer");

  const availableUsers = users.filter(
    (u) => !assignments.some((a) => a.userId === u.id)
  );

  const handleAdd = () => {
    if (!selectedUserId) return;
    onAddAssignment({
      userId: selectedUserId,
      role: selectedRole,
      canEdit: selectedRole === "editor",
      canView: true,
      canExport: selectedRole === "editor",
    });
    setSelectedUserId("");
    setSelectedRole("viewer");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Yetkili Kullanıcılar</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + Yetki Ver
        </button>
      </div>

      {showAddForm && (
        <div className="p-4 border border-primary/30 bg-primary/5 rounded-lg space-y-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
          >
            <option value="">Kullanıcı seçin...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as "editor" | "viewer")}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value="viewer">Görüntüleyici</option>
              <option value="editor">Editör</option>
            </select>
            <button onClick={handleAdd} className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Ekle
            </button>
            <button onClick={() => setShowAddForm(false)} className="text-sm px-4 py-2 border border-border rounded-md">
              İptal
            </button>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Henüz yetkili kullanıcı atanmamış.
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {assignment.userName || assignment.userEmail}
                </p>
                <p className="text-xs text-muted-foreground">{assignment.userEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={assignment.role}
                  onChange={(e) =>
                    onUpdateAssignment(assignment.id, {
                      role: e.target.value as "editor" | "viewer",
                    })
                  }
                  className="px-2 py-1 border border-input rounded text-xs bg-background"
                >
                  <option value="viewer">Görüntüleyici</option>
                  <option value="editor">Editör</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={assignment.canEdit}
                      onChange={(e) =>
                        onUpdateAssignment(assignment.id, { canEdit: e.target.checked })
                      }
                      className="w-3 h-3"
                    />
                    Düzenle
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={assignment.canExport}
                      onChange={(e) =>
                        onUpdateAssignment(assignment.id, { canExport: e.target.checked })
                      }
                      className="w-3 h-3"
                    />
                    Dışa Aktar
                  </label>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Bu yetkiyi kaldırmak istediğinizden emin misiniz?")) {
                      onRemoveAssignment(assignment.id);
                    }
                  }}
                  className="text-xs px-2 py-1 border border-destructive/30 text-destructive rounded hover:bg-destructive/10"
                >
                  Kaldır
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
