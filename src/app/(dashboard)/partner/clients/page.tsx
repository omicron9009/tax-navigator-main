// src/app/partner/clients/page.tsx
import { api } from "@/lib/api";
import PartnerClientsTable from "./PartnerClientsTable";

export type ClientListItem = {
  id: string;
  full_name: string;
  email: string;
  account_status: "ACTIVE" | "PENDING_VERIFICATION" | "REJECTED";
  assigned_executive_name: string | null;
  assigned_executive_id: string | null;
  active_filing_years: string[];
  current_state: string | null;
  last_updated: string;
};

export type ClientsApiResponse = {
  items: ClientListItem[];
  total: number;
  page: number;
  page_size: number;
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    page_size?: string;
    search?: string;
    account_status?: string;
    financial_year?: string;
  }>;
}

export default async function PartnerClientsPage({ searchParams }: PageProps) {
  // Await the search parameters safely in modern App Router contexts
  const resolvedParams = await searchParams;

  const currentPage = Number(resolvedParams.page) || 1;
  const pageSize = Number(resolvedParams.page_size) || 20;
  const searchString = resolvedParams.search || "";
  const currentStatus = resolvedParams.account_status || "";
  const selectedYear = resolvedParams.financial_year || "";

  let apiData: ClientsApiResponse = {
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
  };

  try {
    // Fetches fresh data on the server side every time a parameter changes
    apiData = await api<ClientsApiResponse>("/clients", {
      query: {
        page: currentPage,
        page_size: pageSize,
        search: searchString || undefined,
        account_status: currentStatus || undefined,
        financial_year: selectedYear || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to load global clients database:", error);
  }

  return (
    <div className="space-y-8">
      {/* Page Heading Section */}
      <div>
        <h1 className="text-[calc(var(--text-page-heading)*1.5)] font-bold tracking-tight text-secondary">
          Global Client Base
        </h1>
        <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
          View, search, filter, and track all clients registered on the
          platform.
        </p>
      </div>

      {/* Interactive Layout Component */}
      <PartnerClientsTable
        apiData={apiData}
        activeFilters={{
          search: searchString,
          status: currentStatus,
          year: selectedYear,
        }}
      />
    </div>
  );
}
