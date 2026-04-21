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

	// 2. Publish to Redis for Real-time
	// We publish to the private user channel
	const userChannel = `user:${userId}`;
	await redis.publish(userChannel, JSON.stringify(notificationData));

	// 3. If it's an organization event, publish to org channel too
	if (organizationId) {
		const orgChannel = `org:${organizationId}`;
		await redis.publish(orgChannel, JSON.stringify(notificationData));
	}

	return id;
}
