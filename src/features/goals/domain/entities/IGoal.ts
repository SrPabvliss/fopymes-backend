export interface IGoal {
	id: number;
	userId: number;
	sharedUserId?: number | null;
	name: string;
	targetAmount: number;
	currentAmount: number;
	endDate: Date;
	contributionFrequency: number;
	contributionAmount: number;
	categoryId?: number | null;
}
