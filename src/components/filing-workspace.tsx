/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FilingProgress } from "@/components/filing-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/page-states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocStatusChip, FilingStatusBadge, type FilingStatus } from "@/components/ui/status-badge";
import { useAuth, type Role } from "@/lib/auth";
import { Check, Download, FolderOpen, Plus, Send, Upload } from "lucide-react";
import { toast } from "sonner";

const FY_OPTIONS = [
  { label: "FY 2022-23", value: "2022-2023" },
  { label: "FY 2023-24", value: "2023-2024" },
  { label: "FY 2024-25", value: "2024-2025" },
  { label: "FY 2025-26", value: "2025-2026" },
];

const COMPLETED_DOC_TYPES = ["ITR_ACKNOWLEDGEMENT", "INVOICE"] as const;

type CompletedDocType = (typeof COMPLETED_DOC_TYPES)[number];

type FilingWorkspaceProps = {
  role: Role;
  clientId?: string;
  title?: string;
  description?: string;
};

function filingIdOf(filing: any) {
  return filing?.filing_id || filing?.id;
}

function listFromResponse(data: any) {
  return data?.items || data?.filings || data?.types || data?.clients || data || [];
}

function uploadToUrl(uploadUrl: string, file: File) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

function normalizeChecked(value: boolean | "indeterminate") {
  return value === true;
}

function FilingCard({
  filing,
  role,
  documentTypes,
}: {
  filing: any;
  role: Role;
  documentTypes: any[];
}) {
  const qc = useQueryClient();
  const filingId = filingIdOf(filing);
  const status = filing.status as FilingStatus;
  const isClient = role === "CLIENT";
  const isReviewer = role !== "CLIENT";

  const { data: directoryData, isLoading: directoryLoading } = useQuery({
    queryKey: ["filing-directory", filingId],
    queryFn: () => api<any>(`/dashboard/directory/${filingId}`),
    enabled: !!filingId,
  });

  const directory = directoryData || {};
  const documents = listFromResponse(directory.documents_required);
  const computations = listFromResponse(directory.computations).sort(
    (a: any, b: any) => (b.version ?? 0) - (a.version ?? 0),
  );
  const completedDocs = listFromResponse(directory.completed_docs);
  const currentComputation = computations[0] || null;
  const allDocumentsApproved =
    documents.length > 0 && documents.every((doc: any) => doc.status === "APPROVED");

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedFy, setSelectedFy] = useState("");

  const assignDocuments = useMutation({
    mutationFn: async (docTypeIds: string[]) => {
      await api(`/documents/filings/${filingId}/assign`, {
        method: "POST",
        body: { document_type_ids: docTypeIds },
      });
      if (status === "INITIATED") {
        await api(`/filings/${filingId}/transition`, {
          method: "POST",
          body: { to_status: "ON_BOARDING" },
        });
      }
    },
    onSuccess: async () => {
      toast.success("Document checklist sent to client");
      setAssignOpen(false);
      setSelectedDocTypes([]);
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to assign documents"),
  });

  const submitDocuments = useMutation({
    mutationFn: () => api(`/filings/${filingId}/submit-documents`, { method: "POST" }),
    onSuccess: async () => {
      toast.success("Documents submitted for review");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit documents"),
  });

  const transition = useMutation({
    mutationFn: (to_status: FilingStatus) =>
      api(`/filings/${filingId}/transition`, { method: "POST", body: { to_status } }),
    onSuccess: async (_, toStatus) => {
      toast.success(`Moved to ${toStatus.replace(/_/g, " ").toLowerCase()}`);
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message || "State transition failed"),
  });

  const approveDocs = useMutation({
    mutationFn: (documentId: string) =>
      api("/documents/approve", { method: "POST", body: { document_ids: [documentId] } }),
    onSuccess: async () => {
      toast.success("Document approved");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to approve"),
  });

  const rejectDocs = useMutation({
    mutationFn: (vars: { documentId: string; reason: string }) =>
      api("/documents/reject", {
        method: "POST",
        body: { rejections: [{ document_id: vars.documentId, reason: vars.reason }] },
      }),
    onSuccess: async () => {
      toast.success("Document rejected");
      setRejectFor(null);
      setRejectReason("");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to reject"),
  });

  const uploadDocument = async (documentId: string, file: File) => {
    try {
      const presign = await api<{ upload_url: string; object_key: string }>(
        "/documents/upload-url",
        {
          method: "POST",
          body: {
            document_id: documentId,
            filename: file.name,
            content_type: file.type || "application/octet-stream",
          },
        },
      );
      await uploadToUrl(presign.upload_url, file);
      await api("/documents/confirm-upload", {
        method: "POST",
        query: {
          document_id: documentId,
          object_key: presign.object_key,
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          file_size: file.size,
        },
      });
      toast.success("Document uploaded");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
  };

  const uploadComputation = async (file: File) => {
    try {
      const presign = await api<{
        upload_url: string;
        object_key: string;
        computation_id: string;
        version: number;
      }>("/computations/upload-url", {
        method: "POST",
        body: {
          filing_id: filingId,
          filename: file.name,
          content_type: file.type || "application/pdf",
        },
      });
      await uploadToUrl(presign.upload_url, file);
      await api("/computations/confirm-upload", {
        method: "POST",
        query: {
          filing_id: filingId,
          object_key: presign.object_key,
          filename: file.name,
          content_type: file.type || "application/pdf",
          file_size: file.size,
          version: presign.version,
        },
      });
      toast.success("Computation uploaded");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to upload computation");
    }
  };

  const uploadCompletedDoc = async (docType: CompletedDocType, file: File) => {
    try {
      const presign = await api<{ upload_url: string; object_key: string }>(
        "/storage/completed-doc/upload-url",
        {
          method: "POST",
          query: {
            filing_id: filingId,
            doc_type: docType,
            filename: file.name,
            content_type: file.type || "application/pdf",
          },
        },
      );
      await uploadToUrl(presign.upload_url, file);
      await api("/storage/completed-doc/confirm", {
        method: "POST",
        query: {
          filing_id: filingId,
          doc_type: docType,
          object_key: presign.object_key,
          filename: file.name,
          content_type: file.type || "application/pdf",
          file_size: file.size,
        },
      });
      toast.success(docType === "INVOICE" ? "Invoice uploaded" : "Acknowledgement uploaded");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to upload completed document");
    }
  };

  const markPaymentReceived = useMutation({
    mutationFn: () => api(`/filings/${filingId}/mark-payment`, { method: "POST" }),
    onSuccess: async () => {
      toast.success("Payment marked as received");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to mark payment"),
  });

  const approveComputation = useMutation({
    mutationFn: (computationId: string) =>
      api("/computations/approve", { method: "POST", body: { computation_id: computationId } }),
    onSuccess: async () => {
      toast.success("Computation approved");
      await qc.invalidateQueries({ queryKey: ["filing-directory", filingId] });
      await qc.invalidateQueries({ queryKey: ["filings"] });
      await transition.mutateAsync("FILING");
    },
    onError: (e: any) => toast.error(e.message || "Failed to approve computation"),
  });

  const openDocumentDownload = async (documentId: string) => {
    try {
      const res = await api<{ download_url: string }>(`/documents/${documentId}/download-url`);
      window.open(res.download_url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open document");
    }
  };

  const openComputationDownload = async (computationId: string) => {
    try {
      const res = await api<{ download_url: string }>(
        `/computations/${computationId}/download-url`,
      );
      window.open(res.download_url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open computation");
    }
  };

  const openCompletedDownload = async (fileId: string) => {
    try {
      const res = await api<{ download_url: string }>(`/storage/${fileId}/download-url`);
      window.open(res.download_url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open file");
    }
  };

  const currentComputationId = currentComputation?.id;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Financial Year {filing.financial_year}</h2>
            <FilingStatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isClient
              ? "Your filing workspace"
              : "Use this workspace to manage the filing lifecycle for this client."}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Last updated</div>
          <div className="font-medium text-foreground">
            {filing.updated_at
              ? new Date(filing.updated_at).toLocaleString()
              : filing.last_updated
                ? new Date(filing.last_updated).toLocaleString()
                : "—"}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <FilingProgress
          current={status}
          halted={status === "HALTED"}
          haltReason={filing.halt_reason}
        />
      </div>

      {directoryLoading ? (
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">Loading directory…</div>
      ) : (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Documents Required
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Checklist, uploads, approvals, and rejections.
                </p>
              </div>
              {isReviewer && (status === "INITIATED" || status === "ON_BOARDING") && (
                <Button variant="outline" onClick={() => setAssignOpen(true)}>
                  <Send className="mr-1 h-4 w-4" /> Send checklist
                </Button>
              )}
              {isClient &&
                (status === "ON_BOARDING" || status === "PROCESSING") &&
                documents.length > 0 &&
                documents.every((doc: any) => ["UPLOADED", "APPROVED"].includes(doc.status)) && (
                  <Button
                    onClick={() => submitDocuments.mutate()}
                    disabled={submitDocuments.isPending}
                  >
                    <Send className="mr-1 h-4 w-4" /> Submit documents
                  </Button>
                )}
              {isReviewer &&
                status === "PROCESSING" &&
                documents.length > 0 &&
                allDocumentsApproved && (
                  <Button
                    onClick={() => transition.mutate("COMPUTATION")}
                    disabled={transition.isPending}
                  >
                    <Send className="mr-1 h-4 w-4" /> Move to computation
                  </Button>
                )}
            </div>

            {documents.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No placeholders have been assigned yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{doc.document_type_name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {doc.original_filename && <span>{doc.original_filename}</span>}
                          {doc.uploaded_at && (
                            <span>Uploaded {new Date(doc.uploaded_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <DocStatusChip status={doc.status} />
                    </div>

                    {isClient &&
                      (status === "ON_BOARDING" || status === "PROCESSING") &&
                      doc.status !== "APPROVED" && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                              const file = event.target.files?.[0];
                              if (file) void uploadDocument(doc.id, file);
                              event.target.value = "";
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Upload a replacement if the document was rejected.
                          </span>
                        </div>
                      )}

                    {isReviewer && doc.status === "UPLOADED" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveDocs.mutate(doc.id)}
                          disabled={approveDocs.isPending}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectFor(doc)}
                          disabled={rejectDocs.isPending}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void openDocumentDownload(doc.id)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                      </div>
                    )}

                    {!isReviewer && doc.file_id && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void openDocumentDownload(doc.id)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" /> Download
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Computation
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload or review the computation document for this filing.
                </p>
              </div>
              {isReviewer && status === "COMPUTATION" && (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  Upload computation
                  <Input
                    className="hidden"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadComputation(file);
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {computations.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No computation has been uploaded yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {computations.map((comp: any) => (
                  <div key={comp.id} className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">Version {comp.version}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {comp.original_filename || "Computation file"}
                          {comp.uploaded_at && (
                            <span> · Uploaded {new Date(comp.uploaded_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <DocStatusChip
                        status={comp.status === "APPROVED" ? "APPROVED" : "UPLOADED"}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openComputationDownload(comp.id)}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> View
                      </Button>
                      {!isClient &&
                        status === "COMPUTATION" &&
                        currentComputationId === comp.id && (
                          <Button
                            size="sm"
                            onClick={() => transition.mutate("FILING")}
                            disabled={transition.isPending}
                          >
                            <Send className="mr-1 h-3.5 w-3.5" /> Move to filing
                          </Button>
                        )}
                      {isClient && status === "COMPUTATION" && comp.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => approveComputation.mutate(comp.id)}
                          disabled={approveComputation.isPending}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve computation
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Filed Documents
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acknowledgement and invoice are unlocked after completion.
                </p>
              </div>
              {isReviewer && status === "FILING" && (
                <Button onClick={() => setSelectedFy("ITR_ACKNOWLEDGEMENT")}>
                  Upload acknowledgement
                </Button>
              )}
            </div>

            {completedDocs.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No filed documents available yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {completedDocs.map((doc: any) => (
                  <div key={doc.id} className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {doc.doc_type?.replace(/_/g, " ") ||
                            doc.original_filename ||
                            "Filed document"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {doc.original_filename || "Stored file"}
                          {doc.uploaded_at && (
                            <span> · Uploaded {new Date(doc.uploaded_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openCompletedDownload(doc.id)}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isReviewer && status === "FILING" && (
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  Upload acknowledgement
                  <Input
                    className="hidden"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadCompletedDoc("ITR_ACKNOWLEDGEMENT", file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <Button
                  onClick={() => transition.mutate("PAYMENT")}
                  disabled={transition.isPending}
                >
                  <Send className="mr-1 h-4 w-4" /> Mark as filed
                </Button>
              </div>
            )}

            {isReviewer && status === "PAYMENT" && (
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  Upload invoice
                  <Input
                    className="hidden"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadCompletedDoc("INVOICE", file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <Button
                  onClick={() => markPaymentReceived.mutate()}
                  disabled={markPaymentReceived.isPending}
                >
                  <Check className="mr-1 h-4 w-4" /> Mark payment received
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send document checklist</DialogTitle>
            <DialogDescription>
              Select the master document types to create placeholders for this filing.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[320px] rounded-md border p-3">
            <div className="space-y-2">
              {documentTypes.map((docType) => {
                const typeId = docType.id || docType.type_id;
                const checked = selectedDocTypes.includes(typeId);
                return (
                  <label
                    key={typeId}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedDocTypes((current) =>
                          normalizeChecked(value)
                            ? Array.from(new Set([...current, typeId]))
                            : current.filter((id) => id !== typeId),
                        );
                      }}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{docType.name}</span>
                      {docType.is_active === false && (
                        <span className="ml-2 text-xs text-muted-foreground">Inactive</span>
                      )}
                    </span>
                  </label>
                );
              })}
              {documentTypes.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No master document types available.
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={selectedDocTypes.length === 0 || assignDocuments.isPending}
              onClick={() => assignDocuments.mutate(selectedDocTypes)}
            >
              Send checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectFor} onOpenChange={(open) => !open && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>
              Add a reason so the client can re-upload the correct file.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectDocs.isPending}
              onClick={() =>
                rejectFor && rejectDocs.mutate({ documentId: rejectFor.id, reason: rejectReason })
              }
            >
              Reject document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedFy} onOpenChange={(open) => !open && setSelectedFy("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload acknowledgement</DialogTitle>
            <DialogDescription>
              Choose the acknowledgement file to upload for this filing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`ack-${filingId}`}>File</Label>
            <Input
              id={`ack-${filingId}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (file) void uploadCompletedDoc("ITR_ACKNOWLEDGEMENT", file);
                event.target.value = "";
                setSelectedFy("");
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function FilingWorkspace({ role, clientId, title, description }: FilingWorkspaceProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isClient = role === "CLIENT";

  const { data: filingsData, isLoading: filingsLoading } = useQuery({
    queryKey: ["filings", role, clientId || user?.user_id || "self"],
    queryFn: () => {
      if (isClient && !clientId) {
        return api<any>("/filings/my/tracking");
      }
      if (clientId) {
        return api<any>("/filings", { query: { client_id: clientId } });
      }
      return api<any>("/filings");
    },
  });
  const { data: documentTypesData } = useQuery({
    queryKey: ["doc-types"],
    queryFn: () => api<any>("/documents/types", { query: { include_inactive: false } }),
  });
  const filings = useMemo(() => listFromResponse(filingsData), [filingsData]);
  const documentTypes = useMemo(() => listFromResponse(documentTypesData), [documentTypesData]);

  const [open, setOpen] = useState(false);
  const [fy, setFy] = useState("");

  const initiate = useMutation({
    mutationFn: (financial_year: string) =>
      api("/filings/initiate", { method: "POST", body: { financial_year, onboarding_data: {} } }),
    onSuccess: async () => {
      toast.success("Filing initiated");
      setOpen(false);
      setFy("");
      await qc.invalidateQueries({ queryKey: ["filings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to initiate"),
  });

  const usedFYs = new Set(filings.map((filing: any) => filing.financial_year));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {title || (isClient ? "My Filings" : "Client Filings")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {description ||
              (isClient
                ? "Track each financial year, upload documents, and complete the filing lifecycle."
                : "Manage the full filing workflow for this client.")}
          </p>
        </div>
        {isClient && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Initiate filing
          </Button>
        )}
      </div>

      {filingsLoading ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">Loading filings…</div>
      ) : filings.length === 0 ? (
        <EmptyState
          title={isClient ? "No filings yet" : "No filings found"}
          description={
            isClient
              ? "Initiate your first financial year filing to get started."
              : "This client has not started a filing yet."
          }
          icon={<FolderOpen className="h-8 w-8" />}
          action={
            isClient ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Initiate filing
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {filings.map((filing: any) => (
            <FilingCard
              key={filingIdOf(filing)}
              filing={filing}
              role={role}
              documentTypes={documentTypes}
            />
          ))}
        </div>
      )}

      {isClient && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate ITR filing</DialogTitle>
              <DialogDescription>
                Select a financial year. You can only start one filing per year.
              </DialogDescription>
            </DialogHeader>
            <Select value={fy} onValueChange={setFy}>
              <SelectTrigger>
                <SelectValue placeholder="Select financial year" />
              </SelectTrigger>
              <SelectContent>
                {FY_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={usedFYs.has(option.value)}
                  >
                    {option.label}
                    {usedFYs.has(option.value) ? " (already started)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!fy || initiate.isPending} onClick={() => initiate.mutate(fy)}>
                Initiate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
