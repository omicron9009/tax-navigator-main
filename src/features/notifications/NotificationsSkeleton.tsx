// src/features/notifications/NotificationsSkeleton.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-4">
        {/* Filters Bar Skeleton */}
        <div className="flex justify-between border-b pb-2">
          <div className="flex gap-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card
              key={i}
              className="p-4 border shadow-soft rounded-none flex flex-row items-start justify-between gap-4 bg-card"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Skeleton className="h-8 w-8 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2 w-full max-w-md">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 pl-2">
                <Skeleton className="h-3 w-20" />
                <div className="mt-1">
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
