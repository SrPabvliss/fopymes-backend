import { ICategory } from "@/categories/domain/entities/ICategory";

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
	category?: ICategory | null;
}
