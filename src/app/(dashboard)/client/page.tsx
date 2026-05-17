// src/app/client/page.tsx
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingWorkspace } from "@/components/filing-workspace";
import { AlertTriangle } from "lucide-react";

// Server-side auth mock helper matching your middleware token ingestion patterns
// Replace this with your actual local session lookup (e.g., from your JWT cookie decoder)
async function getServerSessionUser() {
  return {
    full_name: "Client Node",
    email: "client@itr-platform.com",
  };
}

export default async function ClientDashboardPage() {
  const user = await getServerSessionUser();
  let dashboard: any = null;

  try {
    // 🧠 HIGH-LEVERAGE: Fetch metrics securely on the server side prior to DOM initialization
    dashboard = await api<any>("/dashboard/client");
  } catch (error) {
    console.error(
      "❌ Failed to resolve client metadata matrix from server context:",
      error,
    );
  }

  const accountStatus = dashboard?.account_status || "ACTIVE";
  const isPending = accountStatus === "PENDING_VERIFICATION";

  // Gracefully parsing first names without split failures on unhydrated records
  const resolveFirstName = () => {
    const rawName = dashboard?.full_name || user?.full_name || "";
    if (!rawName) return "";
    return `, ${rawName.split(" ")[0]}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full font-sans antialiased select-none">
      {/* Welcome Title Segment */}
      <div>
        <h1 className="text-page-heading font-black tracking-tight text-secondary uppercase leading-none">
          Welcome{resolveFirstName()}
        </h1>
        <p className="mt-2 text-sm text-content-muted font-medium">
          Real-time individual tax compliance tracking and pipeline status.
        </p>
      </div>

      {/* ⚠️ INDUSTRIAL STATE VERIFICATION WARNING BOX */}
      {isPending && (
        <div className="flex items-start gap-4 rounded-none border border-amber-200 bg-amber-50/60 p-4 animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
          <div className="text-xs font-sans">
            <div className="font-black text-amber-900 uppercase tracking-wider">
              Account Node Awaiting Compliance Verification
            </div>
            <p className="text-amber-800 font-medium mt-1 leading-relaxed">
              Your profile documents are currently undergoing manual
              verification cycles by our security team. Filing parameters will
              unlock immediately once your node transitions to active.
            </p>
          </div>
        </div>
      )}

      {/* Account Identity Dossier Block */}
      <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-content-light border-b border-surface-border pb-3 mb-4">
            Security Profile Ledger
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-content-light uppercase tracking-wider">
                Registered Name
              </div>
              <div className="text-sm font-bold text-content-main truncate mt-1">
                {dashboard?.full_name || user?.full_name || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[9px] font-bold text-content-light uppercase tracking-wider">
                Secure Email Anchor
              </div>
              <div className="text-sm font-semibold text-content-muted truncate mt-1">
                {dashboard?.email || user?.email || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[9px] font-bold text-content-light uppercase tracking-wider">
                Income Tax PAN ID
              </div>
              <div className="text-sm font-bold text-content-main font-mono tracking-tight mt-1">
                {dashboard?.pan_number || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[9px] font-bold text-content-light uppercase tracking-wider">
                Verification Clearance
              </div>
              <div className="mt-1">
                <AccountStatusBadge status={accountStatus} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Shared Client Workspace Automation Loop Modals Module */}
      {/* This automatically hooks straight into the production-grade, zero-rounding 
        `<FilingWorkspace />` engine we refactored, providing zero performance thrashes.
      */}
      <FilingWorkspace
        role="CLIENT"
        title="My Personal Filings"
        description={
          isPending
            ? "Your account parameters are currently locked awaiting identity verification checkmarks."
            : "Deploy new compliance cycles, upload file assets checklists, and sign final tax computational sheets directly."
        }
      />
    </div>
  );
}
