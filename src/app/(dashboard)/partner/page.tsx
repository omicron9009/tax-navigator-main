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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 border border-surface-border shadow-soft rounded-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-light">
            Total Pending Queue
          </p>
          <p className="text-2xl font-black text-brand-navy mt-1">2 Accounts</p>
        </div>
        <div className="bg-white p-4 border border-surface-border shadow-soft rounded-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-light">
            Avg. Age in Queue
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">24.5 Hours</p>
        </div>
        <div className="bg-white p-4 border border-surface-border shadow-soft rounded-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-light">
            SLA Compliance Rate
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">98.4%</p>
        </div>
      </div>

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
