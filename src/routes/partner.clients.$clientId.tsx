/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Mail, User, Phone, MapPin, IdCard, UserCog } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { FilingWorkspace } from "@/components/filing-workspace";

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

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedExec, setSelectedExec] = useState("");

  const { data: executives } = useQuery({
    queryKey: ["executives"],
    queryFn: () => api<any>("/executives"),
    enabled: isPartner,
  });
  const execList: any[] = executives?.items || executives?.executives || [];

  const assignExec = useMutation({
    mutationFn: (executive_id: string) =>
      api("/executives/assign", { method: "POST", body: { executive_id, client_id: clientId } }),
    onSuccess: () => {
      toast.success("Executive assigned");
      setAssignOpen(false);
      setSelectedExec("");
      qc.invalidateQueries({ queryKey: ["client", clientId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to assign"),
  });

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
              <InfoRow
                icon={User}
                label="Assigned Executive"
                value={client?.assigned_executive_name}
              />
            </div>
            {isPartner && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserCog className="h-3.5 w-3.5 mr-1" /> Assign Executive
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <FilingWorkspace
              role="PARTNER"
              clientId={clientId}
              title="Filings"
              description="Assign document checklists, review uploads, upload computations, and close out payment on behalf of the client."
            />
          </div>
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Executive</DialogTitle>
            <DialogDescription>Select an executive to assign to this client.</DialogDescription>
          </DialogHeader>
          <Select value={selectedExec} onValueChange={setSelectedExec}>
            <SelectTrigger>
              <SelectValue placeholder="Select executive" />
            </SelectTrigger>
            <SelectContent>
              {execList
                .filter((e: any) => e.is_active)
                .map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name} ({e.email})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedExec || assignExec.isPending}
              onClick={() => assignExec.mutate(selectedExec)}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
