import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingStatusBadge, AccountStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import { Search, Users } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ status: z.string().optional(), search: z.string().optional() });

export const Route = createFileRoute("/executive/clients/")({
  component: MyClients,
  validateSearch: (s) => searchSchema.parse(s),
});

function MyClients() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.search || "");

  const { data, isLoading } = useQuery({
    queryKey: ["clients", "mine", search],
    queryFn: () => api<any>("/clients", { query: { search: search.search } }),
  });

  const items: any[] = data?.items || data?.clients || data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">My Clients</h1>
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate({ search: { ...search, search: q } as any })} />
          </div>
          <Button onClick={() => navigate({ search: { ...search, search: q } as any })}>Search</Button>
        </div>
      </Card>

      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No clients yet" description="Clients assigned to you will appear here." icon={<Users className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-left font-medium">Filing</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((c: any) => (
                <tr key={c.client_id || c.id} className="cursor-pointer hover:bg-muted/30"
                  onClick={() => (navigate as any)({ to: "/executive/clients/$clientId", params: { clientId: c.client_id || c.id } })}>
                  <td className="px-4 py-3 font-medium">{c.full_name || c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3"><AccountStatusBadge status={c.account_status} /></td>
                  <td className="px-4 py-3">{(c.current_state || c.current_filing_status) ? <FilingStatusBadge status={c.current_state || c.current_filing_status} /> : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
