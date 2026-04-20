import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../../middlewares/error";
import { sendSuccess } from "../../../common/http/response";
import {
  createUserLocationReq,
  deleteUserLocationRes,
  geoNearbyReq,
  reverseGeocodingReq,
  spatialClustersReq,
  unitSearchReq,
  unitsRootReq,
  updateUserLocationReq,
  userLocationsReq,
  type CreateUserLocationRes,
  type DeleteUserLocationRes,
  type GetAdminUnitPathRes,
  type GetCountryRes,
  type ListAdminLevelsRes,
  type ListAdminUnitsRes,
  type ListCountriesRes,
  type ListUserLocationsRes,
  type UpdateUserLocationRes,
} from "../dto/address-dto";
import { AddressService } from "../services/address-service";
import { AddressRepository } from "../repository/address-repo";

const addressService = new AddressService(new AddressRepository());

const getRequiredParam = (value: string | string[] | undefined, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return value;
};

const toIsoDate = (value: Date): string => value.toISOString();

const toCountryResponse = (country: {
  id: string;
  name: string;
  nameEn: string | null;
  isoCode: string;
  createdAt: Date;
}) => ({
  ...country,
  createdAt: toIsoDate(country.createdAt),
});

const toAdminLevelResponse = (item: {
  id: string;
  countryId: string;
  level: number;
  type: string;
  nameLocal: string;
  nameEn: string | null;
  createdAt: Date;
}) => ({
  ...item,
  createdAt: toIsoDate(item.createdAt),
});

const toAdministrativeUnitResponse = (unit: {
  id: string;
  name: string;
  nameEn: string | null;
  type: string;
  level: number;
  countryId: string;
  adminLevelDefinitionId: string;
  parentId: string | null;
  code: string | null;
  createdAt: Date;
}) => ({
  ...unit,
  createdAt: toIsoDate(unit.createdAt),
});

const toUserLocationResponse = (location: {
  id: string;
  userId: string;
  adminUnitId: string | null;
  street: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}) => ({
  ...location,
  createdAt: toIsoDate(location.createdAt),
});

export const listCountries = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const countries = await addressService.listCountries();

    sendSuccess<ListCountriesRes>(
      res,
      200,
      {
        countries: countries.map(toCountryResponse),
      },
      "Countries fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const getCountry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const countryId = getRequiredParam(req.params.id, "id");
    const country = await addressService.getCountryById(countryId);

    sendSuccess<GetCountryRes>(
      res,
      200,
      {
        country: toCountryResponse(country),
      },
      "Country fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const listAdminLevels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const countryId = getRequiredParam(req.params.countryId, "countryId");
    const levels = await addressService.listAdminLevelDefinitions(countryId);

    sendSuccess<ListAdminLevelsRes>(
      res,
      200,
      {
        levels: levels.map(toAdminLevelResponse),
      },
      "Admin levels fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const listRootUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = unitsRootReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "countryId is required and must be a valid uuid");
    }

    const units = await addressService.listRootAdministrativeUnits(parsed.data);

    sendSuccess<ListAdminUnitsRes>(
      res,
      200,
      {
        units: units.map(toAdministrativeUnitResponse),
      },
      "Root administrative units fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const listUnitChildren = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unitId = getRequiredParam(req.params.id, "id");
    const units = await addressService.listAdministrativeUnitChildren(unitId);

    sendSuccess<ListAdminUnitsRes>(
      res,
      200,
      {
        units: units.map(toAdministrativeUnitResponse),
      },
      "Child administrative units fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const getUnitPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unitId = getRequiredParam(req.params.id, "id");
    const result = await addressService.getAdministrativeUnitPath(unitId);

    sendSuccess<GetAdminUnitPathRes>(
      res,
      200,
      {
        path: result.path.map(toAdministrativeUnitResponse),
        breadcrumb: result.breadcrumb,
      },
      "Administrative unit path fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const searchUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = unitSearchReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid search query");
    }

    const result = await addressService.searchAdministrativeUnits(parsed.data);

    sendSuccess<ListAdminUnitsRes>(
      res,
      200,
      {
        units: result.units.map(toAdministrativeUnitResponse),
      },
      "Administrative units search completed",
    );
  } catch (error) {
    next(error);
  }
};

export const listMyLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const parsed = userLocationsReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid pagination query");
    }

    const result = await addressService.listMyLocations(userId, parsed.data);

    sendSuccess<ListUserLocationsRes>(
      res,
      200,
      {
        locations: result.locations.map(toUserLocationResponse),
      },
      "User locations fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const createMyLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const parsedBody = createUserLocationReq.safeParse(req.body);

    if (!parsedBody.success) {
      throw new HttpError(400, "Invalid location payload");
    }

    const location = await addressService.createMyLocation(userId, parsedBody.data);

    sendSuccess<CreateUserLocationRes>(
      res,
      201,
      {
        location: toUserLocationResponse(location),
      },
      "User location created",
    );
  } catch (error) {
    next(error);
  }
};

export const updateMyLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const parsedBody = updateUserLocationReq.safeParse(req.body);

    if (!parsedBody.success) {
      throw new HttpError(400, "Invalid location payload");
    }

    const locationId = getRequiredParam(req.params.id, "id");
    const location = await addressService.updateMyLocation(userId, locationId, parsedBody.data);

    sendSuccess<UpdateUserLocationRes>(
      res,
      200,
      {
        location: toUserLocationResponse(location),
      },
      "User location updated",
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMyLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const locationId = getRequiredParam(req.params.id, "id");
    await addressService.deleteMyLocation(userId, locationId);

    const payload = deleteUserLocationRes.parse({
      id: locationId,
      deleted: true,
    });

    sendSuccess<DeleteUserLocationRes>(res, 200, payload, "User location deleted");
  } catch (error) {
    next(error);
  }
};

export const getNearbyPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = geoNearbyReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid geo query");
    }

    const data = await addressService.findNearestPlaces(parsed.data);
    sendSuccess(res, 200, { items: data }, "Nearby places fetched");
  } catch (error) {
    next(error);
  }
};

export const getNearbyStations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = geoNearbyReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid geo query");
    }

    const data = await addressService.findNearbyStations(parsed.data);
    sendSuccess(res, 200, { stations: data }, "Nearby stations fetched");
  } catch (error) {
    next(error);
  }
};

export const reverseGeocoding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = reverseGeocodingReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid geo query");
    }

    const data = await addressService.resolveLocation(parsed.data);
    sendSuccess(res, 200, data, "Reverse geocoding completed");
  } catch (error) {
    next(error);
  }
};

export const getSpatialClusters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = spatialClustersReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid cluster query");
    }

    const data = await addressService.spatialSearchAndClustering(parsed.data);
    sendSuccess(res, 200, data, "Spatial clusters generated");
  } catch (error) {
    next(error);
  }
};
