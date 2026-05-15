import Sidebar from "@/components/Sidebar";
// Notice we no longer import the links here!

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Pass the string identifier instead of the array */}
      <Sidebar
        menuType="partner"
        userName="Prakash G. Joshi"
        userRole="Senior Partner"
      />

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
