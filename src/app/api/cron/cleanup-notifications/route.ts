import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { lt } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

		return new Response(JSON.stringify({ 
			message: "Cleanup successful", 
			deletedAt: new Date().toISOString(),
			thirtyDaysAgo: thirtyDaysAgo.toISOString() 
		}), { status: 200 });
	} catch (error) {
		console.error("Cleanup failed:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
