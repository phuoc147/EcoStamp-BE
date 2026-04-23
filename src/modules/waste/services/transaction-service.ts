import { HttpError } from "../../../middlewares/error";
import type { AuthUser } from "../../auth/dto/auth-dto";
import type {
	CreateWasteTxReq,
	ListWasteTxReq,
	UpdateWasteTxStatusReq,
	WasteTxStatus,
} from "../dto";
import { WasteTransactionRepository } from "../repository";

export class WasteTransactionService {
	constructor(private readonly repository: WasteTransactionRepository) {}

	private async resolveCreateEmployeeId(actor: AuthUser, stationId: string): Promise<string> {
		if (actor.role === "USER") {
			throw new HttpError(403, "USER role is not allowed to create waste transaction");
		}

		if (actor.role === "EMPLOYEE") {
			if (!actor.actor.employeeId) {
				throw new HttpError(403, "Employee context is missing");
			}

			const employee = await this.repository.findEmployeeById(actor.actor.employeeId);

			if (!employee) {
				throw new HttpError(403, "Employee account not found");
			}

			if (employee.stationId !== stationId) {
				throw new HttpError(403, "Employee cannot create transaction for this station");
			}

			return employee.id;
		}

		const station = await this.repository.findStationById(stationId);

		if (!station) {
			throw new HttpError(400, "Invalid stationId");
		}

		if (!actor.actor.partnerId || station.partnerId !== actor.actor.partnerId) {
			throw new HttpError(403, "Station does not belong to your partner account");
		}

		const employeeId = await this.repository.findAnyEmployeeIdByStationId(stationId);

		if (!employeeId) {
			throw new HttpError(403, "Station has no employee account to create transaction");
		}

		return employeeId;
	}

	private resolveHistoryScope(actor: AuthUser): {
		employeeId?: string;
		partnerId?: string;
		userId?: string;
	} {
		if (actor.role === "USER") {
			return { userId: actor.id };
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
		const [station, wasteType, depositor] = await Promise.all([
			this.repository.findStationById(payload.stationId),
			this.repository.findWasteTypeById(payload.wasteTypeId),
			this.repository.findUserById(payload.userId),
		]);

		if (!station) {
			throw new HttpError(400, "Invalid stationId");
		}

		if (!wasteType) {
			throw new HttpError(400, "Invalid wasteTypeId");
		}

		if (!depositor) {
			throw new HttpError(400, "Invalid userId");
		}

		const mappedWasteType = await this.repository.findStationWasteType(payload.stationId, payload.wasteTypeId);

		if (!mappedWasteType) {
			throw new HttpError(400, "Waste type is not accepted by this station");
		}

		const employeeId = await this.resolveCreateEmployeeId(actor, payload.stationId);

		const transaction = await this.repository.createTransaction({
			stationId: payload.stationId,
			wasteTypeId: payload.wasteTypeId,
			empId: employeeId,
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
		const scope = this.resolveHistoryScope(actor);

		const params: {
			employeeId?: string;
			partnerId?: string;
			userId?: string;
			status?: WasteTxStatus;
			stationId?: string;
			targetUserId?: string;
			page: number;
			limit: number;
		} = {
			...scope,
			page: query.page,
			limit: query.limit,
		};

		if (query.status !== undefined) {
			params.status = query.status;
		}

		if (query.stationId && actor.role !== "USER") {
			params.stationId = query.stationId;
		}

		if (query.userId && actor.role !== "USER") {
			params.targetUserId = query.userId;
		}

		return this.repository.listTransactionsForActor(params);
	}

	async getById(actor: AuthUser, transactionId: string) {
		const scope = this.resolveHistoryScope(actor);

		const transaction = await this.repository.findTransactionByIdForActor({
			transactionId,
			...scope,
		});

		if (!transaction) {
			throw new HttpError(404, "Waste transaction not found");
		}

		return transaction;
	}

	async updateStatus(actor: AuthUser, transactionId: string, payload: UpdateWasteTxStatusReq) {
		if (actor.role === "USER") {
			throw new HttpError(403, "USER role is not allowed to update waste transaction");
		}

		const scope = this.resolveHistoryScope(actor);

		const existing = await this.repository.findTransactionByIdForActor({
			transactionId,
			...scope,
		});

		if (!existing) {
			throw new HttpError(404, "Waste transaction not found");
		}

		if (payload.status === "APPROVED") {
			try {
				return await this.repository.approveTransactionAndReward({
					transactionId: existing.id,
					actorId: actor.id,
					...(payload.note !== undefined ? { note: payload.note } : {}),
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown error";

				if (message === "NO_ACTIVE_WASTE_POINT_RULE") {
					throw new HttpError(409, "No active point rule for this waste type");
				}

				if (message === "NO_LEVEL_CONFIGURATION") {
					throw new HttpError(500, "No level configuration found");
				}

				throw new HttpError(500, "Failed to approve waste transaction");
			}
		}

		const rejected = await this.repository.rejectTransaction({
			transactionId: existing.id,
			actorId: actor.id,
			...(payload.note !== undefined ? { note: payload.note } : {}),
		});

		if (!rejected) {
			throw new HttpError(500, "Failed to reject waste transaction");
		}

		return {
			transaction: rejected,
			pointsAwarded: undefined,
		};
	}
}
