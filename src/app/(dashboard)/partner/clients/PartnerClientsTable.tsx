// src/app/partner/clients/PartnerClientsTable.tsx
"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import type { ClientsApiResponse } from "./page";

interface TableProps {
  apiData: ClientsApiResponse;
  activeFilters: {
    search: string;
    status: string;
    year: string;
  };
}

export default function PartnerClientsTable({
  apiData,
  activeFilters,
}: TableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Handles updating URL query params natively
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset back to page 1 whenever filters change
    params.set("page", "1");

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Layout Wrapper */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Text Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-content-muted" />
            <input
              type="text"
              defaultValue={activeFilters.search}
              placeholder="Search clients by name or email..."
              onChange={(e) =>
                updateFilters({ search: e.target.value || null })
              }
              className="w-full pl-9 pr-4 py-2 bg-card border border-surface-border rounded-none text-sm outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Account Status Filter Dropdown */}
          <select
            defaultValue={activeFilters.status}
            onChange={(e) =>
              updateFilters({ account_status: e.target.value || null })
            }
            className="w-full sm:w-48 px-3 py-2 bg-card border border-surface-border rounded-none text-sm outline-none focus:border-primary transition-all"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Global Loading Spinner Indicator */}
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-content-muted">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Updating entries...
          </div>
        )}
      </div>

      {/* Core Table View Layer */}
      {apiData.items.length === 0 ? (
        <Card className="p-12 text-center border border-surface-border shadow-soft rounded-none bg-card">
          <p className="text-sm text-content-muted">
            No client records found matching your current parameters.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border border-surface-border shadow-soft rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    Client Name
                  </th>
                  {/* High-leverage move: Merged Contact Column */}
                  <th className="px-5 py-4 text-left font-semibold">
                    Contact Info
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Assigned Executive
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Workflow State
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-card">
                {apiData.items.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-secondary">
                      {client.full_name}
                    </td>
                    {/* The new stacked contact info cell */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-content-muted truncate">
                          {client.email}
                        </span>
                        {client.phone_number && (
                          <a
                            href={`tel:${client.phone_number}`}
                            title="Click to call"
                            className="text-[11px] text-content-muted/70 hover:text-primary transition-colors font-mono tracking-tight"
                          >
                            {client.phone_number}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-content-muted">
                      {client.assigned_executive_name || (
                        <span className="italic text-xs text-content-muted/60">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium tracking-tight bg-slate-100 text-slate-700 uppercase">
                        {client.current_state || "Idle"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <AccountStatusBadge status={client.account_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Simple Pagination Controls Footer */}
      {apiData.total > apiData.page_size && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            disabled={apiData.page <= 1 || isPending}
            onClick={() => updateFilters({ page: String(apiData.page - 1) })}
            className="px-3 py-1.5 border border-surface-border text-sm disabled:opacity-40 hover:bg-muted transition-colors rounded-none"
          >
            Previous
          </button>
          <span className="text-xs text-content-muted px-2">
            Page {apiData.page} of{" "}
            {Math.ceil(apiData.total / apiData.page_size)}
          </span>
          <button
            disabled={
              apiData.page >= Math.ceil(apiData.total / apiData.page_size) ||
              isPending
            }
            onClick={() => updateFilters({ page: String(apiData.page + 1) })}
            className="px-3 py-1.5 border border-surface-border text-sm disabled:opacity-40 hover:bg-muted transition-colors rounded-none"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
