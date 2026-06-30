export interface IOperator {
  id: string;
  userId: string;
  licenseNumber: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
