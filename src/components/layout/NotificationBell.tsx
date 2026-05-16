"use client";
import { useEffect, useState } from "react";
import { Bell, Check, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getAuthToken } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Match the schema from your FastAPI docs
interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!getAuthToken()) return;

      try {
        const res = await api<{
          items: Notification[];
          total: number;
          unread_count: number;
        }>("/notifications", {
          query: { page: 1, page_size: 20 },
        });

        setItems(res?.items || []);
        setUnreadCount(res?.unread_count || 0);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    const timeout = setTimeout(() => {
      fetchNotifications();
    }, 0);

    const interval = setInterval(fetchNotifications, 60_000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const handleMarkOne = async (id: string) => {
    try {
      await api("/notifications/mark-read", {
        method: "POST",
        body: { notification_ids: [id] },
      });

      // Update local state instantly for snappy UI
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api("/notifications/mark-all-read", {
        method: "POST",
      });
      setUnreadCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Helper to format the date string cleanly
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-sm">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="max-h-[400px]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You have no notifications.
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer",
                    !notification.is_read && "bg-primary/5",
                  )}
                  onClick={() =>
                    !notification.is_read && handleMarkOne(notification.id)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDate(notification.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
