"use client";

import { User as UserIcon, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Import your Dropdown Menu components (assuming shadcn/ui)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title?: string;
}

// Helper to get initials
function getInitials(name?: string) {
  if (!name) return null;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  // Grab 'logout' from your auth hook
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = getInitials(user?.full_name);

  const handleLogout = async () => {
    try {
      // Call your auth context's logout method to invalidate the cookie/state
      await logout();
      toast.success("Logged out successfully");
      router.push("/login"); // Redirect to login page
    } catch (error) {
      toast.error("Failed to log out: " + error);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {/* Left Side: Current Page Title */}
      <h1 className="text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h1>

      {/* Right Side: Notifications & Account */}
      <div className="flex items-center gap-4">
        <NotificationsBell />

        {/* Account Details */}
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="hidden md:flex flex-col items-end text-sm">
            <span className="font-medium leading-none">
              {user?.full_name || "Loading..."}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {user?.email || "..."}
            </span>
          </div>

          {/* The Dropdown Wrapper */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {initials ? initials : <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            {/* Dropdown Content */}
            <DropdownMenuContent align="end" className="w-56 mt-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.full_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
