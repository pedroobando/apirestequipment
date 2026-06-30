import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql, and, lte, gte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { locations } from '../schema/locations.schema';
import { CreateLocationDto } from '../dto/create-location.dto';
import { RadiusQueryDto } from '../dto/radius-query.dto';
import { ILocation } from '../interfaces/location.interface';
import { ILocationsRepository, DbClient } from '../ports/locations.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class DrizzleLocationsRepository implements ILocationsRepository {
  private readonly logger = new Logger(DrizzleLocationsRepository.name);

  private readonly selectLocation = {
    id: locations.id,
    equipmentId: locations.equipmentId,
    latitude: locations.latitude,
    longitude: locations.longitude,
    accuracy: locations.accuracy,
    source: locations.source,
    recordedAt: locations.recordedAt,
    createdAt: locations.createdAt,
    updatedAt: locations.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async create(
    data: CreateLocationDto,
    client: DbClient = this.db,
  ): Promise<ILocation> {
    const [result, error] = await tryCatch(
      client
        .insert(locations)
        .values({
          equipmentId: data.equipmentId,
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          accuracy: data.accuracy,
          source: data.source ?? 'manual',
        })
        .returning(this.selectLocation),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async findByEquipmentId(
    equipmentId: string,
    limit = 50,
  ): Promise<ILocation[]> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectLocation)
        .from(locations)
        .where(eq(locations.equipmentId, equipmentId))
        .orderBy(sql`${locations.recordedAt} desc`)
        .limit(limit),
    );

    if (error || !result) {
      this.logger.error(`findByEquipmentId - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result;
  }

  async findWithinRadius(query: RadiusQueryDto): Promise<ILocation[]> {
    const latDelta = (query.radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
    const lngDelta =
      (query.radiusKm /
        (EARTH_RADIUS_KM * Math.cos((query.latitude * Math.PI) / 180))) *
      (180 / Math.PI);

    const minLat = query.latitude - latDelta;
    const maxLat = query.latitude + latDelta;
    const minLng = query.longitude - lngDelta;
    const maxLng = query.longitude + lngDelta;

    const [result, error] = await tryCatch(
      this.db
        .select(this.selectLocation)
        .from(locations)
        .where(
          and(
            gte(locations.latitude, minLat.toString()),
            lte(locations.latitude, maxLat.toString()),
            gte(locations.longitude, minLng.toString()),
            lte(locations.longitude, maxLng.toString()),
          ),
        )
        .limit(query.limit ?? 50),
    );

    if (error || !result) {
      this.logger.error(`findWithinRadius - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result;
  }

  async getLatestByEquipmentId(equipmentId: string): Promise<ILocation | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectLocation)
        .from(locations)
        .where(eq(locations.equipmentId, equipmentId))
        .orderBy(sql`${locations.recordedAt} desc`)
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`getLatestByEquipmentId - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }
}
