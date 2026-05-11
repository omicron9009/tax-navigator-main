import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Download, FileText, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { EmptyState } from "@/components/page-states";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().optional(),
  event_type: z.string().optional(),
  client_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const Route = createFileRoute("/partner/audit/")({
  component: AuditLog,
  validateSearch: (s) => searchSchema.parse(s),
});

const EVENT_TYPES = [
  "ACCOUNT_REGISTERED", "ACCOUNT_ACTIVATED", "ACCOUNT_REJECTED", "ACCOUNT_DEACTIVATED", "ACCOUNT_REACTIVATED",
  "EXECUTIVE_CREATED", "EXECUTIVE_ASSIGNED", "EXECUTIVE_UNASSIGNED",
  "FILING_INITIATED", "FILING_STATE_CHANGED", "FILING_HALTED",
  "DOCUMENT_PLACEHOLDER_CREATED", "DOCUMENT_UPLOADED", "DOCUMENT_APPROVED", "DOCUMENT_REJECTED", "DOCUMENT_DOWNLOADED",
  "COMPUTATION_UPLOADED", "COMPUTATION_APPROVED", "COMPUTATION_SUPERSEDED",
  "ITR_FILED", "PAYMENT_RECEIVED", "INVOICE_UPLOADED",
  "FORM_FIELD_ADDED", "FORM_FIELD_UPDATED", "FORM_FIELD_REMOVED",
  "MASTER_DOC_TYPE_ADDED", "MASTER_DOC_TYPE_UPDATED", "MASTER_DOC_TYPE_REMOVED",
];

function AuditLog() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = search.page || 1;

  const [from, setFrom] = useState(search.start_date || "");
  const [to, setTo] = useState(search.end_date || "");
  const [clientId, setClientId] = useState(search.client_id || "");
  const [eventType, setEventType] = useState(search.event_type || "ALL");
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", search],
    queryFn: () => api<any>("/audit/logs", {
      query: {
        page,
        page_size: 50,
        client_id: search.client_id || undefined,
        event_type: search.event_type || undefined,
        start_date: search.start_date || undefined,
        end_date: search.end_date || undefined,
      },
    }),
  });

  const items: any[] = data?.items || [];
  const total = data?.total ?? items.length;
  const pageSize = data?.page_size ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const update = (patch: any) => navigate({ search: { ...search, ...patch } as any });

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api<any>("/audit/generate-report", {
        method: "POST",
        query: {
          client_id: clientId || undefined,
          start_date: from || undefined,
          end_date: to || undefined,
        },
      });
      const html = typeof res === "string" ? res : (res?.html || res?.report || JSON.stringify(res, null, 2));
      setReportHtml(html);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportHtml) return;
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${from || "all"}-${to || "all"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Browse audit events and generate reports</p>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v)}>
              <SelectTrigger><SelectValue placeholder="All events" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All events</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Client ID (optional)</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => update({
              page: 1,
              start_date: from || undefined,
              end_date: to || undefined,
              client_id: clientId || undefined,
              event_type: eventType === "ALL" ? undefined : eventType,
            })}>
              Apply
            </Button>
            <Button variant="outline" onClick={generateReport} disabled={reportLoading}>
              <FileText className="h-4 w-4 mr-1" /> Report
            </Button>
          </div>
        </div>
      </Card>

      {reportHtml && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-medium">Generated Report</span>
            <Button size="sm" variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-1" /> Download HTML
            </Button>
          </div>
          <iframe srcDoc={reportHtml} className="w-full h-[600px] bg-background" title="Audit Report" />
        </Card>
      )}

      {isLoading ? <Skeleton className="h-80" /> : items.length === 0 ? (
        <EmptyState title="No audit logs" description="No events match your filters." icon={<ScrollText className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Actor</th>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {log.event_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.actor_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.client_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => update({ page: page + 1 })}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
