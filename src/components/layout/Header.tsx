"use client";

import { User as UserIcon, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { resolvePageTitle } from "@/lib/navigation"; // 🛡️ Centralized lookup path

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string) {
  if (!name) return null;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const initials = getInitials(user?.full_name);

  // 🧠 THE SINGLE SOURCE OF TRUTH: Title resolution happens dynamically on the fly
  const parsedTitle = resolvePageTitle(pathname);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out: " + error);
    }
  };

  return (
    <header
      style={{ backgroundColor: "#252834" }} // Soft premium charcoal layout tone
      className="flex h-16 items-center justify-between border-b border-white/5 px-6 text-white font-sans antialiased shadow-sm select-none"
    >
      {/* Left Side: Dynamic Page Title */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-page-heading font-black tracking-tight text-white leading-none uppercase animate-in fade-in duration-200">
          {parsedTitle}
        </h1>
      </div>

      {/* Right Side: Notifications & Account Management */}
      <div className="flex items-center gap-4">
        <div className="text-white/70 hover:text-white transition-colors">
          <NotificationsBell />
        </div>

        {/* Account Details Tray */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/5">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-sm font-bold text-white/90 leading-none">
              {user?.full_name || "Platform Admin"}
            </span>
            <span className="text-small text-white/40 font-mono mt-1">
              {user?.email || "admin@itr-platform.com"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border border-white/10 rounded-none cursor-pointer hover:opacity-90 transition-opacity">
                <AvatarFallback className="bg-white text-[#0087ff] rounded-none text-xs font-black">
                  {initials ? initials : <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 mt-2 rounded-none border border-surface-border bg-card shadow-soft"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold text-secondary leading-none">
                    {user?.full_name || "Platform Admin"}
                  </p>
                  <p className="text-xs font-mono leading-none text-content-muted">
                    {user?.email || "admin@itr-platform.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-surface-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-none cursor-pointer font-medium text-xs py-2.5"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out of Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
