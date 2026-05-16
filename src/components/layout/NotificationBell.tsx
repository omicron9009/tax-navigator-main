"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getAuthToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

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
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const currentRole = pathname.split("/")[1] || "partner";
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

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking this button
    try {
      await api("/notifications/mark-all-read", {
        method: "POST",
      });
      setUnreadCount(0);
      items.forEach((n) => handleMarkOne(n.id));
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

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a slight delay so the user can move their mouse into the popover content
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleBellClick = () => {
    setIsOpen(false);
    router.push(`/${currentRole}/notifications`);
  };

  // Limit to latest 4 notifications for the preview
  const previewItems = items.slice(0, 4);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center"
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Notifications"
            onClick={handleBellClick}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        {/* Added onMouseEnter/Leave here to keep it open when hovering the dropdown itself */}
        <PopoverContent
          align="end"
          className="w-80 p-0 shadow-lg rounded-none border-surface-border"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between border-b px-4 py-3 bg-secondary text-secondary-foreground">
            <span className="font-semibold text-sm">Recent Notifications</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-transparent"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>

          <ScrollArea className="max-h-100">
            {previewItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                You have no notifications.
              </div>
            ) : (
              <div className="flex flex-col">
                {previewItems.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex flex-col gap-1 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer",
                      !notification.is_read && "bg-primary/5",
                    )}
                    onClick={() => {
                      if (!notification.is_read) handleMarkOne(notification.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-secondary">
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

          {/* Footer link to view all */}
          <div
            className="p-3 text-center border-t text-sm font-medium text-primary cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleBellClick}
          >
            View all notifications
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
