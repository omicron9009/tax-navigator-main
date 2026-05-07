import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/page-states";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/notifications/")({ component: NotificationsPage });

function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => api<any>("/notifications", { query: { page: 1, page_size: 50 } }),
  });
  const items: any[] = data?.items || data?.notifications || data || [];

  const markAll = useMutation({
    mutationFn: () => api("/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {items.length > 0 && <Button variant="outline" onClick={() => markAll.mutate()}>Mark all read</Button>}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." icon={<Bell className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y">
            {items.map((n: any) => (
              <li key={n.id || n.notification_id} className={cn("flex gap-3 px-4 py-3", !n.is_read && "bg-primary/5")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-primary")} />
                <div className="flex-1">
                  <p className="text-sm">{n.message || n.title}</p>
                  {n.created_at && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {(() => { try { return formatDistanceToNow(new Date(n.created_at), { addSuffix: true }); } catch { return ""; } })()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
