import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingStatusBadge, AccountStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { z } from "zod";

const searchSchema = z.object({
  status: z.string().optional(),
  account_status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().optional(),
});

export const Route = createFileRoute("/partner/clients/")({
  component: ClientList,
  validateSearch: (s) => searchSchema.parse(s),
});

function ClientList() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.search || "");
  const page = search.page || 1;

  const { data, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => api<any>("/clients", {
      query: { page, page_size: 20, search: search.search, account_status: search.account_status },
    }),
  });

  const items: any[] = data?.items || data?.clients || data || [];
  const total = data?.total ?? items.length;
  const pageSize = data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const update = (patch: any) => navigate({ search: { ...search, ...patch } as any });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && update({ search: q, page: 1 })}
            />
          </div>
          <Select
            value={search.account_status || "ALL"}
            onValueChange={(v) => update({ account_status: v === "ALL" ? undefined : v, page: 1 })}
          >
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Account status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => update({ search: q, page: 1 })}>Apply</Button>
          {(search.search || search.account_status || search.status) && (
            <Button variant="ghost" onClick={() => { setQ(""); navigate({ search: {} as any }); }}>Clear</Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : items.length === 0 ? (
        <EmptyState title="No clients found" description="Try adjusting your filters." icon={<Users className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Account</th>
                  <th className="px-4 py-3 text-left font-medium">Executive</th>
                  <th className="px-4 py-3 text-left font-medium">Current Filing</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((c: any) => (
                  <tr
                    key={c.client_id || c.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => (navigate as any)({ to: "/partner/clients/$clientId", params: { clientId: c.client_id || c.id } })}
                  >
                    <td className="px-4 py-3 font-medium">{c.full_name || c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3"><AccountStatusBadge status={c.account_status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{c.assigned_executive_name || "—"}</td>
                    <td className="px-4 py-3">
                      {(c.current_state || c.current_filing_status) ? (
                        <FilingStatusBadge status={c.current_state || c.current_filing_status} />
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
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
