// src/app/partner/executives/page.tsx
import { api } from "@/lib/api";
import ExecutivesClient from "./ExecutivesClient";

export default async function PartnerExecutivesPage() {
  // Fetch data directly on the server. No useQuery needed.
  // Add proper error handling/boundaries as needed in your production setup.
  const data = await api<any>("/executives", { cache: "no-store" });

  // Normalize the payload before passing to the client
  const items = data?.items || data?.executives || data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Executives</h1>
        <p className="text-sm text-muted-foreground">Manage staff accounts</p>
      </div>

      {/* Pass the server-fetched data as initial state */}
      <ExecutivesClient initialItems={items} />
    </div>
  );
}
