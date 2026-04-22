import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/upstash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
	try {
		session = await auth.api.getSession({
			headers: req.headers,
		});
	} catch (error) {
		console.error("Failed to resolve auth session for notifications stream:", error);
		return new Response("Session unavailable", { status: 503 });
	}

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

			// 2. Subscribe to Upstash streams via polling (XREAD)
			// We use '$' to only get new messages after connection
			const userStream = `stream:user:${userId}`;
			const orgStream = activeOrgId ? `stream:org:${activeOrgId}` : null;
			
			let lastUserMsgId = "$";
			let lastOrgMsgId = "$";
			let lastHeartbeat = Date.now();

			// Polling loop
			while (!req.signal.aborted) {
				try {
					// 3. Heartbeat (every 15 seconds) to keep connection alive on Edge
					if (Date.now() - lastHeartbeat > 15000) {
						controller.enqueue(encoder.encode(": ping\n\n"));
						lastHeartbeat = Date.now();
					}

					const streams = { [userStream]: lastUserMsgId };
					if (orgStream) streams[orgStream] = lastOrgMsgId;

					const keys = Object.keys(streams);
					const ids = Object.values(streams);

					interface RedisStreamData {
						payload: unknown;
					}

					const data = (await redis.xread(
						keys, 
						ids, 
						{ 
							count: 5,
							blockMS: 0 
						}
					)) as { name: string; messages: { id: string; data: RedisStreamData }[] }[] | null;

					if (data && data.length > 0) {
						for (const streamResult of data) {
							const streamName = streamResult.name;
							const messages = streamResult.messages;

							for (const msg of messages) {
								sendEvent({ 
									channel: streamName, 
									payload: msg.data.payload 
								});
								
								// Update last ID to avoid duplicate reads
								if (streamName === userStream) lastUserMsgId = msg.id;
								if (streamName === orgStream) lastOrgMsgId = msg.id;
							}
						}
					}
					
					// Small delay to prevent infinite loop spamming if no data
					// Reducing to 1s for slightly better responsiveness while still being light
					await new Promise(resolve => setTimeout(resolve, 1000));
				} catch (err) {
					console.error("Stream read error:", err);
					// Wait longer on error before retry
					await new Promise(resolve => setTimeout(resolve, 5000));
				}
			}
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
