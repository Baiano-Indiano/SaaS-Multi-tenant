import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { notifications } from "@/lib/db/schema";
import { lt } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const _start = Date.now();
	logger.info('cron', '➜ GET /api/cron/cleanup-notifications');
	const authHeader = req.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		await db
			.delete(notifications)
			.where(lt(notifications.createdAt, thirtyDaysAgo));

		logger.info('cron', `✓ GET /api/cron/cleanup-notifications | 200 | ${Date.now() - _start}ms`);
		return new Response(JSON.stringify({ 
			message: "Cleanup successful", 
			deletedAt: new Date().toISOString(),
			thirtyDaysAgo: thirtyDaysAgo.toISOString() 
		}), { status: 200 });
	} catch (error) {
		logger.error('cron', '✗ GET /api/cron/cleanup-notifications | Cleanup failed', error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
