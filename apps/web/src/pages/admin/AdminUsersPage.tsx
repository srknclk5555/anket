import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { UserList } from "@/components/admin/UserList";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.get<{ users: UserItem[] }>("/api/admin/users");
        setUsers(data.users);
      } catch {
        // Use empty array
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role, isAdmin: role === "admin" } : u
        )
      );
    } catch {
      alert("Rol güncellenemedi");
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
      <h2 className="text-2xl font-bold text-foreground">Kullanıcı Yönetimi</h2>
      <UserList users={users} onUpdateRole={handleUpdateRole} />
    </div>
  );
}
