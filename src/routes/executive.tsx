import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/executive")({
  component: () => <AppShell requiredRole="EXECUTIVE"><Outlet /></AppShell>,
});
