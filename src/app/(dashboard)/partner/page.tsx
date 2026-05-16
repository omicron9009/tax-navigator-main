import { api } from "@/lib/api";
import ClientTable from "./ClientTable";

// Match your types here so the server component knows what to expect
type PendingClient = {
  id?: string;
  client_id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  registered_at?: string;
  account_status?: string;
  pan_document_id?: string;
  pan_document_url?: string;
};

type PendingResponse =
  | PendingClient[]
  | {
      items?: PendingClient[];
      clients?: PendingClient[];
    };

export default async function PartnerDashboardPage() {
  let initialData: PendingResponse = [];

  try {
    // This fetch happens entirely on the server.
    // Next.js will show loading.tsx until this is finished!
    initialData = await api<PendingResponse>("/dashboard/pending-verification");
  } catch (error) {
    console.error("Failed to fetch pending clients:", error);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[calc(var(--text-page-heading)*1.5)] font-bold tracking-tight text-secondary">
          Pending Partner Verifications
        </h1>
        <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
          Manage your pending client verifications
        </p>
      </div>

      {/* Interactive Client Component */}
      <ClientTable initialData={initialData} />
    </div>
  );
}
