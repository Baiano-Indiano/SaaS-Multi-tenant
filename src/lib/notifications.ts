import { db } from "./db";
import { notifications } from "./db/schema";
import { redis } from "./upstash";
import { v4 as uuidv4 } from "uuid";

interface SendNotificationParams {
	userId: string;
	organizationId?: string | null;
	type: string;
	title: string;
	message: string;
	link?: string;
}

export async function sendNotification({
	userId,
	organizationId,
	type,
	title,
	message,
	link,
}: SendNotificationParams) {
	const id = uuidv4();

	const notificationData = {
		id,
		userId,
		organizationId: organizationId || null,
		type,
		title,
		message,
		link,
		createdAt: new Date(),
	};

	// 1. Persist to Database
	await db.insert(notifications).values(notificationData);

	// 2. Add to Redis Stream for Real-time
	// We use Redis Streams (XADD) instead of Publish because it works better with Upstash REST
	const userStream = `stream:user:${userId}`;
	await redis.xadd(userStream, "*", { 
		payload: JSON.stringify(notificationData) 
	}, { 
		trim: { type: "MAXLEN", threshold: 100, comparison: "~" } 
	});
 
	// 3. If it's an organization event, add to org stream too
	if (organizationId) {
		const orgStream = `stream:org:${organizationId}`;
		await redis.xadd(orgStream, "*", { 
			payload: JSON.stringify(notificationData) 
		}, { 
			trim: { type: "MAXLEN", threshold: 100, comparison: "~" } 
		});
	}

	return id;
}
