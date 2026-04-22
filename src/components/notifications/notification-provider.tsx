"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";

interface NotificationContextType {
	unreadCount: number;
	setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		if (!session?.user) return;

		let eventSource: EventSource | null = null;
		let retryCount = 0;
		const maxRetries = 5;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let stopped = false;

		const connect = () => {
			if (stopped) return;
			if (eventSource) eventSource.close();

			eventSource = new EventSource("/api/notifications/stream");

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);

					if (data.type === "CONNECTED") {
						console.log("Real-time notifications connected:", data.userId);
						retryCount = 0;
						return;
					}

					if (data.payload) {
						const notification = typeof data.payload === 'string' 
							? JSON.parse(data.payload) 
							: data.payload;
						
						// Show Toast
						toast(notification.title, {
							description: notification.message,
							action: notification.link ? {
								label: "View",
								onClick: () => window.location.href = notification.link!
							} : undefined,
						});

						// Update unread count (optimistic increment)
						setUnreadCount(prev => prev + 1);
					}
				} catch (err) {
					console.error("Error parsing notification:", err);
				}
			};

			eventSource.onerror = () => {
				eventSource?.close();
				eventSource = null;

				if (stopped) return;
				if (retryCount >= maxRetries) {
					console.warn("Notifications stream paused after max retries.");
					return;
				}

				retryCount += 1;
				const delay = Math.min(3000 * retryCount, 15000);
				reconnectTimer = setTimeout(connect, delay);
			};
		};

		connect();

		return () => {
			stopped = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			if (eventSource) eventSource.close();
		};
	}, [session?.user, session?.session?.activeOrganizationId, setUnreadCount]);

	return (
		<NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
			{children}
		</NotificationContext.Provider>
	);
}

export const useNotifications = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error("useNotifications must be used within a NotificationProvider");
	}
	return context;
};
