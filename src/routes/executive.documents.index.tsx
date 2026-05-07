import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/executive/documents/")({ component: ExecDocs });

function ExecDocs() {
  const { data, isLoading } = useQuery({ queryKey: ["doc-types"], queryFn: () => api<any>("/documents/types") });
  const items: any[] = data?.items || data?.types || data || [];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Document Types</h1>
      <p className="text-sm text-muted-foreground">Reference list of document types you can request from clients.</p>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Card className="p-4">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t: any) => (
              <li key={t.id || t.type_id} className="rounded border bg-muted/30 px-3 py-2 text-sm">{t.name}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
