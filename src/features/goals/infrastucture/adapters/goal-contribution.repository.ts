import { eq } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { goal_contributions } from "@/schema";
import { IGoalContributionRepository } from "@/goals/domain/ports/goal-contribution-repository.port";
import { IGoalContribution } from "@/goals/domain/entities/IGoalContribution";

export class PgGoalContributionRepository implements IGoalContributionRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgGoalContributionRepository;

  private constructor() {}

  public static getInstance(): PgGoalContributionRepository {
    if (!PgGoalContributionRepository.instance) {
      PgGoalContributionRepository.instance = new PgGoalContributionRepository();
    }
    return PgGoalContributionRepository.instance;
  }

  async findAll(): Promise<IGoalContribution[]> {
    const result = await this.db.select().from(goal_contributions);
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<IGoalContribution | null> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByGoalId(goalId: number): Promise<IGoalContribution[]> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.goal_id, goalId));

    return result.map(this.mapToEntity);
  }

  async findByUserId(userId: number): Promise<IGoalContribution[]> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.user_id, userId));

    return result.map(this.mapToEntity);
  }

  async create(contributionData: Omit<IGoalContribution, "id" | "date">): Promise<IGoalContribution> {
    const result = await this.db
      .insert(goal_contributions)
      .values({
        goal_id: contributionData.goalId,
        user_id: contributionData.userId,
        amount: contributionData.amount.toString(),
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(goal_contributions)
      .where(eq(goal_contributions.id, id))
      .returning();

    return result.length > 0;
  }

  private mapToEntity(raw: any): IGoalContribution {
    return {
      id: raw.id,
      goalId: raw.goal_id,
      userId: raw.user_id,
      amount: Number(raw.amount),
      date: raw.date,
    };
  }
}