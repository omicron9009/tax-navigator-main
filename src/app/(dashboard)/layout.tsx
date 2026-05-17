"use client";

import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  // Map role to sidebar menuType
  const menuType: "partner" | "executive" | "client" =
    user?.role === "PARTNER"
      ? "partner"
      : user?.role === "EXECUTIVE"
        ? "executive"
        : "client";

  // Show nothing while loading to avoid role mismatch flash
  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar menuType={menuType} />

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header title="Overview" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
