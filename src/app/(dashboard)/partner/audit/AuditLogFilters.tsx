"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const EVENT_TYPES = [
  "ACCOUNT_REGISTERED",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_REJECTED",
  "ACCOUNT_DEACTIVATED",
  "ACCOUNT_REACTIVATED",
  "EXECUTIVE_CREATED",
  "EXECUTIVE_ASSIGNED",
  "EXECUTIVE_UNASSIGNED",
  "FILING_INITIATED",
  "FILING_STATE_CHANGED",
  "FILING_HALTED",
  "DOCUMENT_PLACEHOLDER_CREATED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_APPROVED",
  "DOCUMENT_REJECTED",
  "DOCUMENT_DOWNLOADED",
  "COMPUTATION_UPLOADED",
  "COMPUTATION_APPROVED",
  "COMPUTATION_SUPERSEDED",
  "ITR_FILED",
  "PAYMENT_RECEIVED",
  "INVOICE_UPLOADED",
  "FORM_FIELD_ADDED",
  "FORM_FIELD_UPDATED",
  "FORM_FIELD_REMOVED",
  "MASTER_DOC_TYPE_ADDED",
  "MASTER_DOC_TYPE_UPDATED",
  "MASTER_DOC_TYPE_REMOVED",
];

interface FilterProps {
  activeFilters: {
    page: number;
    eventType: string;
    clientId: string;
    startDate: string;
    endDate: string;
  };
}

export default function AuditLogFilters({ activeFilters }: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state buffers for interactive query tracking
  const [from, setFrom] = useState(activeFilters.startDate);
  const [to, setTo] = useState(activeFilters.endDate);
  const [clientId, setClientId] = useState(activeFilters.clientId);
  const [eventType, setEventType] = useState(activeFilters.eventType);

  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset context on query updates

    if (from) params.set("start_date", from);
    else params.delete("start_date");
    if (to) params.set("end_date", to);
    else params.delete("end_date");
    if (clientId) params.set("client_id", clientId);
    else params.delete("client_id");
    if (eventType !== "ALL") params.set("event_type", eventType);
    else params.delete("event_type");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleGenerateReport = async () => {
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
      const html =
        typeof res === "string"
          ? res
          : res?.html || res?.report || JSON.stringify(res, null, 2);
      setReportHtml(html);
      toast.success("Audit report compilation complete.");
    } catch (e: any) {
      toast.error(e.message || "Failed to compile document report matrix");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportHtml) return;
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-${from || "all"}-${to || "all"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-card">
        <div className="grid gap-4 md:grid-cols-5 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              From
            </Label>
            <Input
              type="date"
              value={from}
              className="rounded-none border-surface-border"
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              To
            </Label>
            <Input
              type="date"
              value={to}
              className="rounded-none border-surface-border"
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Event Matrix Classification
            </Label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-surface-border rounded-none text-sm outline-none focus:border-primary transition-all h-10"
            >
              <option value="ALL">All operational streams</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Client Context ID (Optional)
            </Label>
            <Input
              value={clientId}
              className="rounded-none border-surface-border"
              onChange={(e) => setClientId(e.target.value)}
              placeholder="UUID string Format"
            />
          </div>

          <div className="flex gap-2 h-10">
            <Button
              onClick={handleApplyFilters}
              disabled={isPending}
              className="flex-1 rounded-none font-medium"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply Parameters"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="rounded-none border-surface-border font-medium"
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1" />
              )}{" "}
              Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Embedded Render Frame for HTML Output (BRD Requirement) */}
      {reportHtml && (
        <Card className="p-0 overflow-hidden border border-surface-border shadow-soft rounded-none bg-card">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-3 bg-secondary/10">
            <span className="text-sm font-semibold text-secondary">
              Compiled Administrative Summary Report
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadReport}
              className="rounded-none border-surface-border font-medium"
            >
              <Download className="h-4 w-4 mr-1" /> Export Document HTML
            </Button>
          </div>
          <iframe
            srcDoc={reportHtml}
            className="w-full h-[600px] bg-white border-0"
            title="System Audit Analytics Summary"
          />
        </Card>
      )}
    </div>
  );
}
