import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingProgress } from "@/components/filing-progress";
import { ArrowLeft, Mail, User, IdCard, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/executive/clients/$clientId")({ component: ExecClientDetail });

function Row({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div><div className="text-xs uppercase text-muted-foreground tracking-wider">{label}</div><div className="text-sm font-medium">{value || "—"}</div></div>
    </div>
  );
}

function ExecClientDetail() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api<any>(`/clients/${clientId}`),
  });
  const { data: filings } = useQuery({
    queryKey: ["filings", { client_id: clientId }],
    queryFn: () => api<any>("/filings", { query: { client_id: clientId } }),
  });
  const list: any[] = filings?.items || filings?.filings || filings || [];

  const sendOnboarding = useMutation({
    mutationFn: (filing_id: string) =>
      api(`/filings/${filing_id}/transition`, { method: "POST", body: { to_status: "ON_BOARDING" } }),
    onSuccess: () => {
      toast.success("Onboarding form sent to client");
      qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to send onboarding form"),
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/executive/clients" as any })}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Client</h2>
              {client?.account_status && <AccountStatusBadge status={client.account_status} />}
            </div>
            <div className="mt-4 divide-y">
              <Row icon={User} label="Name" value={client?.full_name} />
              <Row icon={Mail} label="Email" value={client?.email} />
              <Row icon={IdCard} label="PAN" value={client?.pan_number} />
              <Row icon={Phone} label="Contact" value={client?.contact_number} />
              <Row icon={MapPin} label="Address" value={client?.address} />
            </div>
          </Card>
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold">Filings</h2>
            <div className="mt-5 space-y-6">
              {list.length === 0 && <p className="text-sm text-muted-foreground">No filings.</p>}
              {list.map((f: any) => (
                <div key={f.filing_id || f.id} className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold">FY {f.financial_year}</div>
                    {f.status === "INITIATED" && (
                      <Button size="sm" variant="default" onClick={() => sendOnboarding.mutate(f.filing_id || f.id)} disabled={sendOnboarding.isPending}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Send Onboarding
                      </Button>
                    )}
                  </div>
                  <FilingProgress current={f.status} halted={f.status === "HALTED"} haltReason={f.halt_reason} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
