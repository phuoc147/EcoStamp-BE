import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { apiError, apiSuccess } from "../../common/dto/api-response";
import { auth } from "../../middlewares/auth";
import { getMyProfile, getStationProfileByCode } from "./controller/profile-controller";
import { myProfileRes, stationProfileRes } from "./dto/profile-dto";

const userRouter = Router();

userRouter.get("/users/me/profile", auth, getMyProfile);
userRouter.get("/users/stations/:code", auth, getStationProfileByCode);

export const registerUserOpenApi = (registry: OpenAPIRegistry): void => {
	registry.registerPath({
		method: "get",
		path: "/users/me/profile",
		tags: ["User"],
		summary: "Get current user profile",
		security: [{ cookieAuth: [] }],
		responses: {
			200: {
				description: "Profile fetched",
				content: {
					"application/json": {
						schema: apiSuccess(myProfileRes),
					},
				},
			},
			401: {
				description: "Unauthorized",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
		},
	});

	registry.registerPath({
    method: "get",
    path: "/users/stations/{code}",
    tags: ["User"],
    summary: "Get station profile by station code",
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: "code",
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      200: {
        description: "Station profile fetched",
        content: {
          "application/json": {
            schema: apiSuccess(stationProfileRes),
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
      404: {
        description: "Station not found",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
    },
  });
};

export { userRouter };
