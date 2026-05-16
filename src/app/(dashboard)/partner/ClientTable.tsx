"use client";

import { useCallback, useState } from "react";
import { ExternalLink, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/page-states";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Types
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

function pendingItems(pending: PendingResponse): PendingClient[] {
  if (Array.isArray(pending)) return pending;
  return pending?.items || pending?.clients || [];
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ClientTable({
  initialData,
}: {
  initialData: PendingResponse;
}) {
  // Initialize state with the data passed from the server
  const [pendingList, setPendingList] = useState<PendingClient[]>(
    pendingItems(initialData),
  );

  const [rejectFor, setRejectFor] = useState<PendingClient | null>(null);
  const [reason, setReason] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // We still need a way to refresh the table AFTER an action is taken
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPending = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const pending = await api<PendingResponse>(
        "/dashboard/pending-verification",
      );
      setPendingList(pendingItems(pending));
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to load pending verifications"));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const activateClient = async (client_id?: string) => {
    if (!client_id) {
      toast.error("Missing client id");
      return;
    }

    setIsActivating(true);
    try {
      await api("/clients/activate", { method: "POST", body: { client_id } });
      toast.success("Client activated");
      await loadPending(); // Refresh table data
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to activate"));
    } finally {
      setIsActivating(false);
    }
  };

  const rejectClient = async () => {
    if (!rejectFor) return;
    const clientId = rejectFor.client_id || rejectFor.id;
    if (!clientId) {
      toast.error("Missing client id");
      return;
    }

    setIsRejecting(true);
    try {
      await api("/clients/reject", {
        method: "POST",
        body: {
          client_id: clientId,
          reason,
        },
      });
      toast.success("Client rejected");
      setRejectFor(null);
      setReason("");
      await loadPending(); // Refresh table data
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to reject"));
    } finally {
      setIsRejecting(false);
    }
  };

  const openPan = async (client: PendingClient) => {
    try {
      if (client.pan_document_url) {
        window.open(client.pan_document_url, "_blank");
        return;
      }
      if (client.pan_document_id) {
        const res = await api<{ download_url: string }>(
          `/storage/${client.pan_document_id}/download-url`,
        );
        window.open(res.download_url, "_blank");
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Could not open document"));
    }
  };

  return (
    <>
      <section className="relative">
        {/* Optional: Show a subtle spinner overlay when actions trigger a data refresh */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {pendingList.length === 0 ? (
          <EmptyState
            title="All caught up"
            description="No clients are awaiting verification right now."
            icon={<Check className="h-8 w-8 text-primary" />}
          />
        ) : (
          <Card className="overflow-hidden p-0 border border-surface-border shadow-soft rounded-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Client
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">Email</th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Registered
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border bg-card">
                  {pendingList.map((c) => (
                    <tr
                      key={c.client_id || c.id || c.email}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-secondary">
                        {c.full_name || c.name}
                      </td>
                      <td className="px-5 py-4 text-content-muted">
                        {c.email}
                      </td>
                      <td className="px-5 py-4 text-content-muted">
                        {c.registered_at
                          ? new Date(c.registered_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <AccountStatusBadge
                          status={c.account_status || "PENDING_VERIFICATION"}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          {c.pan_document_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                              onClick={() => openPan(c)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" /> PAN
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => activateClient(c.client_id || c.id)}
                            disabled={isActivating || isRefreshing}
                          >
                            <Check className="h-4 w-4 mr-2" /> Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectFor(c)}
                            disabled={isRefreshing}
                          >
                            <X className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* Reject Dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent className="rounded-none border-t-4 border-t-destructive">
          <DialogHeader>
            <DialogTitle className="text-secondary">Reject client</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <span className="font-bold text-secondary">
                {rejectFor?.full_name || rejectFor?.email}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection"
            rows={4}
            className="rounded-none focus-visible:ring-secondary"
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setRejectFor(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-none"
              disabled={!reason.trim() || isRejecting}
              onClick={rejectClient}
            >
              Reject client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
