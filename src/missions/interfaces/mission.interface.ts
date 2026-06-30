export interface IMission {
  id: string;
  userIdCreator: string;
  equipmentId: string;
  operatorId: string | null;
  title: string;
  description: string | null;
  origin: string | null;
  destination: string | null;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
