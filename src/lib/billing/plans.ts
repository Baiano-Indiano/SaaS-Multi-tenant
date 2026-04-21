export const PLANS = {
	FREE: {
		id: "free",
		name: "Free Tier",
		maxMembers: 2,
		customRoles: false,
		price: "$0",
	},
	STARTER: {
		id: "starter",
		name: "Starter",
		maxMembers: 5,
		customRoles: true,
		price: "$19",
	},
	PRO: {
		id: "pro",
		name: "Pro",
		maxMembers: 20,
		customRoles: true,
		price: "$49",
	}
} as const;

export type PlanType = keyof typeof PLANS;
export type PlanId = typeof PLANS[PlanType]["id"];
