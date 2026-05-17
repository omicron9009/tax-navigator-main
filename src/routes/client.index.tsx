import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge, FilingStatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth";
import { FilingWorkspace } from "@/components/filing-workspace";
import {
  AlertTriangle, FolderOpen, FileCheck, Activity, Bell, FileText, CheckCircle, XCircle, Clock, Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/client/")({ component: ClientDashboard });

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: number | string; icon: any; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function ClientDashboard() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["dashboard", "analytics", "client"],
    queryFn: () => api<any>("/dashboard/analytics/client"),
  });

  const accountStatus = analytics?.account_status || "ACTIVE";
  const isPending = accountStatus === "PENDING_VERIFICATION";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{analytics?.client_name ? `, ${analytics.client_name.split(" ")[0]}` : user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your ITR filings and progress</p>
      </div>

      {isPending && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/15 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-foreground" />
          <div className="text-sm text-warning-foreground">
            <div className="font-semibold">Account under verification</div>
            Your account is under verification by our team. You will be notified once it is
            activated.
          </div>
        </div>
      )}

      {/* ── Profile card ── */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="text-sm font-medium">{analytics?.client_name || user?.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium">{analytics?.client_email || user?.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PAN</div>
                <div className="text-sm font-medium font-mono">{analytics?.pan_number || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Registered</div>
                <div className="text-sm font-medium">
                  {analytics?.registered_at ? new Date(analytics.registered_at).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">
                  <AccountStatusBadge status={accountStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Summary stats ── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard label="Total Filings" value={analytics?.total_filings ?? 0} icon={FolderOpen} />
          <StatCard label="Active Filings" value={analytics?.active_filings ?? 0} icon={Activity} />
          <StatCard label="Completed" value={analytics?.completed_filings ?? 0} icon={FileCheck} />
          <StatCard
            label="Notifications"
            value={analytics?.unread_notifications ?? 0}
            icon={Bell}
            hint={`${analytics?.total_notifications ?? 0} total`}
          />
        </div>
      )}

      {/* ── Document overview ── */}
      {!isLoading && analytics?.total_documents != null && analytics.total_documents > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Document Overview</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <StatCard label="Total Documents" value={analytics.total_documents} icon={FileText} />
            <StatCard label="Approved" value={analytics.total_approved ?? 0} icon={CheckCircle} />
            <StatCard label="Pending" value={analytics.total_pending ?? 0} icon={Clock} />
            <StatCard label="Rejected" value={analytics.total_rejected ?? 0} icon={XCircle} />
          </div>
        </section>
      )}

      {/* ── Per-filing details ── */}
      {analytics?.filings?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filing Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {analytics.filings.map((f: any) => (
              <Card key={f.filing_id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{f.financial_year}</span>
                  </div>
                  <FilingStatusBadge status={f.status} />
                </div>

                <Progress value={f.progress_percentage} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{f.progress_percentage}% complete</p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Initiated</span>
                    <div className="font-medium">{new Date(f.initiated_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completed</span>
                    <div className="font-medium">{f.completed_at ? new Date(f.completed_at).toLocaleDateString() : "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Executive</span>
                    <div className="font-medium">{f.assigned_executive_name ?? "Not assigned"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days Active</span>
                    <div className="font-medium">{f.days_since_initiated ?? 0}</div>
                  </div>
                </div>

                {(f.documents_total > 0 || f.computation_status) && (
                  <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs">
                    {f.documents_total > 0 && (
                      <span>
                        Docs: {f.documents_approved}/{f.documents_total} approved
                        {f.documents_pending > 0 && <span className="text-warning-foreground ml-1">({f.documents_pending} pending)</span>}
                        {f.documents_rejected > 0 && <span className="text-destructive ml-1">({f.documents_rejected} rejected)</span>}
                      </span>
                    )}
                    {f.computation_status && (
                      <span className="text-muted-foreground">Computation: {f.computation_status.replace(/_/g, " ")}</span>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <FilingWorkspace
        role="CLIENT"
        title="My Filings"
        description={
          isPending
            ? "Your account is awaiting verification, so filing actions remain locked."
            : "Initiate new financial years, upload checklist documents, and complete the filing lifecycle."
        }
      />
    </div>
  );
}
