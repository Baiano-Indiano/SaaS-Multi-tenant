import { db } from "./db";
import { notifications } from "./db/schema";
import { pusherServer } from "./pusher";
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

	// 2. Trigger Pusher Event for Real-time user notification
	const userChannel = `user-${userId}`;
	pusherServer.trigger(userChannel, "notification", {
		payload: notificationData
	}).catch((e) => {
		console.error("[Pusher] User notification failed:", e);
	});
 
	// 3. Trigger Pusher Event for Real-time organization notifications
	if (organizationId) {
		const orgChannel = `org-${organizationId}`;
		pusherServer.trigger(orgChannel, "notification", {
			payload: notificationData
		}).catch((e) => {
			console.error("[Pusher] Org notification failed:", e);
		});
	}

	return id;
}
