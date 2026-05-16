import { NotificationsView } from "@/features/notifications/NotificationsView";

export const metadata = {
  title: "Notifications",
};

export default function Page() {
  // Pass down any role-specific overrides here if you ever need them,
  // otherwise, just render the unified view.
  return <NotificationsView />;
}
