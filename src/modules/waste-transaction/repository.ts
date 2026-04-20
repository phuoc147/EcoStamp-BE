import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db } from "../../db";
import {
  employees,
  greenStations,
  users,
  wasteTransactionEvents,
  wasteTransactions,
  wasteTypes,
  type Employee,
  type GreenStation,
  type NewWasteTransaction,
  type NewWasteTransactionEvent,
  type User,
  type WasteTransaction,
  type WasteType,
} from "../../db/schema";
import type { WasteTransactionStatusDto } from "./dto";

export class WasteTransactionRepository {
  async findEmployeeById(employeeId: string): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    return employee ?? null;
  }

  async findAnyEmployeeIdByPartnerId(partnerId: string): Promise<string | null> {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.partnerId, partnerId))
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
  }): Promise<WasteTransaction | null> {
    if (params.partnerId) {
      const [result] = await db
        .select({ transaction: wasteTransactions })
        .from(wasteTransactions)
        .innerJoin(employees, eq(wasteTransactions.empId, employees.id))
        .where(
          and(
            eq(wasteTransactions.id, params.transactionId),
            eq(employees.partnerId, params.partnerId),
          ),
        )
        .limit(1);

      return result?.transaction ?? null;
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
    status?: WasteTransactionStatusDto;
    page: number;
    limit: number;
  }): Promise<{ transactions: WasteTransaction[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const conditions: SQL<unknown>[] = [];

    if (params.status) {
      conditions.push(eq(wasteTransactions.status, params.status));
    }

    if (params.partnerId) {
      const whereClause = and(...conditions, eq(employees.partnerId, params.partnerId));
      const [rows, totalResult] = await Promise.all([
        db
          .select({ transaction: wasteTransactions })
          .from(wasteTransactions)
          .innerJoin(employees, eq(wasteTransactions.empId, employees.id))
          .where(whereClause)
          .orderBy(desc(wasteTransactions.createdAt))
          .limit(params.limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(wasteTransactions)
          .innerJoin(employees, eq(wasteTransactions.empId, employees.id))
          .where(whereClause),
      ]);

      return {
        transactions: rows.map((item) => item.transaction),
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

  async updateTransactionStatusById(
    transactionId: string,
    status: "APPROVED" | "REJECTED",
    note?: string,
  ): Promise<WasteTransaction | null> {
    const [transaction] = await db
      .update(wasteTransactions)
      .set({ status, note })
      .where(eq(wasteTransactions.id, transactionId))
      .returning();

    return transaction ?? null;
  }
}
