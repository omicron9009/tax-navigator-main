import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingProgress } from "@/components/filing-progress";
import { Plus, AlertTriangle, FilePlus2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/page-states";
import { toast } from "sonner";

export const Route = createFileRoute("/client/")({ component: ClientDashboard });

const FY_OPTIONS = [
  { label: "FY 2022-23", value: "2022-2023" },
  { label: "FY 2023-24", value: "2023-2024" },
  { label: "FY 2024-25", value: "2024-2025" },
  { label: "FY 2025-26", value: "2025-2026" },
];

function ClientDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<any>("/auth/me"),
  });
  const { data: tracking, isLoading } = useQuery({
    queryKey: ["filings", "my", "tracking"],
    queryFn: () => api<any>("/filings/my/tracking"),
  });

  const accountStatus = me?.account_status || "ACTIVE";
  const isPending = accountStatus === "PENDING_VERIFICATION";

  const list: any[] = tracking?.items || tracking?.filings || tracking || [];
  const usedFYs = new Set(list.map((f: any) => f.financial_year));

  const [open, setOpen] = useState(false);
  const [fy, setFy] = useState("");

  const initiate = useMutation({
    mutationFn: (financial_year: string) =>
      api("/filings/initiate", { method: "POST", body: { financial_year, onboarding_data: {} } }),
    onSuccess: () => {
      toast.success("Filing initiated");
      setOpen(false); setFy("");
      qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to initiate"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your ITR filings and progress</p>
      </div>

      {isPending && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/15 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-foreground" />
          <div className="text-sm text-warning-foreground">
            <div className="font-semibold">Account under verification</div>
            Your account is under verification by our team. You will be notified once it is activated.
          </div>
        </div>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><div className="text-xs text-muted-foreground">Name</div><div className="text-sm font-medium">{me?.full_name || user?.full_name}</div></div>
              <div><div className="text-xs text-muted-foreground">Email</div><div className="text-sm font-medium">{me?.email || user?.email}</div></div>
              <div><div className="text-xs text-muted-foreground">PAN</div><div className="text-sm font-medium font-mono">{me?.pan_number || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Status</div><div className="mt-1"><AccountStatusBadge status={accountStatus} /></div></div>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} disabled={isPending}>
            <Plus className="h-4 w-4 mr-1" /> Initiate New Filing
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Filings</h2>
        {isLoading ? <Skeleton className="h-40" /> : list.length === 0 ? (
          <EmptyState
            title="No filings yet"
            description={isPending ? "Once your account is activated, you can initiate a filing." : "Initiate your first ITR filing to get started."}
            icon={<FilePlus2 className="h-8 w-8" />}
            action={!isPending && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Initiate Filing</Button>}
          />
        ) : (
          <div className="space-y-4">
            {list.map((f: any) => (
              <Card key={f.filing_id || f.id} className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Financial Year</div>
                    <div className="text-base font-semibold">{f.financial_year}</div>
                  </div>
                </div>
                <FilingProgress current={f.status} halted={f.status === "HALTED"} haltReason={f.halt_reason} />
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate ITR Filing</DialogTitle>
            <DialogDescription>Select a financial year. Years with existing filings are disabled.</DialogDescription>
          </DialogHeader>
          <Select value={fy} onValueChange={setFy}>
            <SelectTrigger><SelectValue placeholder="Select financial year" /></SelectTrigger>
            <SelectContent>
              {FY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} disabled={usedFYs.has(opt.value)}>
                  {opt.label}{usedFYs.has(opt.value) ? " (already filed)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!fy || initiate.isPending} onClick={() => initiate.mutate(fy)}>Initiate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
