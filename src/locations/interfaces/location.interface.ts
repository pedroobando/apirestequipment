export interface ILocation {
  id: string;
  equipmentId: string;
  latitude: string;
  longitude: string;
  accuracy: number | null;
  source: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
