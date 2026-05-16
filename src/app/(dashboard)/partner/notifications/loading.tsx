// src/app/partner/notifications/loading.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Control Actions Row Skeleton */}
      <div className="flex justify-between items-center border-b border-surface-border pb-2">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Notification Entry Item Stacks */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="p-5 space-y-2 border-surface-border shadow-soft rounded-none bg-card"
          >
            <div className="flex justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  );
}
