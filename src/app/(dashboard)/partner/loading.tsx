import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[calc(var(--text-page-heading)*2)] font-bold tracking-tight text-secondary">
          Partner Dashboard
        </h1>
        <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
          Manage your pending client verifications
        </p>
      </div>

      {/* Skeleton Table */}
      <Card className="p-4 space-y-4 border-surface-border shadow-soft rounded-none">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}
