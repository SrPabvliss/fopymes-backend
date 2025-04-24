import { transactions } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const transactionBaseSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export const createTransactionSchema = transactionBaseSchema
  .extend({
    type: z.enum(["INCOME", "EXPENSE"]),
    category_id: z.number().optional(),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().optional(),
    payment_method_id: z.number().optional(),
    scheduled_transaction_id: z.number().optional(),
    debt_id: z.number().optional(),
    contribution_id: z.number().optional(),
  })
  .omit({
    id: true,
    date: true,
  });

export const updateTransactionSchema = transactionBaseSchema
  .extend({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category_id: z.number().int().positive().optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    description: z.string().optional().nullable(),
    payment_method_id: z.number().optional().nullable(),
    scheduled_transaction_id: z.number().optional().nullable(),
    debt_id: z.number().optional().nullable(),
    contribution_id: z.number().optional().nullable(),
  })
  .partial()
  .omit({
    id: true,
    user_id: true,
    date: true,
  });

export const transactionFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category_id: z.coerce.number().int().positive().optional(),
  payment_method_id: z.coerce.number().int().positive().optional(),
  scheduled_transaction_id: z.coerce.number().int().positive().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
});

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type TransactionResponse = z.infer<typeof selectTransactionSchema>;