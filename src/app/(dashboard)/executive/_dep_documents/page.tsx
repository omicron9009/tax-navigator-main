// src/app/executive/documents/page.tsx
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function ExecutiveDocumentTypesPage() {
  let items: any[] = [];

  try {
    const data = await api<any>("/documents/types");
    items = data?.items || data?.types || data || [];
  } catch (error) {
    console.error("❌ Failed to pull platform document definitions:", error);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans antialiased select-none">
      {/* Page Header canopy */}
      <div>
        <h1 className="text-page-heading font-black text-secondary uppercase tracking-tight leading-none">
          Document Checklist Types
        </h1>
        <p className="mt-2 text-sm text-content-muted font-medium">
          System reference ledger of validated document types requestable for
          client filing compliance checkmarks.
        </p>
      </div>

      {/* Main Grid Card Content */}
      {items.length === 0 ? (
        <Card className="p-12 text-center border border-surface-border shadow-soft rounded-none bg-white">
          <p className="text-xs font-mono text-content-light italic">
            No active document classification templates compiled by the backend
            master node.
          </p>
        </Card>
      ) : (
        <Card className="p-6 border border-surface-border shadow-soft rounded-none bg-white">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t: any) => (
              <li
                key={t.id || t.type_id}
                className="flex items-center gap-3 border border-surface-border/60 bg-slate-50/40 px-4 py-3 text-xs font-bold uppercase tracking-wide text-brand-navy rounded-none hover:border-[#071B3B] transition-colors group"
              >
                {/* Visual marker reinforcing an industrial asset log checklist */}
                <FileText
                  size={14}
                  className="text-content-light group-hover:text-[#0087ff] transition-colors shrink-0"
                />
                <span className="truncate">{t.name}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
