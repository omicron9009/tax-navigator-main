import { cn } from "@/lib/utils";

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type FilingStatus =
  | "INITIATED"
  | "ON_BOARDING"
  | "PROCESSING"
  | "COMPUTATION"
  | "FILING"
  | "PAYMENT"
  | "COMPLETED"
  | "HALTED";

const statusStyles: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING_VERIFICATION: "border-amber-200 bg-amber-50 text-amber-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-700",
};

export function AccountStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = status.toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        statusStyles[normalized] ||
          "border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
    >
      {formatStatus(normalized)}
    </span>
  );
}

const FILING_STYLES: Record<FilingStatus, string> = {
  INITIATED: "bg-info/15 text-info border-info/30",
  ON_BOARDING:
    "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  PROCESSING: "bg-warning/20 text-warning-foreground border-warning/40",
  COMPUTATION:
    "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  FILING: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  PAYMENT:
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  COMPLETED: "bg-success/15 text-success border-success/30",
  HALTED: "bg-destructive/15 text-destructive border-destructive/30",
};

export function FilingStatusBadge({
  status,
  className,
}: {
  status: FilingStatus | string;
  className?: string;
}) {
  const s = (status as FilingStatus) || "INITIATED";
  const style =
    FILING_STYLES[s] || "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.replace(/_/g, " ")}
    </span>
  );
}

export type DocStatus = "PENDING_UPLOAD" | "UPLOADED" | "REJECTED" | "APPROVED";

const DOC_STYLES: Record<DocStatus, string> = {
  PENDING_UPLOAD: "bg-muted text-muted-foreground border-border",
  UPLOADED: "bg-info/15 text-info border-info/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  APPROVED: "bg-success/15 text-success border-success/30",
};

export function DocStatusChip({
  status,
  className,
}: {
  status: DocStatus | string;
  className?: string;
}) {
  const s = (status as DocStatus) || "PENDING_UPLOAD";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        DOC_STYLES[s] || DOC_STYLES.PENDING_UPLOAD,
        className,
      )}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
}
