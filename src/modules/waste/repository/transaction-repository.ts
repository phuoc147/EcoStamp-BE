import { and, count, desc, eq, gt, gte, isNull, lte, or, type SQL } from "drizzle-orm";
import { db } from "../../../db";
import {
  employees,
  greenStations,
  levels,
  pointTransactions,
  stationWasteTypes,
  userLevelLogs,
  userLevels,
  users,
  wastePointRules,
  wasteTransactionEvents,
  wasteTransactions,
  wasteTypes,
  type Employee,
  type GreenStation,
  type NewPointTransaction,
  type NewWasteTransaction,
  type NewWasteTransactionEvent,
  type User,
  type WasteTransaction,
  type WasteType,
} from "../../../db/schema";
import type { WasteTxStatus } from "../dto";

export class WasteTransactionRepository {
  async findEmployeeById(employeeId: string): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    return employee ?? null;
  }

  async findAnyEmployeeIdByStationId(stationId: string): Promise<string | null> {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.stationId, stationId))
      .orderBy(desc(employees.createdAt))
      .limit(1);

    return employee?.id ?? null;
  }

  async findStationById(stationId: string): Promise<GreenStation | null> {
    const [station] = await db
      .select()
      .from(greenStations)
      .where(eq(greenStations.id, stationId))
      .limit(1);

    return station ?? null;
  }

  async findWasteTypeById(wasteTypeId: string): Promise<WasteType | null> {
    const [wasteType] = await db
      .select()
      .from(wasteTypes)
      .where(eq(wasteTypes.id, wasteTypeId))
      .limit(1);

    return wasteType ?? null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return user ?? null;
  }

  async findStationWasteType(stationId: string, wasteTypeId: string) {
    const [row] = await db
      .select()
      .from(stationWasteTypes)
      .where(
        and(
          eq(stationWasteTypes.stationId, stationId),
          eq(stationWasteTypes.wasteTypeId, wasteTypeId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async createTransaction(data: NewWasteTransaction): Promise<WasteTransaction> {
    const [transaction] = await db.insert(wasteTransactions).values(data).returning();

    if (!transaction) {
      throw new Error("Failed to create waste transaction");
    }

    return transaction;
  }

  async createTransactionEvent(data: NewWasteTransactionEvent): Promise<void> {
    await db.insert(wasteTransactionEvents).values(data);
  }

  async findTransactionByIdForActor(params: {
    transactionId: string;
    employeeId?: string;
    partnerId?: string;
    userId?: string;
  }): Promise<WasteTransaction | null> {
    if (params.partnerId) {
      const [result] = await db
        .select({ transaction: wasteTransactions })
        .from(wasteTransactions)
        .innerJoin(greenStations, eq(wasteTransactions.stationId, greenStations.id))
        .where(
          and(
            eq(wasteTransactions.id, params.transactionId),
            eq(greenStations.partnerId, params.partnerId),
          ),
        )
        .limit(1);

      return result?.transaction ?? null;
    }

    if (params.userId) {
      const [transaction] = await db
        .select()
        .from(wasteTransactions)
        .where(
          and(
            eq(wasteTransactions.id, params.transactionId),
            eq(wasteTransactions.userId, params.userId),
          ),
        )
        .limit(1);

      return transaction ?? null;
    }

    if (!params.employeeId) {
      return null;
    }

    const [transaction] = await db
      .select()
      .from(wasteTransactions)
      .where(
        and(
          eq(wasteTransactions.id, params.transactionId),
          eq(wasteTransactions.empId, params.employeeId),
        ),
      )
      .limit(1);

    return transaction ?? null;
  }

  async listTransactionsForActor(params: {
    employeeId?: string;
    partnerId?: string;
    userId?: string;
    status?: WasteTxStatus;
    stationId?: string;
    targetUserId?: string;
    page: number;
    limit: number;
  }): Promise<{ transactions: WasteTransaction[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const conditions: SQL<unknown>[] = [];

    if (params.status) {
      conditions.push(eq(wasteTransactions.status, params.status));
    }

    if (params.stationId) {
      conditions.push(eq(wasteTransactions.stationId, params.stationId));
    }

    if (params.targetUserId) {
      conditions.push(eq(wasteTransactions.userId, params.targetUserId));
    }

    if (params.partnerId) {
      const whereClause = and(...conditions, eq(greenStations.partnerId, params.partnerId));
      const [rows, totalResult] = await Promise.all([
        db
          .select({ transaction: wasteTransactions })
          .from(wasteTransactions)
          .innerJoin(greenStations, eq(wasteTransactions.stationId, greenStations.id))
          .where(whereClause)
          .orderBy(desc(wasteTransactions.createdAt))
          .limit(params.limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(wasteTransactions)
          .innerJoin(greenStations, eq(wasteTransactions.stationId, greenStations.id))
          .where(whereClause),
      ]);

      return {
        transactions: rows.map((item) => item.transaction),
        total: Number(totalResult[0]?.value ?? 0),
      };
    }

    if (params.userId) {
      const whereClause = and(...conditions, eq(wasteTransactions.userId, params.userId));
      const [transactions, totalResult] = await Promise.all([
        db
          .select()
          .from(wasteTransactions)
          .where(whereClause)
          .orderBy(desc(wasteTransactions.createdAt))
          .limit(params.limit)
          .offset(offset),
        db.select({ value: count() }).from(wasteTransactions).where(whereClause),
      ]);

      return {
        transactions,
        total: Number(totalResult[0]?.value ?? 0),
      };
    }

    if (!params.employeeId) {
      return { transactions: [], total: 0 };
    }

    const whereClause = and(...conditions, eq(wasteTransactions.empId, params.employeeId));
    const [transactions, totalResult] = await Promise.all([
      db
        .select()
        .from(wasteTransactions)
        .where(whereClause)
        .orderBy(desc(wasteTransactions.createdAt))
        .limit(params.limit)
        .offset(offset),
      db.select({ value: count() }).from(wasteTransactions).where(whereClause),
    ]);

    return {
      transactions,
      total: Number(totalResult[0]?.value ?? 0),
    };
  }

  async approveTransactionAndReward(params: {
    transactionId: string;
    actorId: string;
    note?: string;
  }): Promise<{ transaction: WasteTransaction; pointsAwarded: number }> {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(wasteTransactions)
        .where(eq(wasteTransactions.id, params.transactionId))
        .limit(1);

      if (!existing) {
        throw new Error("WASTE_TRANSACTION_NOT_FOUND");
      }

      if (existing.status === "APPROVED") {
        const [existingPoint] = await tx
          .select()
          .from(pointTransactions)
          .where(
            and(
              eq(pointTransactions.sourceType, "WASTE"),
              eq(pointTransactions.sourceId, existing.id),
              eq(pointTransactions.userId, existing.userId),
            ),
          )
          .limit(1);

        return {
          transaction: existing,
          pointsAwarded: existingPoint?.points ?? 0,
        };
      }

      const [updated] = await tx
        .update(wasteTransactions)
        .set({ status: "APPROVED", note: params.note })
        .where(eq(wasteTransactions.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error("FAILED_TO_APPROVE_WASTE_TRANSACTION");
      }

      await tx.insert(wasteTransactionEvents).values({
        transactionId: updated.id,
        eventType: "APPROVED",
        payload: {
          status: "APPROVED",
          note: params.note,
        },
        payloadVersion: 1,
        createdBy: params.actorId,
      });

      const [alreadyRewarded] = await tx
        .select()
        .from(pointTransactions)
        .where(
          and(
            eq(pointTransactions.sourceType, "WASTE"),
            eq(pointTransactions.sourceId, updated.id),
            eq(pointTransactions.userId, updated.userId),
          ),
        )
        .limit(1);

      if (alreadyRewarded) {
        return {
          transaction: updated,
          pointsAwarded: alreadyRewarded.points,
        };
      }

      const [rule] = await tx
        .select()
        .from(wastePointRules)
        .where(
          and(
            eq(wastePointRules.wasteTypeId, updated.wasteTypeId),
            lte(wastePointRules.effectiveFrom, updated.createdAt),
            or(
              isNull(wastePointRules.effectiveTo),
              gt(wastePointRules.effectiveTo, updated.createdAt),
            ),
          ),
        )
        .orderBy(desc(wastePointRules.effectiveFrom))
        .limit(1);

      if (!rule) {
        throw new Error("NO_ACTIVE_WASTE_POINT_RULE");
      }

      const pointsAwarded = updated.weight * rule.pointsPerKg;
      const pointTxData: NewPointTransaction = {
        userId: updated.userId,
        type: "EARN",
        sourceType: "WASTE",
        sourceId: updated.id,
        points: pointsAwarded,
      };

      await tx.insert(pointTransactions).values(pointTxData);

      const [currentUserLevel] = await tx
        .select()
        .from(userLevels)
        .where(eq(userLevels.userId, updated.userId))
        .limit(1);

      const previousTotalExp = currentUserLevel?.totalExp ?? 0;
      const nextTotalExp = previousTotalExp + pointsAwarded;

      const [resolvedLevelByRange] = await tx
        .select()
        .from(levels)
        .where(and(lte(levels.minExp, nextTotalExp), gte(levels.maxExp, nextTotalExp)))
        .orderBy(desc(levels.level))
        .limit(1);

      let nextLevel = resolvedLevelByRange;

      if (!nextLevel) {
        const [fallbackLevel] = await tx
          .select()
          .from(levels)
          .where(lte(levels.minExp, nextTotalExp))
          .orderBy(desc(levels.level))
          .limit(1);

        nextLevel = fallbackLevel;
      }

      if (!nextLevel) {
        const [firstLevel] = await tx
          .select()
          .from(levels)
          .orderBy(levels.level)
          .limit(1);

        nextLevel = firstLevel;
      }

      if (!nextLevel) {
        throw new Error("NO_LEVEL_CONFIGURATION");
      }

      const nextCurrentExp = Math.max(0, nextTotalExp - nextLevel.minExp);

      if (currentUserLevel) {
        await tx
          .update(userLevels)
          .set({
            levelId: nextLevel.id,
            totalExp: nextTotalExp,
            currentExp: nextCurrentExp,
            updatedAt: new Date(),
          })
          .where(eq(userLevels.userId, updated.userId));

        if (currentUserLevel.levelId !== nextLevel.id) {
          const [fromLevel] = await tx
            .select({ level: levels.level })
            .from(levels)
            .where(eq(levels.id, currentUserLevel.levelId))
            .limit(1);

          await tx.insert(userLevelLogs).values({
            userId: updated.userId,
            fromLevel: fromLevel?.level ?? nextLevel.level,
            toLevel: nextLevel.level,
            expGain: pointsAwarded,
            sourceType: "WASTE",
            sourceId: updated.id,
          });
        }
      } else {
        await tx.insert(userLevels).values({
          userId: updated.userId,
          levelId: nextLevel.id,
          totalExp: nextTotalExp,
          currentExp: nextCurrentExp,
        });
      }

      return {
        transaction: updated,
        pointsAwarded,
      };
    });
  }

  async rejectTransaction(params: {
    transactionId: string;
    actorId: string;
    note?: string;
  }): Promise<WasteTransaction | null> {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(wasteTransactions)
        .set({ status: "REJECTED", note: params.note })
        .where(eq(wasteTransactions.id, params.transactionId))
        .returning();

      if (!updated) {
        return null;
      }

      await tx.insert(wasteTransactionEvents).values({
        transactionId: updated.id,
        eventType: "REJECTED",
        payload: {
          status: "REJECTED",
          note: params.note,
        },
        payloadVersion: 1,
        createdBy: params.actorId,
      });

      return updated;
    });
  }
}
