// src/app/client/filings/page.tsx
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FilingStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import { Folder } from "lucide-react";

export default async function ClientFilingsHistoryPage() {
  let list: any[] = [];

  try {
    // 🧠 HIGH-LEVERAGE: Pull compliance history directly on the server before client execution runs
    const data = await api<any>("/filings/my/tracking");
    list = data?.items || data?.filings || data || [];
  } catch (error) {
    console.error(
      "❌ Failed to query client filing history segments on server node:",
      error,
    );
  }

  // Format ISO timestamps securely on the server layer
  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans antialiased select-none">
      {/* Structural Canopy Header */}
      <div>
        <h1 className="text-page-heading font-black tracking-tight text-secondary uppercase leading-none">
          My Filings Archive
        </h1>
        <p className="mt-2 text-sm text-content-muted font-medium">
          Comprehensive historical tracking matrix for your annual individual
          income tax filings.
        </p>
      </div>

      {/* Core Table View Layer */}
      {list.length === 0 ? (
        <EmptyState
          title="No Filing History Found"
          description="You have not initialized an active individual compliance session yet. Head over to your dashboard portal to deploy your first filing loop tracking segment."
          icon={<Folder className="h-8 w-8 text-[#071B3B]/30" />}
        />
      ) : (
        <Card className="overflow-hidden p-0 border border-surface-border shadow-soft rounded-none bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* 🎨 THE NAVY PASS: Force header tracks to use your exact corporate navy block alignment */}
              <thead
                style={{ backgroundColor: "#071B3B" }}
                className="text-white text-xs uppercase tracking-wider"
              >
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    Financial Year
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Current Process Node
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Milestone Progress
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Session Initiated
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Compliance Closeout
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-card">
                {list.map((f: any) => {
                  const progressPct = f.progress_percentage ?? 0;

                  return (
                    <tr
                      key={f.filing_id || f.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Highlight financial year string with brand blue on row hover focus states */}
                      <td className="px-5 py-4 font-bold text-secondary group-hover:text-[#0087ff] transition-colors font-mono tracking-tight">
                        {f.financial_year}
                      </td>
                      <td className="px-5 py-4">
                        <FilingStatusBadge status={f.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Progress
                            value={progressPct}
                            // Custom sharp flat block progress override track
                            className="h-2 w-24 rounded-none bg-slate-100 border border-surface-border/40"
                          />
                          <span className="text-xs font-mono font-bold text-content-muted">
                            {progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-content-muted font-medium text-xs">
                        {formatTimestamp(f.initiated_at)}
                      </td>
                      <td className="px-5 py-4 text-content-muted font-medium text-xs">
                        {formatTimestamp(f.completed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
