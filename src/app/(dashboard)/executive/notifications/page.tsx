// src/app/partner/notifications/page.tsx
import { NotificationsView } from "@/features/notifications/NotificationsView";

export default function PartnerNotificationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <NotificationsView searchParams={searchParams} />;
}
