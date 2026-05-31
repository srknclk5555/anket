interface UserListProps {
  users: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isAdmin: boolean;
    createdAt: string;
    lastLogin: string | null;
  }[];
  onUpdateRole: (userId: string, role: string) => void;
}

export function UserList({ users, onUpdateRole }: UserListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Kullanıcılar ({users.length})</h3>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ad</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-posta</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Son Giriş</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                <td className="px-4 py-3 text-foreground">
                  {user.name || "-"}
                  {user.isAdmin && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      user.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : user.role === "editor"
                        ? "bg-blue-100 text-blue-700"
                        : user.role === "viewer"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString("tr-TR")
                    : "Hiç giriş yapmamış"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => onUpdateRole(user.id, e.target.value)}
                    className="px-2 py-1 border border-input rounded text-xs bg-background"
                    disabled={user.isAdmin}
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="viewer">Görüntüleyici</option>
                    <option value="editor">Editör</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Kayıtlı kullanıcı yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
