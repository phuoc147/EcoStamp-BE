import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { apiError, apiSuccess } from "../../common/dto/api-response";
import { auth, employeeOrPartnerAuth } from "../../middlewares/auth";
import {
  createWasteTransaction,
  getWasteTransaction,
  listWasteTransactions,
  updateWasteTransactionStatus,
} from "./controllers/transaction-controller";
import {
  createWasteTxReq,
  createWasteTxRes,
  getWasteTxRes,
  listWasteTxReq,
  listWasteTxRes,
  updateWasteTxStatusReq,
  updateWasteTxStatusRes,
} from "./dto";

const wasteRouter = Router();

wasteRouter.post("/waste-transactions", ...employeeOrPartnerAuth, createWasteTransaction);
wasteRouter.get("/waste-transactions", auth, listWasteTransactions);
wasteRouter.get("/waste-transactions/:id", auth, getWasteTransaction);
wasteRouter.patch(
  "/waste-transactions/:id/status",
  ...employeeOrPartnerAuth,
  updateWasteTransactionStatus,
);

export const registerWasteOpenApi = (registry: OpenAPIRegistry): void => {
  registry.registerPath({
    method: "post",
    path: "/waste-transactions",
    tags: ["Waste"],
    summary: "Create waste transaction (EMPLOYEE/PARTNER)",
    security: [{ cookieAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createWasteTxReq,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Waste transaction created",
        content: {
          "application/json": {
            schema: apiSuccess(createWasteTxRes),
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
    method: "get",
    path: "/waste-transactions",
    tags: ["Waste"],
    summary: "List waste transactions history",
    security: [{ cookieAuth: [] }],
    request: {
      query: listWasteTxReq,
    },
    responses: {
      200: {
        description: "Waste transactions fetched",
        content: {
          "application/json": {
            schema: apiSuccess(listWasteTxRes),
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
    method: "get",
    path: "/waste-transactions/{id}",
    tags: ["Waste"],
    summary: "Get waste transaction detail",
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      200: {
        description: "Waste transaction fetched",
        content: {
          "application/json": {
            schema: apiSuccess(getWasteTxRes),
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
        description: "Not found",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/waste-transactions/{id}/status",
    tags: ["Waste"],
    summary: "Approve or reject waste transaction",
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
      },
    ],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateWasteTxStatusReq,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Waste transaction status updated",
        content: {
          "application/json": {
            schema: apiSuccess(updateWasteTxStatusRes),
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
        description: "Forbidden",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
      404: {
        description: "Not found",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
      409: {
        description: "Business conflict",
        content: {
          "application/json": {
            schema: apiError,
          },
        },
      },
    },
  });
};

export { wasteRouter };
