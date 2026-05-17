// src/features/notifications/NotificationsView.tsx
import { api } from "@/lib/api";
import NotificationsList from "./NotificationsList";
import type { NotificationsResponse } from "./types";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    unread_only?: string;
  }>;
}

export async function NotificationsView({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  // 1. Core Parameter Extraction
  const page = Number(resolvedParams.page) || 1;
  const unreadOnly = resolvedParams.unread_only === "true";

  let initialData: NotificationsResponse = {
    items: [],
    total: 0,
    page_size: 20,
    unread_count: 0,
  };

  try {
    // 2. Concurrently fetch the alerts layout feed from FastAPI
    initialData = await api<NotificationsResponse>("/notifications", {
      cache: "no-store", // Bypass Next.js edge proxies completely
      query: {
        page,
        page_size: 20,
        unread_only: unreadOnly,
      },
    });
  } catch (error) {
    console.error("Failed to extract active notification matrices:", error);
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-secondary">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Track real-time updates regarding document verifications and tax
          filing status.
        </p>
      </div>

      {/* 3. Pass state parameters cleanly down into the list controller */}
      <NotificationsList
        initialData={initialData}
        activeFilters={{ page, unreadOnly }}
      />
    </div>
  );
}
