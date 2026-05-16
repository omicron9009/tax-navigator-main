"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";

import {
  PieChart,
  Users,
  UserSquare2,
  FileText,
  Bell,
  Mail,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

const partnerLinks: NavItem[] = [
  { name: "Overview", href: "/partner", icon: PieChart, exact: true },
  { name: "All Clients", href: "/partner/clients", icon: Users },
  { name: "Executives", href: "/partner/executives", icon: UserSquare2 },
  { name: "Notifications", href: "/partner/notifications", icon: Bell },
  { name: "Email Configuration", href: "/partner/email-config", icon: Mail },
];

export const executiveLinks: NavItem[] = [
  { name: "My Dashboard", href: "/executive", icon: PieChart, exact: true },
  { name: "Assigned Clients", href: "/executive/clients", icon: Users },
  { name: "Notifications", href: "/executive/notifications", icon: Bell },
];

export const clientLinks: NavItem[] = [
  { name: "My Portal", href: "/client", icon: PieChart, exact: true },
  { name: "My Documents", href: "/client/filings", icon: FileText },
  { name: "Notifications", href: "/client/notifications", icon: Bell },
];

interface SidebarProps {
  menuType: "partner" | "executive" | "client";
}

export default function Sidebar({ menuType }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    menuType === "partner"
      ? partnerLinks
      : menuType === "executive"
        ? executiveLinks
        : clientLinks;

  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-6 bg-brand-navy border-r border-white/10">
      {/* Brand Header */}
      <Link
        href="/"
        className="flex items-center gap-3 px-2 mb-10 group hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 focus:ring-offset-brand-navy rounded-md"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded bg-brand-teal text-white shrink-0 transition-transform group-hover:scale-105">
          <Landmark size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ITR Platform
          </h1>
          <p className="text-[10px] font-medium text-white/60 tracking-wider uppercase">
            Tax Consultants
          </p>
        </div>
      </Link>
      {/* Navigation Links */}
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
    </aside>
  );
}
