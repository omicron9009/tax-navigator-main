import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, LogOut, Sun, Moon, Menu, X,
  LayoutDashboard, Users, UserCog, FileText, ClipboardList, ScrollText, Mail, Folder, FileCheck,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const NAV: Record<Role, { to: string; label: string; icon: any }[]> = {
  PARTNER: [
    { to: "/partner", label: "Dashboard", icon: LayoutDashboard },
    { to: "/partner/clients", label: "Clients", icon: Users },
    { to: "/partner/executives", label: "Executives", icon: UserCog },
    { to: "/partner/documents", label: "Documents", icon: FileText },
    { to: "/partner/onboarding", label: "Onboarding Form", icon: ClipboardList },
    { to: "/partner/audit", label: "Audit Log", icon: ScrollText },
    { to: "/partner/email-config", label: "Email Config", icon: Mail },
  ],
  EXECUTIVE: [
    { to: "/executive", label: "Dashboard", icon: LayoutDashboard },
    { to: "/executive/clients", label: "My Clients", icon: Users },
    { to: "/executive/documents", label: "Documents", icon: FileText },
    { to: "/executive/onboarding", label: "Onboarding Form", icon: ClipboardList },
  ],
  CLIENT: [
    { to: "/client", label: "Dashboard", icon: LayoutDashboard },
    { to: "/client/filings", label: "My Filings", icon: Folder },
    { to: "/client/onboarding", label: "Onboarding Form", icon: ClipboardList },
    { to: "/client/notifications", label: "Notifications", icon: Bell },
  ],
};

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--primary)" />
        <path d="M9 11h14M9 16h14M9 21h9" stroke="var(--primary-foreground)" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="font-semibold tracking-tight">ITR Platform</span>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="hidden md:inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-muted-foreground">
      {role}
    </span>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function NotificationsBell() {
  const qc = useQueryClient();
  const { data: count } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 60_000,
  });
  const { data: list } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => api<any>("/notifications", { query: { page: 1, page_size: 20 } }),
  });
  const markAll = useMutation({
    mutationFn: () => api("/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const markOne = useMutation({
    mutationFn: (id: string) =>
      api("/notifications/mark-read", { method: "POST", body: { notification_ids: [id] } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items: any[] = list?.items || list?.notifications || list || [];
  const unread = count?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="text-sm font-semibold">Notifications</div>
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} disabled={!items.length}>
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-6 w-6 opacity-50" />
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n: any) => (
                <li
                  key={n.id || n.notification_id}
                  className={cn(
                    "flex gap-3 px-4 py-3 hover:bg-muted/60 cursor-pointer",
                    !n.is_read && "bg-primary/5",
                  )}
                  onClick={() => !n.is_read && markOne.mutate(n.id || n.notification_id)}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.is_read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.message || n.title}</p>
                    {n.created_at && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {(() => { try { return formatDistanceToNow(new Date(n.created_at), { addSuffix: true }); } catch { return ""; } })()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function Sidebar({ role, mobileOpen, onClose }: { role: Role; mobileOpen: boolean; onClose: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV[role];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed md:sticky top-0 z-50 md:z-auto h-screen w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="text-sidebar-foreground"><Logo /></div>
          <Button variant="ghost" size="icon" className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const active = path === item.to || (item.to !== "/partner" && item.to !== "/executive" && item.to !== "/client" && path.startsWith(item.to));
            const isHomeMatch = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  (active || isHomeMatch)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3 text-[11px] text-sidebar-foreground/50">
          ITR Filing Platform · v1
        </div>
      </aside>
    </>
  );
}

export function AppShell({ children, requiredRole }: { children: React.ReactNode; requiredRole: Role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    } else if (user.role !== requiredRole) {
      const dest = user.role === "PARTNER" ? "/partner" : user.role === "EXECUTIVE" ? "/executive" : "/client";
      navigate({ to: dest });
    }
  }, [user, requiredRole, navigate]);

  if (!user || user.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const initials = (user.full_name || user.email || "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar role={user.role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <RoleBadge role={user.role} />
          <div className="ml-auto flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-muted">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[11px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
                    {user.full_name || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.full_name || "Signed in"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export { Logo, FileCheck };
