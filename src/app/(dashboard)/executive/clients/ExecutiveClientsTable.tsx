"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Users, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AccountStatusBadge,
  FilingStatusBadge,
} from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";

interface ExecutiveClientsTableProps {
  initialData: {
    items?: any[];
    clients?: any[];
  };
  currentStatus: string;
}

export default function ExecutiveClientsTable({
  initialData,
  currentStatus,
}: ExecutiveClientsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Controlled input local state instantiated from live URL parameters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const items: any[] = initialData?.items || initialData?.clients || [];

  // Handles updating search state through URL mutate query injection natively
  const executeQuerySearch = (queryVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset window iteration indexes upon query mutator firing

    if (queryVal.trim()) {
      params.set("search", queryVal);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4 font-sans select-none antialiased">
      {/* Search Actions Controller Wrapper */}
      <Card className="p-4 border border-surface-border shadow-soft rounded-none bg-white">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-light" />
            <input
              type="text"
              className="w-full pl-9 pr-4 h-10 bg-white border border-surface-border rounded-none text-sm outline-none focus:border-[#071B3B] transition-all font-medium text-content-main"
              placeholder="Filter assigned clients by name, email, PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && executeQuerySearch(searchQuery)
              }
            />
          </div>
          <Button
            style={{ backgroundColor: "#071B3B" }}
            className="text-white hover:opacity-90 transition-opacity rounded-none font-bold text-xs h-10 px-5 cursor-pointer border-none shadow-sm shrink-0 flex items-center gap-2"
            disabled={isPending}
            onClick={() => executeQuerySearch(searchQuery)}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </Card>

      {/* Synchronized Processing Lane Indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs font-mono tracking-tight text-[#0087ff] animate-pulse pl-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Synchronizing backend workspace records...
        </div>
      )}

      {/* Core Grid Dataset Renderer */}
      {items.length === 0 ? (
        <EmptyState
          title="No assigned records found"
          description={
            currentStatus || searchQuery
              ? "No clients match your selected search or status metrics filters."
              : "No client pipeline allocations are assigned to your operational node tracker."
          }
          icon={<Users className="h-8 w-8 text-[#071B3B]/40" />}
        />
      ) : (
        <Card className="overflow-hidden p-0 border border-surface-border shadow-soft rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* 🎨 THE NAVY PASS: Force header tracks to use your exact corporate navy block alignment */}
              <thead
                style={{ backgroundColor: "#071B3B" }}
                className="text-white text-xs uppercase tracking-wider"
              >
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    Client Name
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Email Anchor
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Verification Status
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Active Filing State
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-card">
                {items.map((c: any) => {
                  const targetClientId = c.client_id || c.id;
                  const activeState =
                    c.current_state || c.current_filing_status;

                  return (
                    <tr
                      key={targetClientId || c.email}
                      // 🧠 THE SEAMLESS TRANSITION: Router programmatic pushes into the executive client folder route
                      onClick={() =>
                        router.push(`/executive/clients/${targetClientId}`)
                      }
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer select-none group"
                    >
                      {/* Bold name text flashes to brand-blue on row hover state context triggers */}
                      <td className="px-5 py-4 font-bold text-secondary group-hover:text-[#0087ff] transition-colors">
                        {c.full_name || c.name}
                      </td>
                      <td className="px-5 py-4 text-content-muted font-medium">
                        {c.email}
                      </td>
                      <td className="px-5 py-4">
                        <AccountStatusBadge status={c.account_status} />
                      </td>
                      <td className="px-5 py-4">
                        {activeState ? (
                          <FilingStatusBadge status={activeState} />
                        ) : (
                          <span className="text-content-light italic text-xs pl-2">
                            —
                          </span>
                        )}
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
