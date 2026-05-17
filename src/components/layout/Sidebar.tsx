"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { NAVIGATION_MANIFEST, type MenuType } from "@/lib/navigation"; // 🛡️ Load master configuration tokens

interface SidebarProps {
  menuType: MenuType; // Strictly typed to "partner" | "executive" | "client"
}

export default function Sidebar({ menuType }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🧠 THE SINGLE SOURCE OF TRUTH: Array mapping derived cleanly from the central manifest matrix
  const navItems = NAVIGATION_MANIFEST[menuType];

  return (
    <div className="relative flex h-screen font-sans antialiased select-none shrink-0">
      <aside
        style={{ backgroundColor: "#071B3B" }} // Premium Midnight Slate-Blue
        className={`flex flex-col h-full py-6 text-white border-r border-white/5 transition-all duration-300 relative ${
          isCollapsed ? "w-16 px-2" : "w-64 px-4"
        }`}
      >
        {/* Brand Header Section */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-2 mb-10 group hover:opacity-90 transition-opacity focus:outline-none rounded-none ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {/* Logo container flipped to primary brand blue text for stark legibility */}
          <div className="flex items-center justify-center w-10 h-10 bg-white text-[#0087ff] shrink-0 font-bold rounded-none shadow-sm transition-transform group-hover:scale-105">
            <Landmark size={20} />
          </div>

          {!isCollapsed && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-sm font-black tracking-tight leading-none text-white uppercase">
                ITR Platform
              </h1>
              <p className="text-[9px] font-bold text-white/40 tracking-widest uppercase mt-1">
                Production v2.0
              </p>
            </div>
          )}
        </Link>

        {/* Navigation Item Tracks */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 py-2.5 transition-all duration-150 rounded-none text-xs group ${
                  isCollapsed ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? // Active links use a translucent white block with your v4 brand blue edge border
                      "bg-white/10 text-white border-l-2 border-l-[#0087ff] font-bold"
                    : "text-white/60 hover:bg-white/5 hover:text-white font-medium"
                }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-[#0087ff]"
                      : "text-white/50 group-hover:text-white"
                  }`}
                />

                {!isCollapsed && (
                  <span className="animate-in fade-in duration-200 truncate">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Minimal Production Footer Signature Block */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-white/5 text-[9px] text-white/20 font-mono text-center tracking-wider uppercase animate-in fade-in duration-200">
            Secure Core Node
          </div>
        )}
      </aside>

      {/* Floating Width Toggle Trigger */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ backgroundColor: "#071B3B" }}
        className="absolute top-7 -right-3 z-50 flex h-6 w-6 items-center justify-center border border-white/10 text-white/60 hover:text-white shadow-md cursor-pointer transition-transform hover:scale-110 rounded-none"
        aria-label="Toggle navigation bar width"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );
}
