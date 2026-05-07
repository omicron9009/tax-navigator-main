import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import { Folder } from "lucide-react";

export const Route = createFileRoute("/client/filings/")({ component: MyFilings });

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
                <th className="px-4 py-3 text-left font-medium">Initiated</th>
                <th className="px-4 py-3 text-left font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((f: any) => (
                <tr key={f.filing_id || f.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{f.financial_year}</td>
                  <td className="px-4 py-3"><FilingStatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.updated_at ? new Date(f.updated_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
