import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, FileCheck, Clock, FolderOpen, ExternalLink, Check, X,
  UserCog, BarChart3, Calendar, Activity, UserX, Timer,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingStatusBadge, AccountStatusBadge, type FilingStatus } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/")({ component: PartnerDashboard });

const FILING_STATES: FilingStatus[] = [
  "INITIATED", "ON_BOARDING", "PROCESSING", "COMPUTATION", "FILING", "PAYMENT", "COMPLETED", "HALTED",
];

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

function PartnerDashboard() {
  const qc = useQueryClient();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["dashboard", "analytics", "partner"],
    queryFn: () => api<any>("/dashboard/analytics/partner"),
  });

  const { data: pending } = useQuery({
    queryKey: ["dashboard", "pending-verification"],
    queryFn: () => api<any>("/dashboard/pending-verification"),
  });

  const pendingList: any[] = pending?.items || pending?.clients || pending || [];

  // Build filing status counters from breakdown
  const statusCounters: Record<string, number> = {};
  (analytics?.filing_status_breakdown || []).forEach((b: any) => { statusCounters[b.status] = b.count; });

  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  const activate = useMutation({
    mutationFn: (client_id: string) => api("/clients/activate", { method: "POST", body: { client_id } }),
    onSuccess: () => {
      toast.success("Client activated");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to activate"),
  });
  const reject = useMutation({
    mutationFn: (vars: { client_id: string; reason: string }) =>
      api("/clients/reject", { method: "POST", body: vars }),
    onSuccess: () => {
      toast.success("Client rejected");
      setRejectFor(null); setReason("");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const openPan = async (client: any) => {
    try {
      if (client.pan_document_url) {
        window.open(client.pan_document_url, "_blank");
        return;
      }
      if (client.pan_document_id) {
        const res = await api<{ download_url: string }>(`/storage/${client.pan_document_id}/download-url`);
        window.open(res.download_url, "_blank");
      }
    } catch (e: any) { toast.error(e.message || "Could not open document"); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Partner Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your practice and pending actions</p>
      </div>

      {/* ── Top-level counters ── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard label="Total Clients" value={analytics?.total_clients ?? 0} icon={Users} />
          <StatCard label="Active Clients" value={analytics?.active_clients ?? 0} icon={Users} />
          <StatCard label="Pending Verification" value={analytics?.pending_verification_clients ?? 0} icon={Clock} />
          <StatCard label="Rejected Clients" value={analytics?.rejected_clients ?? 0} icon={UserX} />
          <StatCard label="Total Executives" value={analytics?.total_executives ?? 0} icon={UserCog} hint={`${analytics?.active_executives ?? 0} active`} />
          <StatCard label="Total Filings" value={analytics?.total_filings ?? 0} icon={FolderOpen} />
          <StatCard label="Active Filings" value={analytics?.active_filings ?? 0} icon={Activity} />
          <StatCard label="Completed Filings" value={analytics?.completed_filings ?? 0} icon={FileCheck} hint={analytics?.halted_filings ? `${analytics.halted_filings} halted` : undefined} />
        </div>
      )}

      {/* ── Average time metrics ── */}
      {!isLoading && (analytics?.avg_days_initiated_to_completed != null || analytics?.avg_days_in_processing != null || analytics?.avg_days_in_computation != null) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Average Turnaround</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {analytics?.avg_days_initiated_to_completed != null && (
              <StatCard label="Initiation → Completion" value={`${analytics.avg_days_initiated_to_completed.toFixed(1)}d`} icon={Timer} />
            )}
            {analytics?.avg_days_in_processing != null && (
              <StatCard label="In Processing" value={`${analytics.avg_days_in_processing.toFixed(1)}d`} icon={Timer} />
            )}
            {analytics?.avg_days_in_computation != null && (
              <StatCard label="In Computation" value={`${analytics.avg_days_in_computation.toFixed(1)}d`} icon={Timer} />
            )}
          </div>
        </section>
      )}

      {/* ── Filing status breakdown ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filings by Status</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {FILING_STATES.map((s) => (
            <Link
              key={s}
              to="/partner/clients"
              search={{ status: s } as any}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
            >
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

      {/* ── Executive → Client Mapping ── */}
      {analytics?.executive_client_mapping?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Executive Workload</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {analytics.executive_client_mapping.map((exec: any) => (
              <Card key={exec.executive_id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{exec.executive_name}</p>
                    <p className="text-xs text-muted-foreground">{exec.executive_email}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{exec.total_clients} clients</span>
                    <span className="text-info">{exec.active_filings} active</span>
                    <span className="text-success">{exec.completed_filings} done</span>
                  </div>
                </div>
                {exec.clients?.length > 0 && (
                  <div className="space-y-1">
                    {exec.clients.map((cl: any) => (
                      <div key={cl.client_id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                        <span className="font-medium">{cl.client_name}</span>
                        <div className="flex items-center gap-2">
                          {cl.financial_year && <span className="text-muted-foreground">{cl.financial_year}</span>}
                          {cl.filing_status && <FilingStatusBadge status={cl.filing_status} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Unassigned Clients ── */}
      {analytics?.unassigned_clients?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Unassigned Clients
            <span className="ml-2 text-destructive">({analytics.unassigned_clients.length})</span>
          </h2>
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
                  {analytics.unassigned_clients.map((cl: any) => (
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
                    <th className="px-4 py-3 text-left font-medium">Executive</th>
                    <th className="px-4 py-3 text-left font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.recent_filings.map((f: any, i: number) => (
                    <tr key={`${f.client_id}-${f.financial_year}-${i}`} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{f.client_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.financial_year}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.assigned_executive ?? "—"}</td>
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

      {/* ── Pending Verification Queue ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pending Verification Queue</h2>
        </div>
        {pendingList.length === 0 ? (
          <EmptyState title="All caught up" description="No clients are awaiting verification right now." icon={<Check className="h-8 w-8" />} />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Registered</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingList.map((c: any) => (
                    <tr key={c.client_id || c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{c.full_name || c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.registered_at ? new Date(c.registered_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3"><AccountStatusBadge status={c.account_status || "PENDING_VERIFICATION"} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {c.pan_document_id && (
                            <Button size="sm" variant="outline" onClick={() => openPan(c)}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> PAN
                            </Button>
                          )}
                          <Button size="sm" onClick={() => activate.mutate(c.client_id || c.id)} disabled={activate.isPending}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Activate
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectFor(c)}>
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject client</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting <span className="font-medium">{rejectFor?.full_name || rejectFor?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || reject.isPending}
              onClick={() => reject.mutate({ client_id: rejectFor.client_id || rejectFor.id, reason })}
            >
              Reject client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
