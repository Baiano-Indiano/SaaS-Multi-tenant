import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/upstash";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	if (!session || !session.user) {
		return new Response("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;
	const activeOrgId = (session.session as { activeOrganizationId?: string }).activeOrganizationId;

	// 1. Create a stream for the client
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			// Function to write SSE formatted data
			const sendEvent = (data: { type?: string; userId?: string; channel?: string; payload?: unknown }) => {
				const message = `data: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(encoder.encode(message));
			};

			// Send initial heart-beat or connection success
			sendEvent({ type: "CONNECTED", userId });

			// 2. Subscribe to Upstash channels
			// Channel for private user notifications
			const userChannel = `user:${userId}`;
			const subscriber = redis.subscribe(userChannel);

			subscriber.on("message", (message) => {
				sendEvent({ channel: userChannel, payload: message });
			});

			// If user is in an organization, subscribe to org channel too
			if (activeOrgId) {
				const orgChannel = `org:${activeOrgId}`;
				const orgSubscriber = redis.subscribe(orgChannel);
				orgSubscriber.on("message", (message) => {
					sendEvent({ channel: orgChannel, payload: message });
				});
			}

			// 3. Handle client disconnection
			req.signal.addEventListener("abort", () => {
				// Note: Upstash subscriber handles cleanup if the runtime kills the function
				// but explicit close is better if the environment allows
				controller.close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			"Connection": "keep-alive",
		},
	});
}
