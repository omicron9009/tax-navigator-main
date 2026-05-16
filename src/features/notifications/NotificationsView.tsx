// src/features/notifications/NotificationsView.tsx
import { api } from "@/lib/api";
import NotificationsList from "./NotificationsList";
import type { NotificationsResponse } from "./types";

export async function NotificationsView({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Parse the URL parameters safely
  const page = Number(searchParams?.page) || 1;
  const unreadOnly = searchParams?.unread_only === "true";

  // Pass them to your FastAPI backend
  const initialData = await api<NotificationsResponse>("/notifications", {
    cache: "no-store",
    query: {
      page: page,
      unread_only: unreadOnly,
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Stay updated on your account activity.
        </p>
      </div>

      <NotificationsList
        initialData={initialData}
        activeFilters={{ page, unreadOnly }}
      />
    </div>
  );
}
