import { CronJob } from "cron";
import { PgGoalContributionRepository } from "../../../features/goals/infrastucture/adapters/goal-contribution.repository";
import { EmailService } from "../../../features/email/application/services/email.service";
import { PgUserRepository } from "../../../features/users/infrastructure/adapters/user.repository";
import { PgGoalRepository } from "../../../features/goals/infrastucture/adapters/goal.repository";

// Recalculate contribution amount cron job that runs every day at 8am UTC-5
export const recalculateContributionAmountCron = new CronJob(
  // runs every 2 minutes
  "*/1 * * * *",
  async () => {
    try {
      console.log("Starting contribution amount recalculation job");

      // Find goals where last contribution was more than 1 week ago
      const goalsToUpdate =
        await PgGoalRepository.getInstance().findAllWithLastContributionWithMoreThanOneWeekAgo();

      console.log(`Found ${goalsToUpdate.length} goals to update`);

      for (const goal of goalsToUpdate) {
        // Get the latest contribution for this goal
        const latestContribution =
          await PgGoalContributionRepository.getInstance().findLatestContribution(
            goal.id
          );

        const lastContributionDate = latestContribution?.date;

        // Check if the last contribution was more than a week ago or if there's no contribution yet
        if (lastContributionDate) {
          // Recalculate the contribution amount based on remaining amount, time, and frequency
          const today = new Date();
          const daysRemaining = Math.ceil(
            (goal.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Adjust for contribution frequency (e.g., 7 for weekly, 30 for monthly)
          const contributionFrequency = goal.contributionFrequency;
          const contributionsRemaining = Math.ceil(
            daysRemaining / contributionFrequency
          );

          if (contributionsRemaining <= 0) {
            console.log(
              `Goal ${goal.id} has no contributions remaining, skipping recalculation`
            );
            continue;
          }

          const amountRemaining =
            Number(goal.targetAmount) - Number(goal.currentAmount);
          const newContributionAmount =
            amountRemaining / contributionsRemaining;

          // Update the goal with the new contribution amount
          await PgGoalRepository.getInstance().update(goal.id, {
            contributionAmount: Number(newContributionAmount.toFixed(2)),
          });

          //   // Create notification record
          //   await PgNotificationRepository.getInstance().create({
          //     user_id: goal.userId,
          //     title: "Goal Contribution Recalculated",
          //     message: `Your contribution amount for goal "${
          //       goal.name
          //     }" has been recalculated to $${newContributionAmount.toFixed(2)}`,
          //     type: "goal_update",
          //     read: false,
          //   });

          // Send email notification
          const emailService = EmailService.getInstance();
          await emailService.sendSimpleEmail(
            // We need to get the user's email from the users table
            await getUserEmail(goal.userId),
            `Goal Contribution Recalculated for "${goal.name}"`,
            `
            <h2>Goal Contribution Amount Updated</h2>
            <p>Your contribution amount for goal "${
              goal.name
            }" has been recalculated.</p>
            <p>New contribution amount: $${newContributionAmount.toFixed(2)}</p>
            <p>This adjustment was made because it's been over a week since your last contribution.</p>
            <p>Remaining to reach your goal: $${amountRemaining.toFixed(2)}</p>
            <p>Target completion date: ${goal.endDate.toLocaleDateString()}</p>
            `,
            { isHtml: true }
          );

          console.log(
            `Recalculated contribution for goal ${
              goal.id
            } to $${newContributionAmount.toFixed(2)}`
          );
        }
      }

      console.log("Contribution amount recalculation job completed");
    } catch (error) {
      console.error("Error in contribution amount recalculation job:", error);
    }
  },
  null, // onComplete
  false, // start
  "America/Bogota" // Timezone UTC-5
);

// Helper function to get user email from user ID
async function getUserEmail(userId: number): Promise<string> {
  const result = await PgUserRepository.getInstance().findById(userId);

  return result?.email || "";
}

// Start the cron job
