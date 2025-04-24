import { z } from "zod";
import { selectGoalContributionScheduleSchema } from "@/goals/application/dtos/goal-contribution-schedule.dto";
import { IGoalContributionSchedule } from "@/goals/domain/entities/IGoalContributionSchedule";

export class GoalContributionScheduleApiAdapter {
  static toApiResponse(schedule: IGoalContributionSchedule): z.infer<typeof selectGoalContributionScheduleSchema> {
    return {
      id: schedule.id,
      goal_id: schedule.goalId,
      user_id: schedule.userId,
      scheduled_date: schedule.scheduledDate.toISOString(),
      amount: schedule.amount.toString(),
      status: schedule.status,
      contribution_id: schedule.contributionId || null,
    };
  }

  static toApiResponseList(schedules: IGoalContributionSchedule[]): z.infer<typeof selectGoalContributionScheduleSchema>[] {
    return schedules.map(this.toApiResponse);
  }
}