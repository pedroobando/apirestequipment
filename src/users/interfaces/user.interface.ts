export interface IUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  provider: string;
  providerId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
