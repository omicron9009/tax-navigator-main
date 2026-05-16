// src/app/partner/executives/ExecutivesClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, UserCog, UserX, UserCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/page-states";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ExecutiveFormData = z.infer<typeof schema>;

interface ExecutivesClientProps {
  initialItems: any[];
}

export default function ExecutivesClient({
  initialItems,
}: ExecutivesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExecutiveFormData>({ resolver: zodResolver(schema) });

  // Replaces the 'create' useMutation
  const onSubmit = async (data: ExecutiveFormData) => {
    try {
      await api("/executives", { method: "POST", body: data });
      toast.success("Executive created successfully");
      setOpen(false);
      reset();

      // Replaces qc.invalidateQueries()
      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to create executive");
    }
  };

  // Replaces the 'deact' and 'react' useMutations
  const toggleStatus = async (id: string, currentlyActive: boolean) => {
    setActionId(id);
    const endpoint = currentlyActive ? "deactivate" : "reactivate";

    try {
      await api(`/executives/${id}/${endpoint}`, { method: "POST" });
      toast.success(
        `Executive ${currentlyActive ? "deactivated" : "reactivated"}`,
      );

      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Executive
        </Button>
      </div>

      {initialItems.length === 0 ? (
        <EmptyState
          title="No executives yet"
          description="Create your first executive to start delegating client work."
          icon={<UserCog className="h-8 w-8" />}
        />
      ) : (
        <Card className="overflow-hidden p-0 relative">
          {/* Subtle loading overlay during transitions */}
          {isPending && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

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
              {initialItems.map((e: any) => {
                const id = e.executive_id || e.id;
                const isProcessing = actionId === id;

                return (
                  <tr key={id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {e.full_name || e.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          e.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {e.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">
                      {e.assigned_client_count ?? e.client_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isProcessing || isPending}
                          onClick={() => toggleStatus(id, e.is_active)}
                          className="w-28 shadow-none"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : e.is_active ? (
                            <>
                              <UserX className="h-3.5 w-3.5 mr-1.5" />{" "}
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5 mr-1.5" />{" "}
                              Reactivate
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Executive</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                disabled={isSubmitting}
              />
              {errors.full_name && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
