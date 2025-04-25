export interface ITransaction {
	id: number;
	userId: number;
	amount: number;
	type: "INCOME" | "EXPENSE";
	categoryId?: number | null;
	description?: string | null;
	paymentMethodId?: number | null;
	date: Date;
	scheduledTransactionId?: number | null;
	debtId?: number | null;
	contributionId?: number | null;
	budgetId?: number | null;
}
