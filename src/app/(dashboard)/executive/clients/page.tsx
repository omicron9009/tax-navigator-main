// src/app/executive/clients/page.tsx
import { api } from "@/lib/api";
import ExecutiveClientsTable from "./ExecutiveClientsTable";

interface PageProps {
  // Next.js 15+ searchParams are provided as a Promise type boundary block
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ExecutiveClientsPage({
  searchParams,
}: PageProps) {
  // 1. Un-wrap your live search parameters safely from the server context
  const resolvedParams = await searchParams;
  const activeStatusFilter = resolvedParams.status || "";
  const activeSearchQuery = resolvedParams.search || "";
  const currentPage = Number(resolvedParams.page) || 1;

  let clientPayload = { items: [], total: 0, page: 1, page_size: 20 };

  try {
    // 2. Query the data from your FastAPI server before hydration begins
    clientPayload = await api<any>("/clients", {
      query: {
        page: currentPage,
        page_size: 20,
        // If an executive clicked a specific filter badge from "My Workspace", route it here
        account_status: activeStatusFilter || undefined,
        search: activeSearchQuery || undefined,
      },
    });
  } catch (error) {
    console.error(
      "❌ Failed to query executive client rosters from server context:",
      error,
    );
  }

  return (
    // 🎨 The max-width boundary handles fluid text containment perfectly on wide monitors
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Dynamic Shell Title Meta Segment */}
      <div>
        <h1 className="text-page-heading font-black text-secondary uppercase tracking-tight leading-none">
          Assigned Clients
        </h1>
        {activeStatusFilter ? (
          <p className="text-xs font-mono mt-2 text-content-muted">
            Filtering by pipeline segment:{" "}
            <span className="font-bold text-[#0087ff] uppercase">
              {activeStatusFilter}
            </span>
          </p>
        ) : (
          <p className="text-sm mt-1 text-content-muted font-medium">
            Manage allocations, track active tax strings, and advance client
            verification states.
          </p>
        )}
      </div>

      {/* 3. The Table Engine handles the search inputs and displays data rows */}
      <ExecutiveClientsTable
        initialData={clientPayload}
        currentStatus={activeStatusFilter}
      />
    </div>
  );
}
