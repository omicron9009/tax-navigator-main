// src/app/client/filings/ArchiveWorkspaceManager.tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FilingStatusBadge, DocStatusChip } from "@/components/ui/status-badge";
import { FilingProgress } from "@/components/filing-progress";
import {
  Folder,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ManagerProps {
  initialList: any[];
}

export default function ArchiveWorkspaceManager({ initialList }: ManagerProps) {
  const [activeFilingId, setActiveFilingId] = useState<string | null>(null);
  const [directoryData, setDirectoryData] = useState<any>(null);
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);

  // Trigger dynamic folder tree rehydration matching your screenshot specifications
  const handleFilingToggleSelect = async (filingId: string) => {
    if (activeFilingId === filingId) {
      setActiveFilingId(null);
      setDirectoryData(null);
      return;
    }

    setActiveFilingId(filingId);
    setIsDirectoryLoading(true);
    setDirectoryData(null);

    try {
      const res = await api<any>(`/dashboard/directory/${filingId}`);
      setDirectoryData(res || {});
    } catch (e) {
      toast.error(
        "Failed to rehydrate directory file trees for this fiscal period.",
      );
      setActiveFilingId(null);
    } finally {
      setIsDirectoryLoading(false);
    }
  };

  const handleSecureAssetDownload = async (endpoint: string) => {
    try {
      const res = await api<{ download_url: string }>(endpoint);
      window.open(res.download_url, "_blank");
    } catch (e: any) {
      toast.error(
        e.message || "Failed to parse secure download token authorization.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* GRID LAYER: Renders the premium card canopy layout matching screenshot 1 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {initialList.map((f) => {
          const filingId = f.filing_id || f.id;
          const isSelected = activeFilingId === filingId;
          const progressValue = f.progress_percentage ?? 0;

          const formattedDate = f.initiated_at
            ? new Date(f.initiated_at).toLocaleDateString("en-GB")
            : "—";

          return (
            <Card
              key={filingId}
              onClick={() => handleFilingToggleSelect(filingId)}
              className={`p-6 border rounded-none transition-all duration-150 select-none cursor-pointer bg-white relative flex flex-col items-center justify-between min-h-[220px] ${
                isSelected
                  ? "border-[#071B3B] shadow-sm ring-1 ring-[#071B3B]"
                  : "border-surface-border shadow-soft hover:border-slate-300"
              }`}
            >
              {/* Folder Frame Accent Indicator */}
              <div className="flex items-center justify-center w-12 h-12 bg-slate-50 border border-surface-border text-[#071B3B] rounded-none mb-3">
                <Folder size={20} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-secondary">
                  Financial Year {f.financial_year}
                </h3>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      f.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : f.status === "HALTED"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-wide text-secondary">
                    {f.status}
                  </span>
                </div>
              </div>

              {/* Progress Tracker Slider Block */}
              <div className="w-full pt-4 space-y-1.5 border-t border-surface-border/60 mt-3">
                <Progress
                  value={progressValue}
                  className="h-1 w-full bg-slate-100 rounded-none overflow-hidden"
                />
                <div className="flex items-center justify-between font-mono text-[9px] font-bold text-content-light uppercase">
                  <span>{progressValue}%</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Selection Caret Toggle */}
              <div className="absolute top-3 right-3 text-content-light">
                {isSelected ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* EXPANDED WORKSPACE PANEL LAYER: Matches screenshot 2 flawlessly */}
      {activeFilingId && (
        <Card className="p-6 border border-surface-border shadow-soft bg-white rounded-none animate-in slide-in-from-top-2 duration-200">
          {isDirectoryLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-xs font-mono text-content-light tracking-widest uppercase">
              <Loader2 className="h-5 w-5 animate-spin mb-3 text-[#071B3B]" />{" "}
              Loading compliance repositories...
            </div>
          ) : directoryData ? (
            <div className="space-y-6">
              {/* Top Row Step Machine Tracker Grid */}
              <div className="p-4 bg-slate-50/50 border border-surface-border/40 mb-6">
                <FilingProgress
                  current={directoryData.status}
                  halted={directoryData.status === "HALTED"}
                />
              </div>

              {/* 1. DOCUMENT LOGS SUB-SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-content-light font-mono text-[9px] font-black uppercase tracking-wider">
                  <FileText size={12} className="text-secondary" /> 1. Documents
                  Required (
                  {
                    (directoryData.documents_required || []).filter(
                      (d: any) => d.status === "APPROVED",
                    ).length
                  }
                  /{directoryData.documents_required?.length || 0} approved)
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
                  {(directoryData.documents_required || []).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="border border-surface-border p-4 bg-white rounded-none flex flex-col items-center text-center justify-between min-h-[140px]"
                    >
                      <FileText size={24} className="text-content-light mb-1" />
                      <div>
                        <div className="text-xs font-bold text-secondary uppercase truncate max-w-[140px]">
                          {doc.document_type_name}
                        </div>
                        <div className="text-[9px] font-mono text-content-light truncate max-w-[140px] mt-0.5">
                          {doc.original_filename || "—"}
                        </div>
                      </div>
                      <DocStatusChip status={doc.status} className="mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. COMPUTATION LOGS SUB-SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 text-content-light font-mono text-[9px] font-black uppercase tracking-wider">
                  <FileText size={12} className="text-secondary" /> 2.
                  Computations
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
                  {(directoryData.computations || []).map((comp: any) => (
                    <div
                      key={comp.id}
                      className="border border-surface-border p-4 bg-white rounded-none flex flex-col items-center text-center justify-between min-h-[140px]"
                    >
                      <FileText size={24} className="text-content-light mb-1" />
                      <div>
                        <div className="text-xs font-bold text-secondary uppercase">
                          Computation v{comp.version}
                        </div>
                        <div className="text-[9px] font-mono text-content-light truncate max-w-[140px] mt-0.5">
                          {comp.original_filename}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none font-bold text-[10px] h-7 px-3 mt-1 border-surface-border cursor-pointer text-content-main hover:bg-slate-50"
                        onClick={() =>
                          handleSecureAssetDownload(
                            `/computations/${comp.id}/download-url`,
                          )
                        }
                      >
                        <Download size={10} className="mr-1" /> Pull Document
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. FILED DOCUMENTS COMPLIANCE RECEIPTS LOGS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 text-content-light font-mono text-[9px] font-black uppercase tracking-wider">
                  <FileText size={12} className="text-secondary" /> 3. Filed
                  Documents
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
                  {(directoryData.completed_docs || []).map(
                    (completed: any) => (
                      <div
                        key={completed.id}
                        className="border border-surface-border p-4 bg-white rounded-none flex flex-col items-center text-center justify-between min-h-[140px]"
                      >
                        <FileText
                          size={24}
                          className="text-content-light mb-1"
                        />
                        <div>
                          <div className="text-xs font-bold text-secondary uppercase truncate max-w-[140px]">
                            {completed.doc_type?.replace(/_/g, " ")}
                          </div>
                          <div className="text-[9px] font-mono text-content-light truncate max-w-[140px] mt-0.5">
                            {completed.original_filename}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none font-bold text-[10px] h-7 px-3 mt-1 border-surface-border cursor-pointer text-content-main hover:bg-slate-50"
                          onClick={() =>
                            handleSecureAssetDownload(
                              `/storage/${completed.id}/download-url`,
                            )
                          }
                        >
                          <Download size={10} className="mr-1" /> Pull Receipt
                        </Button>
                      </div>
                    ),
                  )}
                </div>
                {(!directoryData.completed_docs ||
                  directoryData.completed_docs.length === 0) && (
                  <p className="text-xs font-mono text-content-light italic py-2">
                    Awaiting final processing steps to emit government returns
                    documentation artifacts.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
