import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/audit/")({ component: AuditLog });

function AuditLog() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [clientId, setClientId] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await api<string>("/audit/log", {
        query: { from_date: from, to_date: to, client_id: clientId || undefined },
      });
      setHtml(typeof res === "string" ? res : JSON.stringify(res));
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
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
        <p className="text-sm text-muted-foreground">Generate an audit report for a date range</p>
      </div>
      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5"><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Client ID (optional)</Label><Input value={clientId} onChange={(e) => setClientId(e.target.value)} /></div>
          <div className="flex items-end gap-2">
            <Button onClick={run} disabled={loading}><FileText className="h-4 w-4 mr-1" /> Generate</Button>
            {html && <Button variant="outline" onClick={download}><Download className="h-4 w-4 mr-1" /> Download</Button>}
          </div>
        </div>
      </Card>
      {html && (
        <Card className="p-0 overflow-hidden">
          <iframe srcDoc={html} className="w-full h-[600px] bg-background" title="Audit Log" />
        </Card>
      )}
    </div>
  );
}
