// src/app/partner/audit/page.tsx
import { api } from "@/lib/api";
import AuditLogFilters from "./AuditLogFilters";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { EmptyState } from "@/components/page-states";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    event_type?: string;
    client_id?: string;
    start_date?: string;
    end_date?: string;
  }>;
}

export const metadata = {
  title: "System Audit Logs",
};

export default async function PartnerAuditPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  // Parse dynamic query states natively on the server layer
  const page = Number(resolvedParams.page) || 1;
  const eventType = resolvedParams.event_type || undefined;
  const clientId = resolvedParams.client_id || undefined;
  const startDate = resolvedParams.start_date || undefined;
  const endDate = resolvedParams.end_date || undefined;

  let auditData = { items: [], total: 0, page_size: 50 };

  try {
    // Await database records directly at the server edge node
    auditData = await api("/audit/logs", {
      query: {
        page,
        page_size: 50,
        event_type: eventType,
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    console.error(
      "Critical architectural failure fetching database audit streams:",
      error,
    );
  }

  const items = auditData?.items || [];
  const total = auditData?.total ?? items.length;
  const pageSize = auditData?.page_size ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Build out standard server action strings for pagination targets
  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set("page", String(targetPage));
    if (eventType) params.set("event_type", eventType);
    if (clientId) params.set("client_id", clientId);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-secondary">
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse historical audit records and compile administrative summaries
        </p>
      </div>

      {/* Inject Interactive Filter Dashboard Bridge */}
      <AuditLogFilters
        activeFilters={{
          page,
          eventType: eventType || "ALL",
          clientId: clientId || "",
          startDate: startDate || "",
          endDate: endDate || "",
        }}
      />

      {/* Main Table Interface Layer */}
      {items.length === 0 ? (
        <EmptyState
          title="No audit elements discovered"
          description="Adjust your search matrix query fields or date targets."
          icon={<ScrollText className="h-8 w-8" />}
        />
      ) : (
        <Card className="overflow-hidden p-0 border border-surface-border shadow-soft rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    Event Classification
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Operator Actor
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Target Client
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Execution Datetime
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Parameters Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-card">
                {items.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium tracking-tight bg-slate-100 text-slate-700 uppercase">
                        {log.event_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-secondary">
                      {log.actor_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-content-muted">
                      {log.client_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-content-muted whitespace-nowrap">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td
                      className="px-5 py-4 text-xs font-mono text-content-muted max-w-[300px] truncate"
                      title={
                        log.details ? JSON.stringify(log.details) : undefined
                      }
                    >
                      {log.details && Object.keys(log.details).length > 0
                        ? JSON.stringify(log.details)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clean Server-Driven Pagination Tracks */}
          <div className="flex items-center justify-between border-t border-surface-border px-5 py-4 text-sm bg-card">
            <span className="text-xs text-content-muted">
              Page {page} of {totalPages} ({total} total entries)
            </span>
            <div className="flex gap-2">
              <a
                href={page > 1 ? buildPageUrl(page - 1) : undefined}
                className={`inline-flex h-9 items-center justify-center px-4 text-sm font-medium border border-surface-border rounded-none transition-colors ${
                  page <= 1
                    ? "opacity-40 pointer-events-none cursor-not-allowed"
                    : "hover:bg-muted"
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </a>
              <a
                href={page < totalPages ? buildPageUrl(page + 1) : undefined}
                className={`inline-flex h-9 items-center justify-center px-4 text-sm font-medium border border-surface-border rounded-none transition-colors ${
                  page >= totalPages
                    ? "opacity-40 pointer-events-none cursor-not-allowed"
                    : "hover:bg-muted"
                }`}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
