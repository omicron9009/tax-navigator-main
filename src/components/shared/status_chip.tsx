import React from "react";
import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: string;
  showIcon?: boolean; // New prop to toggle between plain text and icon modes
  className?: string; // Allows overriding styles if needed in specific layouts
}

export function StatusChip({
  status,
  showIcon = false,
  className,
}: StatusChipProps) {
  // Map statuses to their specific color variants
  const variants: Record<string, string> = {
    Initiated: "bg-slate-100 text-slate-600",
    Onboarding: "bg-blue-50 text-blue-600",
    Processing: "bg-amber-50 text-amber-700",
    Computation: "bg-purple-50 text-purple-600",
    Filing: "bg-indigo-50 text-indigo-600",
    Payment: "bg-orange-50 text-orange-600",
    Completed: "bg-emerald-50 text-emerald-600",
  };

  const colorClass = variants[status] || "bg-gray-100 text-gray-600";

  // Helper function to render the correct SVG icon
  const renderIcon = () => {
    if (!showIcon) return null;

    if (status === "Completed") {
      // Filled circle WITH tick mark
      return (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }

    // Standard filled circle WITHOUT tick mark for all other statuses
    return (
      <svg className="h-2 w-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        colorClass,
        className,
      )}
    >
      {renderIcon()}
      {status}
    </span>
  );
}
