import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingProgress } from "@/components/filing-progress";
import { ArrowLeft, Mail, User, Phone, MapPin, IdCard, Check, X, Ban, Send, UserCog } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/partner/clients/$clientId")({
  component: ClientDetail,
});

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

function ClientDetail() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPartner = user?.role === "PARTNER";
  const qc = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api<any>(`/clients/${clientId}`),
  });
  const { data: filings } = useQuery({
    queryKey: ["filings", { client_id: clientId }],
    queryFn: () => api<any>("/filings", { query: { client_id: clientId } }),
  });

  const [haltFor, setHaltFor] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedExec, setSelectedExec] = useState("");

  const { data: executives } = useQuery({
    queryKey: ["executives"],
    queryFn: () => api<any>("/executives"),
    enabled: isPartner,
  });
  const execList: any[] = executives?.items || executives?.executives || [];

  const halt = useMutation({
    mutationFn: (vars: { filing_id: string; reason: string }) =>
      api(`/filings/${vars.filing_id}/halt`, { method: "POST", body: { reason: vars.reason } }),
    onSuccess: () => {
      toast.success("Filing halted");
      setHaltFor(null); setReason("");
      qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const assignExec = useMutation({
    mutationFn: (executive_id: string) =>
      api("/executives/assign", { method: "POST", body: { executive_id, client_id: clientId } }),
    onSuccess: () => {
      toast.success("Executive assigned");
      setAssignOpen(false); setSelectedExec("");
      qc.invalidateQueries({ queryKey: ["client", clientId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to assign"),
  });

  const sendOnboarding = useMutation({
    mutationFn: (filing_id: string) =>
      api(`/filings/${filing_id}/transition`, { method: "POST", body: { to_status: "ON_BOARDING" } }),
    onSuccess: () => {
      toast.success("Onboarding form sent to client");
      qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to send onboarding form"),
  });

  const filingsList: any[] = filings?.items || filings?.filings || filings || [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/partner/clients" as any })}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to clients
      </Button>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Client Profile</h2>
              {client?.account_status && <AccountStatusBadge status={client.account_status} />}
            </div>
            <div className="mt-4 divide-y">
              <InfoRow icon={User} label="Full Name" value={client?.full_name} />
              <InfoRow icon={Mail} label="Email" value={client?.email} />
              <InfoRow icon={IdCard} label="PAN" value={client?.pan_number} />
              <InfoRow icon={Phone} label="Contact" value={client?.contact_number} />
              <InfoRow icon={MapPin} label="Address" value={client?.address} />
              <InfoRow icon={User} label="Assigned Executive" value={client?.assigned_executive_name} />
            </div>
            {isPartner && (
              <div className="mt-4 pt-4 border-t">
                <Button size="sm" className="w-full" variant="outline" onClick={() => setAssignOpen(true)}>
                  <UserCog className="h-3.5 w-3.5 mr-1" /> Assign Executive
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Filings</h2>
              {filingsList.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No filings yet.</p>
              ) : (
                <div className="mt-5 space-y-6">
                  {filingsList.map((f: any) => (
                    <div key={f.filing_id || f.id} className="rounded-lg border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">Financial Year</div>
                          <div className="text-base font-semibold">{f.financial_year}</div>
                        </div>
                        {isPartner && f.status !== "HALTED" && f.status !== "COMPLETED" && (
                          <div className="flex gap-2">
                            {f.status === "INITIATED" && (
                              <Button size="sm" variant="default" onClick={() => sendOnboarding.mutate(f.filing_id || f.id)} disabled={sendOnboarding.isPending}>
                                <Send className="h-3.5 w-3.5 mr-1" /> Send Onboarding
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setHaltFor(f)}>
                              <Ban className="h-3.5 w-3.5 mr-1" /> Halt
                            </Button>
                          </div>
                        )}
                      </div>
                      <FilingProgress current={f.status} halted={f.status === "HALTED"} haltReason={f.halt_reason} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold">Documents & Computation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Detailed FY directory (documents required, computation versions, filed documents) opens per filing.
                Use the action bar inside each filing to assign documents, approve uploads, upload computations, and transition states.
              </p>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={!!haltFor} onOpenChange={(o) => !o && setHaltFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Halt filing</DialogTitle>
            <DialogDescription>
              Halting freezes the filing. Provide a reason for the audit log.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setHaltFor(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || halt.isPending}
              onClick={() => halt.mutate({ filing_id: haltFor.filing_id || haltFor.id, reason })}
            >
              Halt filing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Executive</DialogTitle>
            <DialogDescription>Select an executive to assign to this client.</DialogDescription>
          </DialogHeader>
          <Select value={selectedExec} onValueChange={setSelectedExec}>
            <SelectTrigger><SelectValue placeholder="Select executive" /></SelectTrigger>
            <SelectContent>
              {execList.filter((e: any) => e.is_active).map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button disabled={!selectedExec || assignExec.isPending} onClick={() => assignExec.mutate(selectedExec)}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
