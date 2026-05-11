import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth";
import { FilingWorkspace } from "@/components/filing-workspace";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/client/")({ component: ClientDashboard });

function ClientDashboard() {
  const { user } = useAuth();

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", "client"],
    queryFn: () => api<any>("/dashboard/client"),
  });

  const accountStatus = dashboard?.account_status || "ACTIVE";
  const isPending = accountStatus === "PENDING_VERIFICATION";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{dashboard?.full_name ? `, ${dashboard.full_name.split(" ")[0]}` : user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
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

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="text-sm font-medium">{dashboard?.full_name || user?.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium">{dashboard?.email || user?.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PAN</div>
                <div className="text-sm font-medium font-mono">{dashboard?.pan_number || "—"}</div>
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
