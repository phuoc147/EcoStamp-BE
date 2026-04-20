import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/http/response";
import { HttpError } from "../../middlewares/error";
import {
  createWasteTxReq,
  listWasteTxReq,
  updateWasteTxStatusReq,
  wasteTxStatus,
  type CreateWasteTxRes,
  type GetWasteTxRes,
  type ListWasteTxRes,
  type UpdateWasteTxStatusRes,
} from "./dto";
import { WasteTransactionRepository } from "./repository";
import { WasteTransactionService } from "./service";

const service = new WasteTransactionService(new WasteTransactionRepository());

const toIsoDate = (value: Date): string => value.toISOString();

const getRequiredParam = (value: string | string[] | undefined, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return value;
};

const toWasteTransactionResponse = (transaction: {
  id: string;
  stationId: string;
  wasteTypeId: string;
  empId: string;
  userId: string;
  weight: number;
  status: string;
  note: string | null;
  createdAt: Date;
}) => ({
  ...transaction,
  status: wasteTxStatus.parse(transaction.status),
  createdAt: toIsoDate(transaction.createdAt),
});

export const createWasteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const parsed = createWasteTxReq.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload");
    }

    const transaction = await service.create(req.user, parsed.data);

    sendSuccess<CreateWasteTxRes>(
      res,
      201,
      { transaction: toWasteTransactionResponse(transaction) },
      "Waste transaction created",
    );
  } catch (error) {
    next(error);
  }
};

export const listWasteTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const parsed = listWasteTxReq.safeParse(req.query);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid query");
    }

    const result = await service.list(req.user, parsed.data);

    sendSuccess<ListWasteTxRes>(
      res,
      200,
      {
        transactions: result.transactions.map(toWasteTransactionResponse),
        total: result.total,
      },
      "Waste transactions fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const getWasteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const transactionId = getRequiredParam(req.params.id, "id");

    const transaction = await service.getById(req.user, transactionId);

    sendSuccess<GetWasteTxRes>(
      res,
      200,
      { transaction: toWasteTransactionResponse(transaction) },
      "Waste transaction fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const updateWasteTransactionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const transactionId = getRequiredParam(req.params.id, "id");

    const parsed = updateWasteTxStatusReq.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload");
    }

    const transaction = await service.updateStatus(req.user, transactionId, parsed.data);

    sendSuccess<UpdateWasteTxStatusRes>(
      res,
      200,
      { transaction: toWasteTransactionResponse(transaction) },
      "Waste transaction status updated",
    );
  } catch (error) {
    next(error);
  }
};
