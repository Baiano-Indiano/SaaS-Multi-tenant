"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "./notification-provider";
import { cn } from "@/lib/utils";

interface Notification {
	id: string;
	title: string;
	message: string;
	type: string;
	readAt: string | null;
	createdAt: string;
}

export function NotificationBell() {
	const { unreadCount, setUnreadCount } = useNotifications();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	// In a real app, we would fetch notifications from an API or Server Action
	// For this phase, we'll simulate the history and mark as read logic
	useEffect(() => {
		if (isOpen) {
			// Mark all as read (optimistically)
			setUnreadCount(0);
		}
	}, [isOpen, setUnreadCount]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className="relative hover:bg-zinc-900 transition-colors"
					>
						<Bell className="h-5 w-5 text-zinc-400" />
						{unreadCount > 0 && (
							<Badge
								variant="destructive"
								className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-zinc-950 animate-in zoom-in"
							>
								{unreadCount}
							</Badge>
						)}
					</Button>
				}
			/>
			<PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800 shadow-2xl" align="end">
				<div className="flex items-center justify-between p-4 border-b border-zinc-800">
					<h3 className="font-semibold text-sm text-zinc-100">Notifications</h3>
					<button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
						Mark all as read
					</button>
				</div>
				<ScrollArea className="h-80">
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full p-8 text-center">
							<Bell className="h-8 w-8 text-zinc-700 mb-2" />
							<p className="text-xs text-zinc-500">No notifications yet.</p>
						</div>
					) : (
						<div className="flex flex-col">
							{notifications.map((n) => (
								<div
									key={n.id}
									className={cn(
										"p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer",
										!n.readAt && "bg-blue-500/5"
									)}
								>
									<div className="flex justify-between items-start mb-1">
										<span className="text-xs font-medium text-zinc-200">{n.title}</span>
										<span className="text-[10px] text-zinc-500">
											{new Date(n.createdAt).toLocaleDateString()}
										</span>
									</div>
									<p className="text-xs text-zinc-400 line-clamp-2">{n.message}</p>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
				<div className="p-2 border-t border-zinc-800 text-center">
					<Button
						variant="ghost"
						className="w-full text-xs text-zinc-500 hover:text-zinc-300"
					>
						View all notifications
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
