import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "../../../db";
import {
  adminLevelDefinitions,
  administrativeUnits,
  countries,
  userLocations,
  type AdministrativeUnit,
  type NewUserLocation,
  type UserLocation,
} from "../../../db/schema";

export class AddressRepository {
  async listCountries() {
    return db.select().from(countries).orderBy(asc(countries.name));
  }

  async getCountryById(countryId: string) {
    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);
    return country ?? null;
  }

  async listAdminLevelDefinitions(countryId: string) {
    return db
      .select()
      .from(adminLevelDefinitions)
      .where(eq(adminLevelDefinitions.countryId, countryId))
      .orderBy(asc(adminLevelDefinitions.level));
  }

  async listRootAdminUnits(countryId: string): Promise<AdministrativeUnit[]> {
    return db
      .select()
      .from(administrativeUnits)
      .where(
        and(
          eq(administrativeUnits.countryId, countryId),
          isNull(administrativeUnits.parentId),
        ),
      )
      .orderBy(asc(administrativeUnits.name));
  }

  async listAdminUnitChildren(parentId: string): Promise<AdministrativeUnit[]> {
    return db
      .select()
      .from(administrativeUnits)
      .where(eq(administrativeUnits.parentId, parentId))
      .orderBy(asc(administrativeUnits.name));
  }

  async getAdministrativeUnitById(
    adminUnitId: string,
  ): Promise<AdministrativeUnit | null> {
    const [unit] = await db
      .select()
      .from(administrativeUnits)
      .where(eq(administrativeUnits.id, adminUnitId))
      .limit(1);

    return unit ?? null;
  }

  async searchAdministrativeUnits(params: {
    q: string;
    countryId?: string;
    level?: number;
    type?: string;
    page: number;
    limit: number;
  }): Promise<{ units: AdministrativeUnit[]; total: number }> {
    const conditions = [ilike(administrativeUnits.name, `%${params.q}%`)];

    if (params.countryId) {
      conditions.push(eq(administrativeUnits.countryId, params.countryId));
    }

    if (typeof params.level === "number") {
      conditions.push(eq(administrativeUnits.level, params.level));
    }

    if (params.type) {
      conditions.push(eq(administrativeUnits.type, params.type));
    }

    const whereClause = and(...conditions);
    const offset = (params.page - 1) * params.limit;

    const [units, totalResult] = await Promise.all([
      db
        .select()
        .from(administrativeUnits)
        .where(whereClause)
        .orderBy(asc(administrativeUnits.level), asc(administrativeUnits.name))
        .limit(params.limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(administrativeUnits)
        .where(whereClause),
    ]);

    return {
      units,
      total: Number(totalResult[0]?.value ?? 0),
    };
  }

  async listUserLocationsByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ locations: UserLocation[]; total: number }> {
    const offset = (page - 1) * limit;

    const [locations, totalResult] = await Promise.all([
      db
        .select()
        .from(userLocations)
        .where(eq(userLocations.userId, userId))
        .orderBy(desc(userLocations.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(userLocations)
        .where(eq(userLocations.userId, userId)),
    ]);

    return {
      locations,
      total: Number(totalResult[0]?.value ?? 0),
    };
  }

  async getUserLocationById(
    userId: string,
    locationId: string,
  ): Promise<UserLocation | null> {
    const [location] = await db
      .select()
      .from(userLocations)
      .where(
        and(eq(userLocations.userId, userId), eq(userLocations.id, locationId)),
      )
      .limit(1);

    return location ?? null;
  }

  async createUserLocation(data: NewUserLocation): Promise<UserLocation> {
    const [location] = await db.insert(userLocations).values(data).returning();

    if (!location) {
      throw new Error("Failed to create user location");
    }

    return location;
  }

  async updateUserLocationById(
    userId: string,
    locationId: string,
    data: Partial<
      Pick<
        NewUserLocation,
        "adminUnitId" | "street" | "formattedAddress" | "latitude" | "longitude"
      >
    >,
  ): Promise<UserLocation | null> {
    const [location] = await db
      .update(userLocations)
      .set(data)
      .where(
        and(eq(userLocations.userId, userId), eq(userLocations.id, locationId)),
      )
      .returning();

    return location ?? null;
  }

  async deleteUserLocationById(
    userId: string,
    locationId: string,
  ): Promise<boolean> {
    const deleted = await db
      .delete(userLocations)
      .where(
        and(eq(userLocations.userId, userId), eq(userLocations.id, locationId)),
      )
      .returning({ id: userLocations.id });

    return deleted.length > 0;
  }
}
