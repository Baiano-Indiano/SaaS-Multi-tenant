export const PLANS = {
	FREE: {
		id: "free" as const,
		name: "Gratuito",
		description: "Ideal para começar e testar a plataforma.",
		maxMembers: 2,
		maxProjects: 3,
		customRoles: false,
		customDomains: false,
		rateLimit: 600, // 10 req/s (600/min)
		price: "R$ 0",
		priceId: null,
		features: [
			"Até 2 membros",
			"Acesso básico",
			"Suporte via comunidade",
		],
	},
	STARTER: {
		id: "starter" as const,
		name: "Starter",
		description: "Para pequenos times que precisam de mais poder.",
		maxMembers: 10,
		maxProjects: 10,
		customRoles: true,
		customDomains: false,
		rateLimit: 3000, // 50 req/s (3000/min)
		price: "R$ 19,90",
		priceId: "price_1TOSU9Kgmt5iTW4YF8ea1wPQ",
		features: [
			"Até 10 membros",
			"Roles customizadas",
			"Suporte prioritário",
			"Analytics básico",
		],
		popular: true,
	},
	PRO: {
		id: "pro" as const,
		name: "Pro",
		description: "Escalabilidade e controle total para sua empresa.",
		maxMembers: 999,
		maxProjects: 999,
		customRoles: true,
		customDomains: true,
		rateLimit: 6000, // 100 req/s (6000/min)
		price: "R$ 49,90",
		priceId: "price_1TOSUAKgmt5iTW4YAkDAJSxn",
		features: [
			"Membros ilimitados",
			"Roles customizadas ilimitadas",
			"Domínios customizados",
			"Suporte 24/7 dedicado",
			"Analytics avançado",
			"Audit logs",
		],
	}
} as const;

export type PlanType = keyof typeof PLANS;
export type PlanId = typeof PLANS[PlanType]["id"];
