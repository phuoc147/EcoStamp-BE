import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../common/http/response";
import { HttpError } from "../../../middlewares/error";
import type { MyProfileRes, StationProfileRes } from "../dto/profile-dto";
import { ProfileRepo } from "../repository/profile-repo";
import { ProfileService } from "../service/profile-service";

const profileService = new ProfileService(new ProfileRepo());

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const result = await profileService.getMyProfile(userId);

    sendSuccess<MyProfileRes>(res, 200, result, "Profile fetched");
  } catch (error) {
    next(error);
  }
};

export const getStationProfileByCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const code = req.params.code;

    if (!code || Array.isArray(code)) {
      throw new HttpError(400, "code is required");
    }

    const result = await profileService.getStationProfileByCode(code);

    sendSuccess<StationProfileRes>(res, 200, result, "Station profile fetched");
  } catch (error) {
    next(error);
  }
};
