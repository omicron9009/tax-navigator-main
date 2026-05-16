// src/app/partner/clients/loading.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[calc(var(--text-page-heading)*1.5)] font-bold tracking-tight text-secondary">
          Global Client Base
        </h1>
        <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
          View, search, filter, and track all clients registered on the
          platform.
        </p>
      </div>

      {/* Uniform Layout Controls Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 w-full sm:w-72" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      {/* Table Framework Skeleton */}
      <Card className="p-4 space-y-4 border-surface-border shadow-soft rounded-none">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}
