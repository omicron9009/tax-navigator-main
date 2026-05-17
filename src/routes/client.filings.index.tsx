import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FilingStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import { Folder, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/client/filings/")({ component: MyFilings });

function FilingCompletedDocs({ filingId }: { filingId: string }) {
  const { data } = useQuery({
    queryKey: ["storage-completed-docs", filingId],
    queryFn: () => api<any[]>(`/storage/completed-docs/${filingId}`),
    enabled: !!filingId,
  });
  const docs: any[] = Array.isArray(data) ? data : [];
  if (docs.length === 0) return null;

  const openDownload = async (fileId: string) => {
    try {
      const res = await api<{ download_url: string }>(`/storage/${fileId}/download-url`);
      window.open(res.download_url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open file");
    }
  };

  return (
    <tr>
      <td colSpan={5} className="px-4 pb-3 pt-0">
        <div className="flex flex-wrap gap-2">
          {docs.map((doc: any) => (
            <Button
              key={doc.id}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => void openDownload(doc.id)}
            >
              <Download className="mr-1 h-3 w-3" />
              {doc.doc_type?.replace(/_/g, " ") || doc.original_filename || "Document"}
            </Button>
          ))}
        </div>
      </td>
    </tr>
  );
}

function MyFilings() {
  const { data, isLoading } = useQuery({
    queryKey: ["filings", "my", "tracking"],
    queryFn: () => api<any>("/filings/my/tracking"),
  });
  const list: any[] = data?.items || data?.filings || data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">My Filings</h1>
      {isLoading ? <Skeleton className="h-64" /> : list.length === 0 ? (
        <EmptyState title="No filings" description="Once you initiate a filing, it will appear here." icon={<Folder className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Financial Year</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Progress</th>
                <th className="px-4 py-3 text-left font-medium">Initiated</th>
                <th className="px-4 py-3 text-left font-medium">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((f: any) => {
                const fid = f.filing_id || f.id;
                return (
                  <Fragment key={fid}>
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold">{f.financial_year}</td>
                      <td className="px-4 py-3"><FilingStatusBadge status={f.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={f.progress_percentage ?? 0} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">{f.progress_percentage ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {f.initiated_at ? new Date(f.initiated_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {f.completed_at ? new Date(f.completed_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                    <FilingCompletedDocs filingId={fid} />
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
