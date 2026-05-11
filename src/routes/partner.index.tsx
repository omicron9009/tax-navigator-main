import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, FileCheck, Clock, FolderOpen, ExternalLink, Check, X } from "lucide-react";
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
  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api<any>("/dashboard/summary"),
  });
  const { data: pending } = useQuery({
    queryKey: ["dashboard", "pending-verification"],
    queryFn: () => api<any>("/dashboard/pending-verification"),
  });

  const counters: Record<string, number> = {};
  (summary?.counters || []).forEach((c: any) => { counters[c.status] = c.count; });

  const pendingList: any[] = pending?.items || pending?.clients || pending || [];

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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Clients" value={summary?.total_clients ?? 0} icon={Users} />
          <StatCard label="Active Filings" value={summary?.total_active_filings ?? 0} icon={FolderOpen} />
          <StatCard label="Pending Verification" value={summary?.pending_verification_count ?? 0} icon={Clock} />
          <StatCard label="Completed" value={counters.COMPLETED ?? 0} icon={FileCheck} />
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filings by Status</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {FILING_STATES.map((s) => (
            <Link
              key={s}
              to="/partner/clients"
              search={{ status: s } as any}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
            >
              <div className="text-2xl font-semibold">{counters[s] ?? 0}</div>
              <FilingStatusBadge status={s} className="mt-2" />
            </Link>
          ))}
        </div>
      </section>

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
