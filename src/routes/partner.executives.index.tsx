import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, UserCog, UserX, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/page-states";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/executives/")({ component: Executives });

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
type V = z.infer<typeof schema>;

function Executives() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["executives"],
    queryFn: () => api<any>("/executives"),
  });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) });

  const create = useMutation({
    mutationFn: (b: V) => api("/executives", { method: "POST", body: b }),
    onSuccess: () => { toast.success("Executive created"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: ["executives"] }); },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });
  const deact = useMutation({
    mutationFn: (id: string) => api(`/executives/${id}/deactivate`, { method: "POST" }),
    onSuccess: () => { toast.success("Deactivated"); qc.invalidateQueries({ queryKey: ["executives"] }); },
  });
  const react = useMutation({
    mutationFn: (id: string) => api(`/executives/${id}/reactivate`, { method: "POST" }),
    onSuccess: () => { toast.success("Reactivated"); qc.invalidateQueries({ queryKey: ["executives"] }); },
  });

  const items: any[] = data?.items || data?.executives || data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executives</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create Executive</Button>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No executives yet" description="Create your first executive to start delegating client work." icon={<UserCog className="h-8 w-8" />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Clients</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((e: any) => (
                <tr key={e.executive_id || e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{e.full_name || e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}>{e.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3">{e.assigned_client_count ?? e.client_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {e.is_active ? (
                        <Button size="sm" variant="outline" onClick={() => deact.mutate(e.executive_id || e.id)}>
                          <UserX className="h-3.5 w-3.5 mr-1" /> Deactivate
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => react.mutate(e.executive_id || e.id)}>
                          <UserCheck className="h-3.5 w-3.5 mr-1" /> Reactivate
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Executive</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((b) => create.mutate(b))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Temporary password</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
