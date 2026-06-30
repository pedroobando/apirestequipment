import { IMission } from '../interfaces/mission.interface';

export class MissionResponseDto {
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

  constructor(mission: IMission) {
    this.id = mission.id;
    this.userIdCreator = mission.userIdCreator;
    this.equipmentId = mission.equipmentId;
    this.operatorId = mission.operatorId;
    this.title = mission.title;
    this.description = mission.description;
    this.origin = mission.origin;
    this.destination = mission.destination;
    this.status = mission.status;
    this.startedAt = mission.startedAt;
    this.completedAt = mission.completedAt;
    this.createdAt = mission.createdAt;
    this.updatedAt = mission.updatedAt;
  }
}
