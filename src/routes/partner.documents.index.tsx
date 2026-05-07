import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/page-states";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/documents/")({ component: DocumentTypes });

function DocumentTypes() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["doc-types", { include_inactive: true }],
    queryFn: () => api<any>("/documents/types", { query: { include_inactive: true } }),
  });
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const create = useMutation({
    mutationFn: (n: string) => api("/documents/types", { method: "POST", body: { name: n } }),
    onSuccess: () => { toast.success("Document type added"); setName(""); qc.invalidateQueries({ queryKey: ["doc-types"] }); },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });
  const update = useMutation({
    mutationFn: (v: { id: string; body: any }) => api(`/documents/types/${v.id}`, { method: "PUT", body: v.body }),
    onSuccess: () => { toast.success("Updated"); setEditing(null); qc.invalidateQueries({ queryKey: ["doc-types"] }); },
  });

  const items: any[] = data?.items || data?.types || data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Master List</h1>
        <p className="text-sm text-muted-foreground">Define the document types you can request from clients</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input placeholder="New document type name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => name.trim() && create.mutate(name.trim())} disabled={!name.trim() || create.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No document types" description="Add types that you'll request from clients (e.g., Form 16, Bank Statement)." icon={<FileText className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((t: any) => (
                <tr key={t.id || t.type_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {editing && editing.id === (t.id || t.type_id) ? (
                      <div className="flex gap-2">
                        <Input value={editing.name} onChange={(e) => setEditing({ id: editing.id, name: e.target.value })} />
                        <Button size="sm" onClick={() => update.mutate({ id: editing.id, body: { name: editing.name } })}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <span className="font-medium">{t.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.is_active !== false ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}>{t.is_active !== false ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ id: t.id || t.type_id, name: t.name })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {t.is_active !== false && (
                        <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: t.id || t.type_id, body: { is_active: false } })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
