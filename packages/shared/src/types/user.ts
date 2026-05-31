export type UserRole = "admin" | "editor" | "viewer" | "user";

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin: Date | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isAdmin: boolean;
}
