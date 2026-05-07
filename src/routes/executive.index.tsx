import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FolderOpen, FileCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingStatusBadge, type FilingStatus } from "@/components/ui/status-badge";

export const Route = createFileRoute("/executive/")({ component: ExecutiveDashboard });

const FILING_STATES: FilingStatus[] = ["INITIATED", "ON_BOARDING", "PROCESSING", "COMPUTATION", "FILING", "PAYMENT", "COMPLETED"];

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
    </Card>
  );
}

function ExecutiveDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api<any>("/dashboard/summary"),
  });
  const counters: Record<string, number> = {};
  (data?.counters || []).forEach((c: any) => { counters[c.status] = c.count; });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Filings assigned to you</p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Clients" value={data?.total_clients ?? 0} icon={Users} />
          <StatCard label="Active Filings" value={data?.total_active_filings ?? 0} icon={FolderOpen} />
          <StatCard label="Pending Action" value={(counters.ON_BOARDING ?? 0) + (counters.PROCESSING ?? 0)} icon={Clock} />
          <StatCard label="Completed" value={counters.COMPLETED ?? 0} icon={FileCheck} />
        </div>
      )}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filings by Status</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {FILING_STATES.map((s) => (
            <Link key={s} to="/executive/clients" search={{ status: s } as any}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent">
              <div className="text-2xl font-semibold">{counters[s] ?? 0}</div>
              <FilingStatusBadge status={s} className="mt-2" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
