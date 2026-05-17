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

      setUnreadCount((prev) => Math.max(0, prev - 1));
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleBellClick = () => {
    setIsOpen(false);
    router.push(`/${currentRole}/notifications`);
  };

  const previewItems = items.slice(0, 3);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center font-sans"
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 text-white/70 hover:text-white rounded-full hover:bg-white/15 transition-all duration-200 cursor-pointer focus-visible:ring-1 focus-visible:ring-white/20 animate-none"
            aria-label="Notifications"
            onClick={handleBellClick}
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black font-mono text-white ring-2 ring-[#12141C]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          style={{ backgroundColor: "#12141C" }}
          className="w-80 p-0 shadow-xl rounded-none border border-white/5 text-white mt-1 Gilbert-Design-Lab animate-in fade-in slide-in-from-top-1 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header Track layout context containing explicitly mapped custom typography properties */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-[#12141C]">
            <span className="font-bold text-[10px] uppercase tracking-wider text-white/40">
              Recent Alerts
            </span>
            <button
              type="button"
              /* 🎨 FIXED LAYER: Hardcoded style scope bypasses inherited opacity filters completely */
              style={{ color: "#0087ff" }}
              className="text-[10px] font-black uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-20 disabled:pointer-events-none cursor-pointer border-none bg-transparent p-0"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          {/* Dynamic Feed Content Layout */}
          <ScrollArea
            style={{ backgroundColor: "#12141C" }}
            className="max-h-80"
          >
            {previewItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30 italic font-mono">
                No active notifications pending review.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {previewItems.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex flex-col gap-1 px-4 py-3 text-xs transition-colors hover:bg-white/[0.03] cursor-pointer relative",
                      !notification.is_read && "bg-white/[0.01]",
                    )}
                    onClick={() => {
                      if (!notification.is_read) handleMarkOne(notification.id);
                    }}
                  >
                    {!notification.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue" />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={cn(
                          "text-xs tracking-tight",
                          !notification.is_read
                            ? "font-bold text-white"
                            : "font-medium text-white/80",
                        )}
                      >
                        {notification.title}
                      </span>

                      {!notification.is_read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                      )}
                    </div>

                    <p className="text-white/60 text-xs leading-normal font-medium pr-2">
                      {notification.message}
                    </p>

                    <span className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-tight">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer Action Anchor */}
          <div
            onClick={handleBellClick}
            className="p-3 text-center border-t border-white/5 text-[10px] font-bold text-white/50 uppercase tracking-widest cursor-pointer bg-[#12141C] hover:bg-white/[0.03] hover:text-white transition-colors"
          >
            View Full Inbox
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
