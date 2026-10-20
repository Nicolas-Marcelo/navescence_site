export interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
}