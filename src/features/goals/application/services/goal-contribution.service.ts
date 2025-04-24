// src/features/goals/application/services/goal-contribution.service.ts
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IGoalContributionRepository } from "@/goals/domain/ports/goal-contribution-repository.port";
import { IGoalRepository } from "@/goals/domain/ports/goal-repository.port";
import { IGoalContributionService } from "@/goals/domain/ports/goal-contribution-service.port";
import {
  ListRoute,
  GetByIdRoute,
  ListByGoalRoute,
  CreateRoute,
    DeleteRoute,
} from "@/goals/infrastucture/controllers/goal-contribution.route";
import { ITransactionRepository } from "@/transactions/domain/ports/transaction-repository.port";
import { GoalContributionApiAdapter } from "@/goals/infrastucture/adapters/goal-contribution-api.adapter";

export class GoalContributionService implements IGoalContributionService {
  private static instance: GoalContributionService;

  constructor(
    private readonly goalContributionRepository: IGoalContributionRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  public static getInstance(
    goalContributionRepository: IGoalContributionRepository,
    goalRepository: IGoalRepository,
    transactionRepository: ITransactionRepository
  ): GoalContributionService {
    if (!GoalContributionService.instance) {
      GoalContributionService.instance = new GoalContributionService(
        goalContributionRepository,
        goalRepository,
        transactionRepository
      );
    }
    return GoalContributionService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const contributions = await this.goalContributionRepository.findAll();
    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponseList(contributions),
        message: "Goal contributions retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const contribution = await this.goalContributionRepository.findById(Number(id));

    if (!contribution) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponse(contribution),
        message: "Goal contribution retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByGoalId = createHandler<ListByGoalRoute>(async (c) => {
    const goalId = c.req.param("goalId");
    
    const goal = await this.goalRepository.findById(Number(goalId));
    if (!goal) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const contributions = await this.goalContributionRepository.findByGoalId(Number(goalId));
    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponseList(contributions),
        message: "Goal contributions retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  create = createHandler<CreateRoute>(async (c) => {
    const data = c.req.valid("json");
    
    // Verify goal exists
    const goal = await this.goalRepository.findById(data.goal_id);
    if (!goal) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Create contribution
    const contribution = await this.goalContributionRepository.create({
      goalId: data.goal_id,
      userId: data.user_id,
      amount: data.amount,
    });

    await this.goalRepository.update(goal.id, {
      currentAmount: goal.currentAmount + data.amount
    });

    await this.transactionRepository.create({
      userId: data.user_id,
      amount: data.amount,
      type: "EXPENSE",
      description: `Contribution to goal: ${goal.name}`,
      contributionId: contribution.id,
    });

    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponse(contribution),
        message: "Goal contribution created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    
    const contribution = await this.goalContributionRepository.findById(Number(id));
    if (!contribution) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const goal = await this.goalRepository.findById(contribution.goalId);
    if (goal) {
      await this.goalRepository.update(goal.id, {
        currentAmount: Math.max(0, goal.currentAmount - contribution.amount)
      });
    }

    const deleted = await this.goalContributionRepository.delete(Number(id));
    return c.json(
      {
        success: true,
        data: { deleted },
        message: "Goal contribution deleted successfully",
      },
      HttpStatusCodes.OK
    );
  });
}