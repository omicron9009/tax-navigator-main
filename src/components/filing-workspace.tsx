"use client";

import {
  useMemo,
  useState,
  useTransition,
  useEffect,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { FilingProgress } from "@/components/filing-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/page-states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DocStatusChip,
  FilingStatusBadge,
  type FilingStatus,
} from "@/components/ui/status-badge";
import { type Role } from "@/lib/auth";
import {
  Check,
  Download,
  FolderOpen,
  Plus,
  Send,
  Upload,
  OctagonX,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const FY_OPTIONS = [
  { label: "FY 2022-23", value: "2022-2023" },
  { label: "FY 2023-24", value: "2023-2024" },
  { label: "FY 2024-25", value: "2024-2025" },
  { label: "FY 2025-26", value: "2025-2026" },
];

interface FilingWorkspaceProps {
  role: Role;
  clientId?: string;
  title?: string;
  description?: string;
  initialFilingsData?: any;
  initialDocTypesData?: any;
}

function filingIdOf(filing: any) {
  return filing?.filing_id || filing?.id;
}

function listFromResponse(data: any) {
  return (
    data?.items || data?.filings || data?.types || data?.clients || data || []
  );
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

// ==========================================
// INTERNAL SUB-COMPONENT: WORKSPACE CARD
// ==========================================
function FilingCard({
  filing,
  role,
  documentTypes,
  onRefresh,
}: {
  filing: any;
  role: Role;
  documentTypes: any[];
  onRefresh: () => void;
}) {
  const filingId = filingIdOf(filing);
  const status = filing.status as FilingStatus;
  const isClient = role === "CLIENT";
  const isReviewer = role !== "CLIENT";

  const [isMutating, setIsMutating] = useState(false);
  const [directory, setDirectory] = useState<any>({});
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Lazy-load internal directory tracks to prune client initialization cascades
  const fetchDirectory = async () => {
    if (!filingId) return;
    setDirectoryLoading(true);
    try {
      const res = await api<any>(`/dashboard/directory/${filingId}`);
      setDirectory(res || {});
    } catch (e) {
      console.error("Failed to load filing file metrics directory mapping:", e);
    } finally {
      setDirectoryLoading(false);
    }
  };

  // 🛡️ THE FIX: Side-effects run cleanly inside safe useEffect lifecycle lanes
  useEffect(() => {
    if (filingId) {
      fetchDirectory();
    }
  }, [filingId]);

  const documents = listFromResponse(directory.documents_required);
  const computations = listFromResponse(directory.computations).sort(
    (a: any, b: any) => (b.version ?? 0) - (a.version ?? 0),
  );
  const completedDocs = listFromResponse(directory.completed_docs);
  const currentComputation = computations[0] || null;
  const allDocumentsApproved =
    documents.length > 0 &&
    documents.every((doc: any) => doc.status === "APPROVED");

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedFy, setSelectedFy] = useState("");
  const [haltOpen, setHaltOpen] = useState(false);
  const [haltReason, setHaltReason] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const fetchHistory = async () => {
    if (!filingId) return;
    try {
      const res = await api<any[]>(`/filings/${filingId}/history`);
      setHistoryData(res || []);
    } catch (e) {
      toast.error("Could not fetch historical auditing segments.");
    }
  };

  const handleActionWrapper = async (
    actionFn: () => Promise<void>,
    successMsg: string,
  ) => {
    setIsMutating(true);
    try {
      await actionFn();
      toast.success(successMsg);
      await fetchDirectory();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Operation task tracking failure.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleAssignDocuments = () => {
    handleActionWrapper(async () => {
      await api(`/documents/filings/${filingId}/assign`, {
        method: "POST",
        body: { document_type_ids: selectedDocTypes },
      });
      if (status === "INITIATED") {
        await api(`/filings/${filingId}/transition`, {
          method: "POST",
          body: { to_status: "ON_BOARDING" },
        });
      }
      setAssignOpen(false);
      setSelectedDocTypes([]);
    }, "Document checklist sent to client");
  };

  const handleSubmitDocuments = () => {
    handleActionWrapper(async () => {
      await api(`/filings/${filingId}/submit-documents`, { method: "POST" });
    }, "Documents submitted for review");
  };

  const handleTransition = (to_status: FilingStatus) => {
    handleActionWrapper(
      async () => {
        await api(`/filings/${filingId}/transition`, {
          method: "POST",
          body: { to_status },
        });
      },
      `Pipeline moved to ${to_status.replace(/_/g, " ").toLowerCase()}`,
    );
  };

  const handleApproveDoc = (documentId: string) => {
    handleActionWrapper(async () => {
      await api("/documents/approve", {
        method: "POST",
        body: { document_ids: [documentId] },
      });
    }, "Document verification confirmed.");
  };

  const handleRejectDoc = () => {
    if (!rejectFor) return;
    handleActionWrapper(async () => {
      await api("/documents/reject", {
        method: "POST",
        body: {
          rejections: [{ document_id: rejectFor.id, reason: rejectReason }],
        },
      });
      setRejectFor(null);
      setRejectReason("");
    }, "Document rejected successfully.");
  };

  const uploadDocument = async (documentId: string, file: File) => {
    setIsMutating(true);
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
      toast.success("Document uploaded securely.");
      await fetchDirectory();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Storage write error encountered.");
    } finally {
      setIsMutating(false);
    }
  };

  const uploadComputation = async (file: File) => {
    setIsMutating(true);
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
      toast.success("Computation matrix version synchronized.");
      await fetchDirectory();
      onRefresh();
    } catch (e: any) {
      toast.error(
        e.message || "Failed to catalog calculation mapping framework.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const uploadCompletedDoc = async (docType: string, file: File) => {
    setIsMutating(true);
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
      toast.success(
        `Filing artifact [${docType.replace(/_/g, " ")}] recorded.`,
      );
      await fetchDirectory();
      onRefresh();
    } catch (e: any) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : "Handshake execution block exception on s3 write bucket.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkPaymentReceived = () => {
    handleActionWrapper(async () => {
      await api(`/filings/${filingId}/mark-payment`, { method: "POST" });
    }, "Filing milestone status flagged: PAID.");
  };

  const handleApproveComputation = (computationId: string) => {
    handleActionWrapper(async () => {
      await api("/computations/approve", {
        method: "POST",
        body: { computation_id: computationId },
      });
      await api(`/filings/${filingId}/transition`, {
        method: "POST",
        body: { to_status: "FILING" },
      });
    }, "Computation layout approved. Pipeline tracking advanced to FILING.");
  };

  const handleHaltFiling = () => {
    handleActionWrapper(async () => {
      await api(`/filings/${filingId}/halt`, {
        method: "POST",
        body: { reason: haltReason },
      });
      setHaltOpen(false);
      setHaltReason("");
    }, "Filing tracking flagged HALTED. Client notifications deployed.");
  };

  const downloadAsset = async (endpoint: string) => {
    try {
      const res = await api<{ download_url: string }>(endpoint);
      window.open(res.download_url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Failed to download asset.");
    }
  };

  const currentComputationId = currentComputation?.id;

  return (
    <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white relative">
      {isMutating && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center animate-fade-in">
          <Loader2 className="h-6 w-6 animate-spin text-[#071B3B]" />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-surface-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-secondary">
              Financial Year {filing.financial_year}
            </h2>
            <FilingStatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs font-medium text-content-light">
            {isClient
              ? "Your live personal tax compliance workspace."
              : "Review uploads, execute calculations, and dispatch core ledger overrides."}
          </p>
        </div>

        <div className="flex items-start gap-4">
          <div className="text-right font-sans">
            <div className="text-[9px] font-bold text-content-light uppercase tracking-wider">
              Last Activity
            </div>
            <div className="text-xs font-semibold text-content-main mt-0.5">
              {filing.updated_at || filing.last_updated
                ? new Date(
                    filing.updated_at || filing.last_updated,
                  ).toLocaleString()
                : "—"}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-none border border-surface-border text-content-muted hover:bg-slate-50 cursor-pointer"
              onClick={() => {
                setHistoryOpen(true);
                fetchHistory();
              }}
              title="Audit Log String"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
            {isReviewer && status !== "COMPLETED" && status !== "HALTED" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setHaltOpen(true)}
                title="Halt Pipeline"
                className="h-8 w-8 rounded-none border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <OctagonX className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 p-4 bg-slate-50/50 border border-surface-border/40">
        <FilingProgress
          current={status}
          halted={status === "HALTED"}
          haltReason={filing.halt_reason}
        />
      </div>

      {directoryLoading ? (
        <div className="mt-6 flex items-center justify-center py-8 text-xs font-mono text-content-light tracking-wide italic">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-[#071B3B]" />{" "}
          Extracting repository folder nodes...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <section className="border border-surface-border p-4 bg-white rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border/60 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-secondary">
                  1. Document Checklist Logs
                </h3>
                <p className="text-[11px] font-medium text-content-light mt-0.5">
                  Secure parameters verification index mapping user file
                  submissions.
                </p>
              </div>
              {isReviewer &&
                (status === "INITIATED" || status === "ON_BOARDING") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-[#071B3B] text-[#071B3B] hover:bg-[#071B3B] hover:text-white font-bold text-xs h-8 cursor-pointer"
                    onClick={() => setAssignOpen(true)}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Configure Checklist
                  </Button>
                )}
              {isClient &&
                (status === "ON_BOARDING" || status === "PROCESSING") &&
                documents.length > 0 &&
                documents.every((doc: any) =>
                  ["UPLOADED", "APPROVED"].includes(doc.status),
                ) && (
                  <Button
                    size="sm"
                    style={{ backgroundColor: "#071B3B" }}
                    className="text-white hover:opacity-90 rounded-none font-bold text-xs h-8 border-none cursor-pointer"
                    onClick={handleSubmitDocuments}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Submit for Review
                  </Button>
                )}
              {isReviewer &&
                status === "PROCESSING" &&
                documents.length > 0 &&
                allDocumentsApproved && (
                  <Button
                    size="sm"
                    style={{ backgroundColor: "#071B3B" }}
                    className="text-white hover:opacity-90 rounded-none font-bold text-xs h-8 border-none cursor-pointer"
                    onClick={() => handleTransition("COMPUTATION")}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Generate Calculation
                    Track
                  </Button>
                )}
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-content-light italic border border-dashed border-surface-border bg-slate-50/50">
                No active requirements flagged on checklist stream.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border border-surface-border/80 p-3 bg-white flex flex-wrap items-center justify-between gap-3 rounded-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-content-main uppercase tracking-tight">
                        {doc.document_type_name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-content-light">
                        {doc.original_filename && (
                          <span className="truncate max-w-xs">
                            {doc.original_filename}
                          </span>
                        )}
                        {doc.uploaded_at && (
                          <span>
                            • {new Date(doc.uploaded_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DocStatusChip status={doc.status} />

                      {isClient &&
                        (status === "ON_BOARDING" || status === "PROCESSING") &&
                        doc.status !== "APPROVED" && (
                          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-none border border-surface-border bg-white px-2.5 h-7 text-xs font-bold hover:bg-slate-50 text-content-main transition-colors">
                            <Upload className="h-3 w-3" /> Upload
                            <Input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadDocument(doc.id, f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}

                      {isReviewer && doc.status === "UPLOADED" && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 h-7 rounded-none font-bold text-[11px] px-2"
                            onClick={() => handleApproveDoc(doc.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 rounded-none font-bold text-[11px] px-2"
                            onClick={() => setRejectFor(doc)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-none font-bold text-[11px] px-2 border-surface-border text-content-main hover:bg-slate-50"
                            onClick={() =>
                              downloadAsset(`/documents/${doc.id}/download-url`)
                            }
                          >
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-surface-border p-4 bg-white rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border/60 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-secondary">
                  2. Income Calculation Sheet
                </h3>
                <p className="text-[11px] font-medium text-content-light mt-0.5">
                  Upload, inspect, and sign versioned accounting ledgers.
                </p>
              </div>
              {isReviewer && status === "COMPUTATION" && (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-[#071B3B] px-3 h-8 text-xs font-bold text-[#071B3B] hover:bg-[#071B3B] hover:text-white transition-colors">
                  <Upload className="h-3.5 w-3.5" /> Inject Draft Computation
                  <Input
                    className="hidden"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadComputation(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {computations.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-content-light italic border border-dashed border-surface-border bg-slate-50/50">
                No active calculations logged on execution node workspace.
              </div>
            ) : (
              <div className="space-y-2">
                {computations.map((comp: any) => (
                  <div
                    key={comp.id}
                    className="border border-surface-border/80 p-3 bg-white flex flex-wrap items-center justify-between gap-3 rounded-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-content-main uppercase tracking-tight">
                        Draft Computation Matrix (v{comp.version})
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-content-light truncate max-w-md">
                        {comp.original_filename}{" "}
                        {comp.uploaded_at &&
                          `• ${new Date(comp.uploaded_at).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-none font-bold text-[11px] border-surface-border text-content-main hover:bg-slate-50"
                        onClick={() =>
                          downloadAsset(`/computations/${comp.id}/download-url`)
                        }
                      >
                        <Download className="mr-1 h-3 w-3" /> Inspect Document
                      </Button>
                      {!isClient &&
                        status === "COMPUTATION" &&
                        currentComputationId === comp.id && (
                          <Button
                            size="sm"
                            style={{ backgroundColor: "#071B3B" }}
                            className="text-white hover:opacity-90 h-7 rounded-none font-bold text-[11px]"
                            onClick={() => handleTransition("FILING")}
                          >
                            Push to Filer Signoff
                          </Button>
                        )}
                      {isClient &&
                        status === "COMPUTATION" &&
                        comp.status !== "APPROVED" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 h-7 rounded-none font-bold text-[11px]"
                            onClick={() => handleApproveComputation(comp.id)}
                          >
                            <Check className="mr-1 h-3 w-3" /> Approve
                            Calculations
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-surface-border p-4 bg-white rounded-none">
            <div className="border-b border-surface-border/60 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-secondary">
                3. Final Receipts & Governance Slips
              </h3>
              <p className="text-[11px] font-medium text-content-light mt-0.5">
                Government ingestion tokens, receipts, ledger receipts, and
                challan items.
              </p>
            </div>

            {completedDocs.length === 0 && status !== "FILING" ? (
              <div className="p-6 text-center text-xs font-mono text-content-light italic border border-dashed border-surface-border bg-slate-50/50">
                Awaiting workflow execution transitions to generate tax logs.
              </div>
            ) : (
              <div className="space-y-3">
                {completedDocs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border border-surface-border/80 p-3 bg-white flex flex-wrap items-center justify-between gap-3 rounded-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-content-main uppercase tracking-tight">
                        {doc.doc_type?.replace(/_/g, " ") ||
                          "Filing Artifact Block"}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-content-light">
                        {doc.original_filename} •{" "}
                        {new Date(doc.uploaded_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-none font-bold text-[11px] border-surface-border text-content-main hover:bg-slate-50"
                      onClick={() =>
                        downloadAsset(`/storage/${doc.id}/download-url`)
                      }
                    >
                      <Download className="mr-1 h-3 w-3" /> Pull File
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isReviewer &&
              status === "FILING" &&
              (() => {
                const uploadedTypes = new Set(
                  completedDocs.map((d: any) => d.doc_type),
                );
                const hasAck = uploadedTypes.has("ITR_ACKNOWLEDGEMENT");
                const hasInvoice = uploadedTypes.has("INVOICE");
                const hasItrJson = uploadedTypes.has("ITR_JSON");

                const uploadRowWidget = (
                  label: string,
                  key: string,
                  exists: boolean,
                ) => (
                  <div className="flex items-center justify-between p-2.5 border border-surface-border bg-slate-50/40 rounded-none text-xs">
                    <span className="font-semibold text-content-main">
                      {label}
                    </span>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-1 border border-[#071B3B] px-2.5 h-6 text-[10px] font-black uppercase tracking-tight text-[#071B3B] hover:bg-[#071B3B] hover:text-white transition-colors rounded-none">
                      {exists ? "Replace asset" : "Upload File"}
                      <Input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadCompletedDoc(key, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                );

                if (hasAck && hasInvoice && hasItrJson) {
                  setTimeout(() => handleTransition("PAYMENT"), 100);
                }

                return (
                  <div className="mt-4 p-4 border border-surface-border bg-white rounded-none space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-secondary">
                      Required Governance Upload Bundle Lane
                    </div>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                      {uploadRowWidget(
                        "1. ITR V Acknowledgement",
                        "ITR_ACKNOWLEDGEMENT",
                        hasAck,
                      )}
                      {uploadRowWidget(
                        "2. Platform Service Invoice",
                        "INVOICE",
                        hasInvoice,
                      )}
                      {uploadRowWidget(
                        "3. Gov Ingestion Schema (.JSON)",
                        "ITR_JSON",
                        hasItrJson,
                      )}
                    </div>
                  </div>
                );
              })()}

            {isReviewer && status === "PAYMENT" && (
              <div className="mt-4 pt-4 border-t border-surface-border flex justify-end">
                <Button
                  style={{ backgroundColor: "#071B3B" }}
                  className="text-white hover:opacity-90 rounded-none font-bold text-xs h-9 px-4 border-none cursor-pointer"
                  onClick={handleMarkPaymentReceived}
                >
                  <Check className="mr-1.5 h-4 w-4 stroke-[3]" /> Confirm
                  Challan Settlement
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-2xl rounded-none border border-surface-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-secondary uppercase tracking-wider">
              Assemble Document Collection Checklist
            </DialogTitle>
            <DialogDescription className="text-xs text-content-light">
              Select metadata structural types to allocate tracking slots within
              the secure filer asset tree.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] border border-surface-border rounded-none p-2 bg-slate-50/40">
            <div className="space-y-1.5">
              {documentTypes.map((docType) => {
                const typeId = docType.id || docType.type_id;
                const checked = selectedDocTypes.includes(typeId);
                return (
                  <label
                    key={typeId}
                    className="flex items-center gap-3 border border-surface-border bg-white p-2.5 text-xs font-bold text-content-main uppercase select-none cursor-pointer hover:bg-slate-50"
                  >
                    <Checkbox
                      className="rounded-none border-surface-border data-[state=checked]:bg-[#071B3B]"
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedDocTypes((current) =>
                          normalizeChecked(value)
                            ? Array.from(new Set([...current, typeId]))
                            : current.filter((id) => id !== typeId),
                        );
                      }}
                    />
                    <span className="flex-1 truncate">{docType.name}</span>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              style={{ backgroundColor: "#071B3B" }}
              className="text-white hover:opacity-90 rounded-none font-bold text-xs border-none"
              disabled={selectedDocTypes.length === 0}
              onClick={handleAssignDocuments}
            >
              Dispatch Requirements Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectFor}
        onOpenChange={(open) => !open && setRejectFor(null)}
      >
        <DialogContent className="rounded-none border border-surface-border bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-secondary uppercase tracking-wider">
              Flag File Rejection Deviation
            </DialogTitle>
            <DialogDescription className="text-xs text-content-light">
              Append explicit metadata remarks describing validation failure
              reasons.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Specify reason for file non-compliance rejection..."
            rows={4}
            className="rounded-none border-surface-border focus-visible:ring-[#071B3B] text-xs font-medium"
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => setRejectFor(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-none text-xs font-bold"
              disabled={!rejectReason.trim()}
              onClick={handleRejectDoc}
            >
              Enforce File Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={haltOpen} onOpenChange={setHaltOpen}>
        <DialogContent className="rounded-none border border-surface-border bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-secondary uppercase tracking-wider">
              Halt Pipeline Execution Loop
            </DialogTitle>
            <DialogDescription className="text-xs text-content-light">
              Freeze all subsequent layout state transitions for this financial
              year segment.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={haltReason}
            onChange={(e) => setHaltReason(e.target.value)}
            placeholder="Reason for halting workflow tracking locks..."
            rows={4}
            className="rounded-none border-surface-border focus-visible:ring-[#071B3B] text-xs font-medium"
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => setHaltOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-none text-xs font-bold"
              disabled={!haltReason.trim()}
              onClick={handleHaltFiling}
            >
              Enforce System Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg rounded-none border border-surface-border bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-secondary uppercase tracking-wider">
              Audit String State Transitions Log
            </DialogTitle>
            <DialogDescription className="text-xs text-content-light">
              Immutable execution tracing records for FY {filing.financial_year}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[350px] border border-surface-border rounded-none p-3 bg-slate-50/50">
            {historyData.length === 0 ? (
              <p className="text-xs font-mono text-content-light py-8 text-center italic">
                No historic metadata mutations captured on this route node.
              </p>
            ) : (
              <div className="space-y-2">
                {historyData.map((h: any) => (
                  <div
                    key={h.id}
                    className="border border-surface-border bg-white p-3 rounded-none text-xs font-sans"
                  >
                    <div className="flex items-center gap-2 font-black uppercase text-brand-navy tracking-tight">
                      {h.from_status && (
                        <>
                          <span>{h.from_status.replace(/_/g, " ")}</span>
                          <span className="text-content-light">→</span>
                        </>
                      )}
                      <span className="text-[#0087ff]">
                        {h.to_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] text-content-light">
                      Operator: {h.changed_by_name || "SYSTEM_DAEMON"} •{" "}
                      {h.changed_at && new Date(h.changed_at).toLocaleString()}
                    </div>
                    {h.remarks && (
                      <div className="mt-2 p-2 border border-surface-border bg-slate-50 text-[11px] font-medium text-content-muted rounded-none italic">
                        REMARKS: {h.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// PRIMARY MASTER EXPORT CONTAINER ENTRY
// ==========================================
export function FilingWorkspace({
  role,
  clientId,
  title,
  description,
}: FilingWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isClient = role === "CLIENT";

  const [filingsList, setFilingsList] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [fy, setFy] = useState("");

  const syncWorkspaceData = async () => {
    try {
      const [filingsRes, docTypesRes] = await Promise.all([
        isClient && !clientId
          ? api<any>("/filings/my/tracking")
          : api<any>("/filings", { query: { client_id: clientId } }),
        api<any>("/documents/types", { query: { include_inactive: false } }),
      ]);
      setFilingsList(listFromResponse(filingsRes));
      setDocumentTypes(listFromResponse(docTypesRes));
    } catch (e) {
      console.error("Failed to rehydrate master workspace parameters:", e);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // 🛡️ THE FIX: Rehydration cascades now run safely post-mount
  useEffect(() => {
    syncWorkspaceData();
  }, [clientId, role]);

  const handleInitializeFiling = async () => {
    if (!fy) return;
    setWorkspaceLoading(true);
    try {
      await api("/filings/initiate", {
        method: "POST",
        body: { financial_year: fy },
      });
      toast.success("Filing session initialized.");
      setOpen(false);
      setFy("");
      await syncWorkspaceData();
      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to launch financial ledger record.");
      setWorkspaceLoading(false);
    }
  };

  const usedFYs = useMemo(
    () => new Set(filingsList.map((f: any) => f.financial_year)),
    [filingsList],
  );

  if (workspaceLoading) {
    return (
      <div className="p-12 border border-surface-border bg-white flex flex-col items-center justify-center font-mono text-xs text-content-light tracking-widest uppercase">
        <Loader2 className="h-5 w-5 animate-spin mb-3 text-[#071B3B]" />{" "}
        Rehydrating compliance registry...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-secondary">
            {title ||
              (isClient
                ? "My Personal Filings"
                : "Client Filing Workspace Ledger")}
          </h2>
          <p className="text-xs font-medium text-content-light mt-0.5">
            {description ||
              (isClient
                ? "Track fiscal periods, submit assets checklist components, and view final returns."
                : "Override operational statuses, execute computation files, and close tracking parameters.")}
          </p>
        </div>
        {isClient && (
          <Button
            size="sm"
            style={{ backgroundColor: "#071B3B" }}
            className="text-white hover:opacity-90 rounded-none font-bold text-xs h-9 px-4 border-none cursor-pointer shadow-sm"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4 stroke-[3]" /> Initiate Filing Session
          </Button>
        )}
      </div>

      {filingsList.length === 0 ? (
        <EmptyState
          title={isClient ? "Workspace Empty" : "No Records Configured"}
          description={
            isClient
              ? "You have not initialized any personal filing years on this account node."
              : "This client node has not executed any return filing tracking items."
          }
          icon={<FolderOpen className="h-8 w-8 text-[#071B3B]/30" />}
          action={
            isClient ? (
              <Button
                size="sm"
                style={{ backgroundColor: "#071B3B" }}
                className="text-white hover:opacity-90 rounded-none font-bold text-xs h-9 px-4 cursor-pointer"
                onClick={() => setOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Initialize First Return
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {filingsList.map((filing: any) => (
            <FilingCard
              key={filingIdOf(filing)}
              filing={filing}
              role={role}
              documentTypes={documentTypes}
              onRefresh={syncWorkspaceData}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none border border-surface-border bg-white shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-secondary uppercase tracking-wider">
              Initialize Compliance Period
            </DialogTitle>
            <DialogDescription className="text-xs text-content-light">
              Select a target fiscal verification track. Only one tracking
              segment is allocatable per annual matrix.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={fy} onValueChange={setFy}>
              <SelectTrigger className="rounded-none border-surface-border bg-white text-xs h-10 font-medium focus:ring-[#071B3B]">
                <SelectValue placeholder="Select target financial tracking loop..." />
              </SelectTrigger>
              <SelectContent className="rounded-none border-surface-border shadow-lg">
                {FY_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="rounded-none text-xs py-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 text-content-main font-semibold"
                    disabled={usedFYs.has(option.value)}
                  >
                    {option.label}{" "}
                    {usedFYs.has(option.value) && " (ACTIVE SESSION)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              style={{ backgroundColor: "#071B3B" }}
              className="text-white hover:opacity-90 rounded-none font-bold text-xs px-4 border-none"
              disabled={!fy || isPending}
              onClick={handleInitializeFiling}
            >
              Deploy Pipeline Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
