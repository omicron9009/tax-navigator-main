"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NotificationsListProps, NotificationItem } from "./types";

export default function NotificationsList({
  initialData,
  activeFilters,
}: NotificationsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [listItems, setListItems] = useState<NotificationItem[]>(
    initialData.items,
  );

  const [prevInitialItems, setPrevInitialItems] = useState<NotificationItem[]>(
    initialData.items,
  );

  if (initialData.items !== prevInitialItems) {
    setListItems(initialData.items);
    setPrevInitialItems(initialData.items);
  }

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null) params.set(key, value);
      else params.delete(key);
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic state patch for snappy feedback click responses
    setListItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );

    try {
      await api("/notifications/mark-read", {
        method: "POST",
        body: { notification_ids: [id] },
      });
      // Force an endpoint invalidate re-fetch down the tree
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error("Failed to mark notification as read");
      setListItems(initialData.items);
    }
  };

  const handleMarkAllRead = async () => {
    if (initialData.unread_count === 0) return;

    setListItems((prev) => prev.map((item) => ({ ...item, is_read: true })));

    try {
      await api("/notifications/mark-all-read", { method: "POST" });
      toast.success("All alerts marked as read");
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error("Failed to execute batch update action");
      setListItems(initialData.items);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtering Control Bar */}
      <div className="flex items-center justify-between border-b border-surface-border pb-1">
        <div className="flex gap-6 text-sm font-medium">
          <button
            onClick={() => updateUrlParams({ unread_only: null, page: "1" })}
            className={`pb-3 relative transition-colors ${
              !activeFilters.unreadOnly
                ? "text-primary border-b-2 border-primary font-semibold"
                : "text-content-muted hover:text-secondary"
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => updateUrlParams({ unread_only: "true", page: "1" })}
            className={`pb-3 relative flex items-center gap-2 transition-colors ${
              activeFilters.unreadOnly
                ? "text-primary border-b-2 border-primary font-semibold"
                : "text-content-muted hover:text-secondary"
            }`}
          >
            Unread
            {initialData.unread_count > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 font-bold rounded-full">
                {initialData.unread_count}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {isPending && (
            <div className="flex items-center gap-2 text-xs text-content-muted tracking-tight">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Syncing...
            </div>
          )}
          {initialData.unread_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="text-xs text-content-muted hover:text-primary transition-colors h-8 px-2 rounded-none"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications Core Content List Block */}
      {listItems.length === 0 ? (
        <Card className="p-16 text-center border border-surface-border shadow-soft bg-card rounded-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-slate-50 border border-slate-100">
            <Inbox className="h-5 w-5 text-content-muted/70" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-secondary">
            {activeFilters.unreadOnly ? "All caught up!" : "Inbox clean"}
          </h3>
          <p className="mt-1 text-xs text-content-muted max-w-sm mx-auto">
            {activeFilters.unreadOnly
              ? "You don't have any unread notifications waiting for review right now."
              : "No system alerts have been logged for this profile yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {listItems.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 border shadow-soft rounded-none transition-all flex flex-row items-start justify-between gap-4 bg-card ${
                !notification.is_read
                  ? "border-l-4 border-l-primary border-surface-border"
                  : "border-surface-border opacity-70"
              }`}
            >
              {/* Left Side: Icon & Text Stack */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`mt-0.5 p-1.5 shrink-0 border ${
                    !notification.is_read
                      ? "bg-blue-50 border-blue-100 text-primary"
                      : "bg-slate-50 border-slate-100 text-content-muted/60"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                    {notification.title || "System Alert"}
                  </span>

                  <div className="text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {notification.user_name && (
                      <span className="font-bold text-slate-600 dark:text-slate-300 mr-1">
                        {notification.user_name}
                      </span>
                    )}
                    <span className="text-content-muted/90">
                      {notification.message}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Timestamp & Metadata Stack */}
              <div className="flex flex-col items-end gap-2 shrink-0 pl-2">
                <span className="text-[11px] text-content-muted/70 font-mono whitespace-nowrap">
                  {new Date(notification.created_at).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>

                <div className="flex items-center gap-2 mt-1">
                  {notification.related_client_id && (
                    <span className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-50 border border-surface-border text-content-muted/80 uppercase tracking-tight">
                      ID: {notification.related_client_id.substring(0, 8)}
                    </span>
                  )}

                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                      className="p-1 border border-surface-border text-content-muted hover:border-primary hover:text-primary hover:bg-slate-50 transition-all rounded-none bg-card"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Container */}
      {initialData.total > initialData.page_size && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            disabled={activeFilters.page <= 1 || isPending}
            onClick={() =>
              updateUrlParams({ page: String(activeFilters.page - 1) })
            }
            className="px-3 py-1.5 border border-surface-border text-xs disabled:opacity-40 hover:bg-muted transition-colors rounded-none bg-card"
          >
            Previous
          </button>
          <span className="text-xs text-content-muted px-2">
            Page {activeFilters.page}
          </span>
          <button
            disabled={listItems.length < initialData.page_size || isPending}
            onClick={() =>
              updateUrlParams({ page: String(activeFilters.page + 1) })
            }
            className="px-3 py-1.5 border border-surface-border text-xs disabled:opacity-40 hover:bg-muted transition-colors rounded-none bg-card"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
