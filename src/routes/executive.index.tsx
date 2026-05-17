import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, FolderOpen, FileCheck, Clock, Activity, FileText, CheckCircle, XCircle, Timer, Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingStatusBadge, type FilingStatus } from "@/components/ui/status-badge";

export const Route = createFileRoute("/executive/")({ component: ExecutiveDashboard });

const FILING_STATES: FilingStatus[] = ["INITIATED", "ON_BOARDING", "PROCESSING", "COMPUTATION", "FILING", "PAYMENT", "COMPLETED", "HALTED"];

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: number | string; icon: any; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
    </Card>
  );
}

function ExecutiveDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["dashboard", "analytics", "executive"],
    queryFn: () => api<any>("/dashboard/analytics/executive"),
  });

  // Build filing status counters from breakdown
  const statusCounters: Record<string, number> = {};
  (analytics?.filing_status_breakdown || []).forEach((b: any) => { statusCounters[b.status] = b.count; });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {analytics?.executive_name ? `${analytics.executive_name} — ` : ""}Filings assigned to you
        </p>
      </div>

      {/* ── Top counters ── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard label="Assigned Clients" value={analytics?.total_assigned_clients ?? 0} icon={Users} />
          <StatCard label="Active Filings" value={analytics?.active_filings ?? 0} icon={Activity} />
          <StatCard label="Completed" value={analytics?.completed_filings ?? 0} icon={FileCheck} />
          <StatCard label="Halted" value={analytics?.halted_filings ?? 0} icon={Clock} />
        </div>
      )}

      {/* ── Document stats ── */}
      {!isLoading && (analytics?.total_documents_approved != null || analytics?.total_documents_pending != null || analytics?.total_documents_rejected != null) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Document Overview</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard label="Approved Documents" value={analytics?.total_documents_approved ?? 0} icon={CheckCircle} />
            <StatCard label="Pending Documents" value={analytics?.total_documents_pending ?? 0} icon={FileText} />
            <StatCard label="Rejected Documents" value={analytics?.total_documents_rejected ?? 0} icon={XCircle} />
          </div>
        </section>
      )}

      {/* ── Average turnaround ── */}
      {!isLoading && (analytics?.avg_days_initiated_to_completed != null || analytics?.avg_days_in_processing != null) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Average Turnaround</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {analytics?.avg_days_initiated_to_completed != null && (
              <StatCard label="Initiation → Completion" value={`${analytics.avg_days_initiated_to_completed.toFixed(1)}d`} icon={Timer} />
            )}
            {analytics?.avg_days_in_processing != null && (
              <StatCard label="In Processing" value={`${analytics.avg_days_in_processing.toFixed(1)}d`} icon={Timer} />
            )}
          </div>
        </section>
      )}

      {/* ── Filing status breakdown ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filings by Status</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {FILING_STATES.map((s) => (
            <Link key={s} to="/executive/clients" search={{ status: s } as any}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent">
              <div className="text-2xl font-semibold">{statusCounters[s] ?? 0}</div>
              <FilingStatusBadge status={s} className="mt-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── FY Distribution ── */}
      {analytics?.fy_distribution?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financial Year Distribution</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {analytics.fy_distribution.map((fy: any) => (
              <Card key={fy.financial_year} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{fy.financial_year}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Total</span><div className="font-semibold text-lg">{fy.total_filings}</div></div>
                  <div><span className="text-muted-foreground">Done</span><div className="font-semibold text-lg text-success">{fy.completed}</div></div>
                  <div><span className="text-muted-foreground">Active</span><div className="font-semibold text-lg text-info">{fy.active}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Assigned Clients list ── */}
      {analytics?.clients?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Assigned Clients</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">FY</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.clients.map((cl: any) => (
                    <tr key={cl.client_id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{cl.client_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cl.client_email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cl.financial_year ?? "—"}</td>
                      <td className="px-4 py-3">{cl.filing_status ? <FilingStatusBadge status={cl.filing_status} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* ── Recent Filings ── */}
      {analytics?.recent_filings?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">FY</th>
                    <th className="px-4 py-3 text-left font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.recent_filings.map((f: any, i: number) => (
                    <tr key={`${f.client_id}-${f.financial_year}-${i}`} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{f.client_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.financial_year}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {f.last_updated ? new Date(f.last_updated).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
