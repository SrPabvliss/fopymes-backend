import { createRouter } from "@/core/infrastructure/lib/create-app";
import { GoalContributionService } from "@/goals/application/services/goal-contribution.service";
import { PgGoalContributionRepository } from "../adapters/goal-contribution.repository";
import { PgGoalRepository } from "../adapters/goal.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import * as routes from "./goal-contribution.route";

const goalContributionRepository = PgGoalContributionRepository.getInstance();
const goalRepository = PgGoalRepository.getInstance();
const transactionRepository = PgTransactionRepository.getInstance();

const goalContributionService = GoalContributionService.getInstance(
  goalContributionRepository,
  goalRepository,
  transactionRepository
);

const router = createRouter()
  .openapi(routes.list, goalContributionService.getAll)
  .openapi(routes.getById, goalContributionService.getById)
  .openapi(routes.listByGoal, goalContributionService.getByGoalId)
  .openapi(routes.create, goalContributionService.create)
  .openapi(routes.delete_, goalContributionService.delete);

export default router;