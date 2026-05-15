import {
  PieChart,
  Users,
  UserSquare2,
  FileText,
  Settings,
  Briefcase,
  Receipt,
  HelpCircle,
  FolderLock,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean; // <-- Add this new optional property
};

export const partnerLinks: NavItem[] = [
  // Add exact: true to the root route
  { name: "Overview", href: "/partner", icon: PieChart, exact: true },
  { name: "All Clients", href: "/partner/clients", icon: Users },
  { name: "Team Management", href: "/partner/executives", icon: UserSquare2 },
];

export const executiveLinks: NavItem[] = [
  // Add exact: true to the root route
  { name: "My Dashboard", href: "/executive", icon: PieChart, exact: true },
  { name: "Assigned Clients", href: "/executive/clients", icon: Users },
];

export const clientLinks: NavItem[] = [
  // Add exact: true to the root route
  { name: "My Portal", href: "/client", icon: PieChart, exact: true },
  { name: "My Documents", href: "/client/filings", icon: FileText },
];
