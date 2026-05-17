import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "INITIATED",
  "ON_BOARDING",
  "PROCESSING",
  "COMPUTATION",
  "FILING",
  "PAYMENT",
  "COMPLETED",
] as const;

export function FilingProgress({
  current,
  halted,
  haltReason,
}: {
  current: string;
  halted?: boolean;
  haltReason?: string;
}) {
  if (halted) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
        <div className="text-sm font-semibold text-destructive">
          Filing Halted
        </div>
        {haltReason && (
          <div className="mt-1 text-xs text-destructive/80">{haltReason}</div>
        )}
      </div>
    );
  }
  const idx = STEPS.indexOf(current as any);
  return (
    <ol className="flex w-full items-center gap-1 overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li
            key={step}
            className="flex flex-1 min-w-[90px] items-center gap-1"
          >
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  done && "bg-success border-success text-success-foreground",
                  active &&
                    "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                  !done &&
                    !active &&
                    "bg-muted border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider text-center leading-tight",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.replace(/_/g, " ")}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 -mt-5 rounded",
                  done ? "bg-success" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
