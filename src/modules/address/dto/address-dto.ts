import { z } from "zod";

const pagination = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const countryRes = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameEn: z.string().nullable(),
  isoCode: z.string(),
  createdAt: z.string().datetime(),
});

export const adminLevelDefRes = z.object({
  id: z.string().uuid(),
  countryId: z.string().uuid(),
  level: z.number().int().nonnegative(),
  type: z.string(),
  nameLocal: z.string(),
  nameEn: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const adminUnitRes = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameEn: z.string().nullable(),
  type: z.string(),
  level: z.number().int().nonnegative(),
  countryId: z.string().uuid(),
  adminLevelDefinitionId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  code: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const unitsRootReq = z.object({
  countryId: z.string().uuid(),
});

export const unitSearchReq = pagination.extend({
  q: z.string().trim().min(1),
  countryId: z.string().uuid().optional(),
  level: z.coerce.number().int().nonnegative().optional(),
  type: z.string().trim().optional(),
});

export const userLocationsReq = pagination;

export const createUserLocationReq = z.object({
  adminUnitId: z.string().uuid(),
  street: z.string().trim().min(1),
  formattedAddress: z.string().trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateUserLocationReq = z
  .object({
    adminUnitId: z.string().uuid().optional(),
    street: z.string().trim().min(1).optional(),
    formattedAddress: z.string().trim().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .superRefine((value, ctx) => {
    const hasAnyUpdateField =
      value.adminUnitId !== undefined ||
      value.street !== undefined ||
      value.formattedAddress !== undefined ||
      value.latitude !== undefined ||
      value.longitude !== undefined;

    if (!hasAnyUpdateField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field must be provided",
      });
    }
  });

export const geoNearbyReq = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive(),
  type: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const reverseGeocodingReq = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  countryId: z.string().uuid().optional(),
});

export const spatialClustersReq = z.object({
  bbox: z.string().min(3),
  zoom: z.coerce.number().int().min(1).max(22),
  type: z.string().optional(),
});

export const userLocationRes = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  adminUnitId: z.string().uuid().nullable(),
  street: z.string().nullable(),
  formattedAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
});

export const listCountriesRes = z.object({
  countries: z.array(countryRes),
});

export const getCountryRes = z.object({
  country: countryRes,
});

export const listAdminLevelsRes = z.object({
  levels: z.array(adminLevelDefRes),
});

export const listAdminUnitsRes = z.object({
  units: z.array(adminUnitRes),
});

export const getAdminUnitPathRes = z.object({
  path: z.array(adminUnitRes),
  breadcrumb: z.string(),
});

export const listUserLocationsRes = z.object({
  locations: z.array(userLocationRes),
});

export const createUserLocationRes = z.object({
  location: userLocationRes,
});

export const updateUserLocationRes = z.object({
  location: userLocationRes,
});

export const deleteUserLocationRes = z.object({
  id: z.string().uuid(),
  deleted: z.literal(true),
});

export type UnitsRootReq = z.infer<typeof unitsRootReq>;
export type UnitSearchReq = z.infer<typeof unitSearchReq>;
export type UserLocationsReq = z.infer<typeof userLocationsReq>;
export type CreateUserLocationReq = z.infer<typeof createUserLocationReq>;
export type UpdateUserLocationReq = z.infer<typeof updateUserLocationReq>;
export type GeoNearbyReq = z.infer<typeof geoNearbyReq>;
export type ReverseGeocodingReq = z.infer<typeof reverseGeocodingReq>;
export type SpatialClustersReq = z.infer<typeof spatialClustersReq>;

export type ListCountriesRes = z.infer<typeof listCountriesRes>;
export type GetCountryRes = z.infer<typeof getCountryRes>;
export type ListAdminLevelsRes = z.infer<typeof listAdminLevelsRes>;
export type ListAdminUnitsRes = z.infer<typeof listAdminUnitsRes>;
export type GetAdminUnitPathRes = z.infer<typeof getAdminUnitPathRes>;
export type ListUserLocationsRes = z.infer<typeof listUserLocationsRes>;
export type CreateUserLocationRes = z.infer<typeof createUserLocationRes>;
export type UpdateUserLocationRes = z.infer<typeof updateUserLocationRes>;
export type DeleteUserLocationRes = z.infer<typeof deleteUserLocationRes>;
