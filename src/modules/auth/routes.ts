import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { apiError, apiSuccess } from "../../common/dto/api-response";
import { login, logout } from "./controller/login-controller";
import {
	approveStationJoinRequest,
	listStationJoinRequests,
	me,
	rejectStationJoinRequest,
	switchRole,
} from "./controller/auth-controller";
import {
	register,
	registerEmployeeOnProfile,
	registerPartnerOnProfile,
} from "./controller/register-controller";
import {
	loginReq,
	loginRes,
	logoutRes,
} from "./dto/login-dto";
import {
	registerEmployeeReq,
	registerEmployeeRes,
	registerPartnerReq,
	registerPartnerRes,
	registerReq,
	registerRes,
} from "./dto/register-dto";
import {
  approveStationJoinRequestRes,
  listStationJoinRequestsRes,
	meRes,
  rejectStationJoinRequestRes,
	switchRoleReq,
	switchRoleRes,
} from "./dto/auth-dto";
import { auth } from "../../middlewares/auth";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", auth, logout);
authRouter.get("/me", auth, me);
authRouter.post("/switch-role", auth, switchRole);
authRouter.post("/register-partner", auth, registerPartnerOnProfile);
authRouter.post("/register-employee", auth, registerEmployeeOnProfile);
authRouter.get("/station-join-requests", auth, listStationJoinRequests);
authRouter.post("/station-join-requests/:requestId/approve", auth, approveStationJoinRequest);
authRouter.post("/station-join-requests/:requestId/reject", auth, rejectStationJoinRequest);

export const registerAuthOpenApi = (registry: OpenAPIRegistry): void => {
	registry.registerPath({
		method: "post",
		path: "/auth/register",
		tags: ["Auth"],
		summary: "Register a new account",
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: registerReq,
					},
				},
			},
		},
		responses: {
			201: {
				description: "User created",
				content: {
					"application/json": {
						schema: apiSuccess(registerRes),
					},
				},
			},
			400: {
				description: "Invalid input",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
			409: {
				description: "Email already exists",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/login",
		tags: ["Auth"],
		summary: "Login and create a session (default active role = USER)",
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: loginReq,
					},
				},
			},
		},
		responses: {
			200: {
				description: "Login success and cookie is set",
				content: {
					"application/json": {
						schema: apiSuccess(loginRes),
					},
				},
			},
			401: {
				description: "Invalid credentials",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/logout",
		tags: ["Auth"],
		summary: "Logout and clear current session",
		security: [{ cookieAuth: [] }],
		responses: {
			200: {
				description: "Logout success",
				content: {
					"application/json": {
						schema: apiSuccess(logoutRes),
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
		path: "/auth/me",
		tags: ["Auth"],
		summary: "Get current authenticated user",
		security: [{ cookieAuth: [] }],
		responses: {
			200: {
				description: "Current user profile",
				content: {
					"application/json": {
						schema: apiSuccess(meRes),
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
		method: "post",
		path: "/auth/switch-role",
		tags: ["Auth"],
		summary: "Switch current active role in session",
		security: [{ cookieAuth: [] }],
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: switchRoleReq,
					},
				},
			},
		},
		responses: {
			200: {
				description: "Role switched successfully",
				content: {
					"application/json": {
						schema: apiSuccess(switchRoleRes),
					},
				},
			},
			400: {
				description: "Invalid payload",
				content: {
					"application/json": {
						schema: apiError,
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
			403: {
				description: "Role is not available",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/register-partner",
		tags: ["Auth"],
		summary: "Register partner account and first green station",
		security: [{ cookieAuth: [] }],
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: registerPartnerReq,
					},
				},
			},
		},
		responses: {
			201: {
				description: "Partner onboarding success",
				content: {
					"application/json": {
						schema: apiSuccess(registerPartnerRes),
					},
				},
			},
			400: {
				description: "Invalid payload",
				content: {
					"application/json": {
						schema: apiError,
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
			409: {
				description: "Already has partner",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/register-employee",
		tags: ["Auth"],
		summary: "Request to join a green station as employee",
		security: [{ cookieAuth: [] }],
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: registerEmployeeReq,
					},
				},
			},
		},
		responses: {
			202: {
				description: "Join request created",
				content: {
					"application/json": {
						schema: apiSuccess(registerEmployeeRes),
					},
				},
			},
			400: {
				description: "Invalid payload",
				content: {
					"application/json": {
						schema: apiError,
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
			409: {
				description: "Already requested or already an employee",
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
		path: "/auth/station-join-requests",
		tags: ["Auth"],
		summary: "List join requests of stations owned by current partner",
		security: [{ cookieAuth: [] }],
		responses: {
			200: {
				description: "Requests fetched",
				content: {
					"application/json": {
						schema: apiSuccess(listStationJoinRequestsRes),
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
			403: {
				description: "Forbidden",
				content: {
					"application/json": {
						schema: apiError,
					},
				},
			},
		},
	});

	registry.registerPath({
    method: "post",
    path: "/auth/station-join-requests/{requestId}/approve",
    tags: ["Auth"],
    summary: "Approve a station join request",
    security: [{ cookieAuth: [] }],

    parameters: [
      {
        name: "requestId",
        in: "path",
        required: true,
        schema: {
          type: "string", // hoặc "number" tùy DB của bạn
        },
      },
    ],

    responses: {
		200: {
			description: "Request approved",
			content: {
			"application/json": {
				schema: apiSuccess(approveStationJoinRequestRes),
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
		403: {
			description: "Forbidden",
			content: {
			"application/json": {
				schema: apiError,
			},
			},
		},
		404: {
			description: "Request not found",
			content: {
			"application/json": {
				schema: apiError,
			},
			},
		},
		},
	});
	registry.registerPath({
    method: "post",
    path: "/auth/station-join-requests/{requestId}/reject",
    tags: ["Auth"],
    summary: "Reject a station join request",
    parameters: [
      {
        name: "requestId",
        in: "path",
        required: true,
        schema: {
          type: "string", // hoặc "number" tùy DB của bạn
        },
      },
    ],
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        description: "Request rejected",
        content: {
          "application/json": {
            schema: apiSuccess(rejectStationJoinRequestRes),
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
      403: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
      404: {
        description: "Request not found",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
    },
  });
};

export { authRouter };
