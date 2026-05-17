// src/app/partner/notifications/page.tsx
import { NotificationsView } from "@/features/notifications/NotificationsView";

interface RoutePageProps {
  searchParams: Promise<{ page?: string; unread_only?: string }>;
}

// 1. Root page catches the Next.js runtime injection slot
export default function PartnerNotificationsPage({
  searchParams,
}: RoutePageProps) {
  // 2. Pass it down cleanly as a prop to your view feature component
  return <NotificationsView searchParams={searchParams} />;
}
