import { HttpError } from "../../middlewares/error";
import type { AuthUser } from "../auth/dto/auth-dto";
import {
  type CreateWasteTxReq,
  type ListWasteTxReq,
  type UpdateWasteTxStatusReq,
} from "./dto";
import { WasteTransactionRepository } from "./repository";

export class WasteTransactionService {
  constructor(private readonly repository: WasteTransactionRepository) {}

  private async resolveEmployeeId(actor: AuthUser): Promise<string> {
    if (actor.role === "USER") {
      throw new HttpError(403, "USER role is not allowed to create waste transaction");
    }

    if (actor.role === "EMPLOYEE") {
      if (!actor.actor.employeeId) {
        throw new HttpError(403, "Employee context is missing");
      }

      return actor.actor.employeeId;
    }

    if (actor.actor.employeeId) {
      return actor.actor.employeeId;
    }

    const partnerId = actor.actor.partnerId;

    if (!partnerId) {
      throw new HttpError(403, "Partner context is missing");
    }

    const employeeId = await this.repository.findAnyEmployeeIdByPartnerId(partnerId);

    if (!employeeId) {
      throw new HttpError(403, "Partner has no employee account to create transaction");
    }

    return employeeId;
  }

  private async resolveActorScope(actor: AuthUser): Promise<{
    employeeId?: string;
    partnerId?: string;
  }> {
    if (actor.role === "USER") {
      throw new HttpError(403, "USER role is not allowed for waste transaction module");
    }

    if (actor.role === "EMPLOYEE") {
      if (!actor.actor.employeeId) {
        throw new HttpError(403, "Employee context is missing");
      }

      return { employeeId: actor.actor.employeeId };
    }

    if (!actor.actor.partnerId) {
      throw new HttpError(403, "Partner context is missing");
    }

    return { partnerId: actor.actor.partnerId };
  }

  async create(actor: AuthUser, payload: CreateWasteTxReq) {
    const employeeId = await this.resolveEmployeeId(actor);

    const [employee, station, wasteType, user] = await Promise.all([
      this.repository.findEmployeeById(employeeId),
      this.repository.findStationById(payload.stationId),
      this.repository.findWasteTypeById(payload.wasteTypeId),
      this.repository.findUserById(payload.userId),
    ]);

    if (!employee) {
      throw new HttpError(400, "Invalid employee");
    }

    if (!station) {
      throw new HttpError(400, "Invalid stationId");
    }

    if (!wasteType) {
      throw new HttpError(400, "Invalid wasteTypeId");
    }

    if (!user) {
      throw new HttpError(400, "Invalid userId");
    }

    if (actor.role === "PARTNER" && actor.actor.partnerId !== station.partnerId) {
      throw new HttpError(403, "Station does not belong to your partner account");
    }

    if (actor.role === "EMPLOYEE" && employee.partnerId !== station.partnerId) {
      throw new HttpError(403, "Station does not belong to your partner account");
    }

    const transaction = await this.repository.createTransaction({
      stationId: payload.stationId,
      wasteTypeId: payload.wasteTypeId,
      empId: employee.id,
      userId: payload.userId,
      weight: payload.weight,
      status: "PENDING",
      note: payload.note,
    });

    await this.repository.createTransactionEvent({
      transactionId: transaction.id,
      eventType: "CREATED",
      payload: {
        actorRole: actor.role,
        stationId: transaction.stationId,
        wasteTypeId: transaction.wasteTypeId,
        userId: transaction.userId,
        weight: transaction.weight,
        note: transaction.note,
      },
      payloadVersion: 1,
      createdBy: actor.id,
    });

    return transaction;
  }

  async list(actor: AuthUser, query: ListWasteTxReq) {
    const scope = await this.resolveActorScope(actor);

    const params: {
      employeeId?: string;
      partnerId?: string;
      status?: ListWasteTxReq["status"];
      page: number;
      limit: number;
    } = {
      ...scope,
      page: query.page,
      limit: query.limit,
    };

    if (query.status) {
      params.status = query.status;
    }

    return this.repository.listTransactionsForActor(params);
  }

  async getById(actor: AuthUser, transactionId: string) {
    const scope = await this.resolveActorScope(actor);

    const transaction = await this.repository.findTransactionByIdForActor({
      transactionId,
      ...scope,
    });

    if (!transaction) {
      throw new HttpError(404, "Waste transaction not found");
    }

    return transaction;
  }

  async updateStatus(
    actor: AuthUser,
    transactionId: string,
    payload: UpdateWasteTxStatusReq,
  ) {
    const scope = await this.resolveActorScope(actor);

    const existing = await this.repository.findTransactionByIdForActor({
      transactionId,
      ...scope,
    });

    if (!existing) {
      throw new HttpError(404, "Waste transaction not found");
    }

    const updated = await this.repository.updateTransactionStatusById(
      existing.id,
      payload.status,
      payload.note,
    );

    if (!updated) {
      throw new HttpError(500, "Failed to update waste transaction");
    }

    await this.repository.createTransactionEvent({
      transactionId: updated.id,
      eventType: payload.status,
      payload: {
        actorRole: actor.role,
        status: payload.status,
        note: payload.note,
      },
      payloadVersion: 1,
      createdBy: actor.id,
    });

    return updated;
  }
}
