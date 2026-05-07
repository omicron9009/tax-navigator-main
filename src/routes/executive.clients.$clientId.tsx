/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Mail, User, IdCard, Phone, MapPin } from "lucide-react";
import { FilingWorkspace } from "@/components/filing-workspace";

export const Route = createFileRoute("/executive/clients/$clientId")({
  component: ExecClientDetail,
});

function Row({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs uppercase text-muted-foreground tracking-wider">{label}</div>
        <div className="text-sm font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

function ExecClientDetail() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api<any>(`/clients/${clientId}`),
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/executive/clients" as any })}
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
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
          <div className="lg:col-span-2">
            <FilingWorkspace
              role="EXECUTIVE"
              clientId={clientId}
              title="Filings"
              description="Send the document checklist, review uploads, upload computations, and advance the filing state."
            />
          </div>
        </div>
      )}
    </div>
  );
}
