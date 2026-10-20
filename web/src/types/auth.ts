export type UserRole = "USER" | "ADMIN";

export type UserStatus =
  | "PENDING_EMAIL"
  | "ACTIVE"
  | "BLOCKED";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface RegisterResponse {
  message?: string;
  user?: AuthUser;
}