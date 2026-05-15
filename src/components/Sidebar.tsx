"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";
import { partnerLinks, executiveLinks, clientLinks } from "@/config/navigation";

interface SidebarProps {
  menuType: "partner" | "executive" | "client";
  userName: string;
  userRole: string;
}

export default function Sidebar({
  menuType,
  userName,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    menuType === "partner"
      ? partnerLinks
      : menuType === "executive"
        ? executiveLinks
        : clientLinks;

  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-6 bg-brand-navy border-r border-white/10">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="flex items-center justify-center w-10 h-10 rounded bg-brand-teal text-white">
          <Landmark size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            PGJ & CO.
          </h1>
          <p className="text-[10px] font-medium text-white/60 tracking-wider uppercase">
            Tax Consultants
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-brand-teal text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
            alt={userName}
            className="w-10 h-10 rounded-full bg-white/10"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-white truncate">
              {userName}
            </span>
            <span className="text-xs text-white/60 truncate">{userRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
