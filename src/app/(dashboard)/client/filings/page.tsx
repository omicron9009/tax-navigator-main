// src/app/client/filings/page.tsx
import { api } from "@/lib/api";
import { EmptyState } from "@/components/page-states";
import { Folder } from "lucide-react";
import ArchiveWorkspaceManager from "./ArchiveWorkspaceManager";

export default async function ClientFilingsHistoryPage() {
  let list: any[] = [];

  try {
    // 🧠 HIGH-LEVERAGE: Load the master historical dataset entirely on the server
    const data = await api<any>("/filings/my/tracking");
    list = data?.items || data?.filings || data || [];
  } catch (error) {
    console.error(
      "❌ Failed to query client filing history segments on server node:",
      error,
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans antialiased select-none">
      {/* Dynamic Canopy Header */}
      <div>
        <h1 className="text-page-heading font-black tracking-tight text-secondary uppercase leading-none">
          My Filings
        </h1>
        <p className="mt-2 text-xs font-semibold text-content-light">
          Click on a filing to view all documents and track progress.
        </p>
      </div>

      {/* Core Dynamic Content Hub */}
      {list.length === 0 ? (
        <EmptyState
          title="No Filing History Found"
          description="You have not initialized an active individual compliance session yet. Head over to your dashboard portal to deploy your first filing loop tracking segment."
          icon={<Folder className="h-8 w-8 text-[#071B3B]/30" />}
        />
      ) : (
        /* Hand off data downstream into our stateful container component. 
          This cleanly bridges the server-fetched lists with interactive dialog views.
        */
        <ArchiveWorkspaceManager initialList={list} />
      )}
    </div>
  );
}
