import { HttpError } from "../../../middlewares/error";
import { ProfileRepo } from "../repository/profile-repo";
import { toUserRes } from "../dto/profile-dto";

export class ProfileService {
  constructor(private readonly profileRepo: ProfileRepo) {}

  async getMyProfile(userId: string) {
    const user = await this.profileRepo.findById(userId);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return {
      user: toUserRes(user),
    };
  }

  async getStationProfileByCode(code: string) {
    const station = await this.profileRepo.findStationByCode(code.trim().toUpperCase());

    if (!station) {
      throw new HttpError(404, "Station not found");
    }

    const [partner, location] = await Promise.all([
      this.profileRepo.findPartnerById(station.partnerId),
      this.profileRepo.findStationLocationByStationId(station.id),
    ]);

    if (!partner) {
      throw new HttpError(404, "Station partner not found");
    }

    return {
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
        status: station.status,
        partnerId: station.partnerId,
      },
      partner: {
        id: partner.id,
        ownerUserId: partner.ownerUserId,
        status: partner.status,
      },
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            street: location.street,
            streetNumber: location.streetNumber,
            formattedAddress: location.formattedAddress,
          }
        : null,
    };
  }
}
