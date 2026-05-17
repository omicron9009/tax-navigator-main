// src/app/executive/notifications/page.tsx
import { NotificationsView } from "@/features/notifications/NotificationsView";

interface RoutePageProps {
  searchParams: Promise<{ page?: string; unread_only?: string }>;
}

// 1. Root page catches the Next.js runtime injection slot
export default function ExecutiveNotificationsPage({
  searchParams,
}: RoutePageProps) {
  return <NotificationsView searchParams={searchParams} />;
}
