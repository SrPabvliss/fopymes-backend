import { z } from "zod";
import { selectDebtSchema } from "@/debts/application/dtos/debt.dto";
import { IDebt } from "@/debts/domain/entities/IDebt";

export class DebtApiAdapter {
	static toApiResponse(debt: IDebt): z.infer<typeof selectDebtSchema> {
		return {
			id: debt.id,
			user_id: debt.userId,
			description: debt.description,
			original_amount: debt.originalAmount,
			pending_amount: debt.pendingAmount,
			due_date: debt.dueDate,
			paid: debt.paid,
			creditor_id: debt.creditorId || null,
			category_id: debt.categoryId || null,
		};
	}

	static toApiResponseList(debts: IDebt[]): z.infer<typeof selectDebtSchema>[] {
		return debts.map(this.toApiResponse);
	}
}
