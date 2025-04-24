export interface IBudget {
	id: number;
	userId: number;
	sharedUserId?: number | null;
	categoryId: number;
	limitAmount: number;
	currentAmount: number;
	month: Date;
}
