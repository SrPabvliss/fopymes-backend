import { budgets } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const budgetBaseSchema = createInsertSchema(budgets);
export const selectBudgetSchema = createSelectSchema(budgets);

export const createBudgetSchema = budgetBaseSchema
	.extend({
		category_id: z.number().int().positive(),
		limit_amount: z.number().positive("Limit amount must be positive"),
		current_amount: z
			.number()
			.min(0, "Current amount cannot be negative")
			.optional(),
		month: z.string().date(),
		shared_user_id: z.number().optional(),
	})
	.omit({
		id: true,
	});

export const updateBudgetSchema = budgetBaseSchema
	.extend({
		category_id: z.number().int().positive().optional(),
		limit_amount: z
			.number()
			.positive("Limit amount must be positive")
			.optional(),
		current_amount: z
			.number()
			.min(0, "Current amount cannot be negative")
			.optional(),
		month: z.string().date().optional(),
		shared_user_id: z.number().optional().nullable(),
	})
	.partial()
	.omit({
		id: true,
		user_id: true,
	});

export const updateAmountSchema = z.object({
	amount: z.number(),
});

export type BudgetResponse = z.infer<typeof selectBudgetSchema>;
export type CreateBudgetDTO = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDTO = z.infer<typeof updateBudgetSchema>;
export type UpdateAmountDTO = z.infer<typeof updateAmountSchema>;
