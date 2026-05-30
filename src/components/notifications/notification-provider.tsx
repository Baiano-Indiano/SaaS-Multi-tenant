"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import Pusher from "pusher-js";

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

		const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "pusher-app-key";
		const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

		const pusher = new Pusher(appKey, {
			cluster,
		});

		const userChannelName = `user-${session.user.id}`;
		const userChannel = pusher.subscribe(userChannelName);

		const handleNotification = (data: any) => {
			try {
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

		userChannel.bind("notification", handleNotification);

		const activeOrgId = session.session?.activeOrganizationId;
		const orgChannelName = activeOrgId ? `org-${activeOrgId}` : null;
		let orgChannel: any = null;

		if (orgChannelName) {
			orgChannel = pusher.subscribe(orgChannelName);
			orgChannel.bind("notification", handleNotification);
		}

		return () => {
			userChannel.unbind("notification", handleNotification);
			pusher.unsubscribe(userChannelName);
			if (orgChannel && orgChannelName) {
				orgChannel.unbind("notification", handleNotification);
				pusher.unsubscribe(orgChannelName);
			}
			pusher.disconnect();
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
