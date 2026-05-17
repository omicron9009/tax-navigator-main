// src/lib/navigation.ts
import {
  PieChart,
  Users,
  UserSquare2,
  Bell,
  Mail,
  Form,
  FileText,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

export const NAVIGATION_MANIFEST = {
  partner: [
    { name: "Overview", href: "/partner", icon: PieChart, exact: true },
    { name: "All Clients", href: "/partner/clients", icon: Users },
    { name: "Executives", href: "/partner/executives", icon: UserSquare2 },
    { name: "Notifications", href: "/partner/notifications", icon: Bell },
    { name: "Audit Log", href: "/partner/audit", icon: Form },
    { name: "Email Configuration", href: "/partner/email-config", icon: Mail },
    { name: "Onboarding Form", href: "/partner/onboarding", icon: Form },
  ],
  executive: [
    { name: "My Dashboard", href: "/executive", icon: PieChart, exact: true },
    { name: "Assigned Clients", href: "/executive/clients", icon: Users },
    // { name: "Document Types", href: "/executive/documents", icon: FileText },
    { name: "Notifications", href: "/executive/notifications", icon: Bell },
  ],
  client: [
    { name: "My Portal", href: "/client", icon: PieChart, exact: true },
    { name: "My Documents", href: "/client/filings", icon: FileText },
    { name: "Notifications", href: "/client/notifications", icon: Bell },
    { name: "Onboarding Form", href: "/client/onboarding", icon: Form },
  ],
} as const;

export type MenuType = keyof typeof NAVIGATION_MANIFEST;

/**
 * High-leverage router utility to translate any active pathname context directly into its view title.
 * Wipes away the old titleRegistry mapping entirely.
 */
export function resolvePageTitle(pathname: string): string {
  // Flatten all menu tracks into a singular flat map lookup stream at runtime
  const allRoutes = Object.values(NAVIGATION_MANIFEST).flat();

  const match = allRoutes.find((route) =>
    route.exact
      ? pathname === route.href
      : pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  return match ? match.name : "Dashboard";
}
