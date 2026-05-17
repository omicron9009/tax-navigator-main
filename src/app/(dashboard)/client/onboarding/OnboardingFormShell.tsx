// src/app/client/onboarding/OnboardingFormShell.tsx
"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, UploadCloud, FileCheck } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface FieldSchema {
  id?: string;
  field_key: string;
  field_label: string;
  field_type: "TEXT" | "NUMBER" | "DATE" | "FILE" | "DROPDOWN";
  is_required: boolean;
  field_options?: string[];
}

interface ShellProps {
  fields: FieldSchema[];
  initialSubmissionStatus: boolean;
  initialResponses: Record<string, any>;
  submittedAt: string | null;
}

function uploadFileToPreSignedUrl(uploadUrl: string, file: File) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new Error(`Storage bucket rejected write stream (${xhr.status})`),
          );
    xhr.onerror = () =>
      reject(new Error("Network layer anomaly during chunk transit."));
    xhr.send(file);
  });
}

export default function OnboardingFormShell({
  fields,
  initialSubmissionStatus,
  initialResponses,
  submittedAt,
}: ShellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(initialSubmissionStatus);
  const [formData, setFormData] =
    useState<Record<string, any>>(initialResponses);
  const [isMutating, setIsMutating] = useState(false);
  const [fileUploadingStatus, setFileUploadingStatus] = useState<
    Record<string, boolean>
  >({});

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 🛡️ THE AUDIT FIX: Two-stage verification loop matching the API design specs
  const handleFileLifecycleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldKey: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadingStatus((prev) => ({ ...prev, [fieldKey]: true }));
    const loadingToastId = toast.loading(
      `Uploading binary payload for ${file.name}...`,
    );

    try {
      // Stage 1: Fetch the pre-signed S3 write URL parameter nodes
      const presignResponse = await api<{
        upload_url: string;
        object_key: string;
      }>("/storage/onboarding-upload-url", {
        method: "POST",
        query: {
          field_key: fieldKey,
          filename: file.name,
          content_type: file.type || "application/octet-stream",
        },
      });

      // Stage 2: Push the raw binary payload array straight to S3 storage buckets
      await uploadFileToPreSignedUrl(presignResponse.upload_url, file);

      // Stage 3: Fire the required onboarding upload confirmation handshake
      const confirmationResponse = await api<any>(
        "/storage/confirm-onboarding-upload",
        {
          method: "POST",
          query: {
            field_key: fieldKey,
            object_key: presignResponse.object_key,
            filename: file.name,
            content_type: file.type || "application/octet-stream",
            file_size: file.size,
          },
        },
      );

      // 🔍 DEBUG TRACE: Let's inspect the raw payload directly in your browser console window
      console.log(
        "📁 Raw FastAPI Onboarding Confirmation Payload:",
        confirmationResponse,
      );

      // 🧠 THE OPENAPI HANDLER: Resolves custom parameters based on your backend dictionary model mapping
      let resolvedFileToken = "";

      if (confirmationResponse) {
        if (typeof confirmationResponse === "string") {
          // If your FastAPI code prints the raw string value straight back down the wire
          resolvedFileToken = confirmationResponse;
        } else if (typeof confirmationResponse === "object") {
          // Fallback array matrix tracking down standard structural dictionary variants
          resolvedFileToken =
            confirmationResponse[fieldKey] || // Matches dynamic field assignments (e.g. confirmationResponse["pan_card_pdf"])
            confirmationResponse?.stored_file_id ||
            confirmationResponse?.file_id ||
            confirmationResponse?.id;
        }
      }

      // If the database transaction ID remains missing, use the presign key path as an absolute fallback safety layer
      const finalExtractionToken =
        resolvedFileToken || presignResponse.object_key;

      handleChange(fieldKey, finalExtractionToken);
      toast.success(`File ${file.name} validated and committed securely.`, {
        id: loadingToastId,
      });
    } catch (err: any) {
      toast.error(
        err.message || "Failed to commit document validation handshakes.",
        { id: loadingToastId },
      );
      e.target.value = "";
    } finally {
      setFileUploadingStatus((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields = fields.filter(
      (f) => f.is_required && !formData[f.field_key]?.toString().trim(),
    );

    if (missingFields.length > 0) {
      toast.error(
        `Required details absent: ${missingFields.map((f) => f.field_label).join(", ")}`,
      );
      return;
    }

    setIsMutating(true);
    try {
      await api("/onboarding/form/submit", {
        method: "POST",
        body: { form_data: formData },
      });

      toast.success("Onboarding questionnaire processed successfully.");
      setIsSubmitted(true);

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      toast.error(
        err.message || "Failed to execute database commit transaction.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 border border-surface-border shadow-soft rounded-none bg-white animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-green-600 rounded-none">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-secondary">
              Profile Registration Confirmed
            </h2>
            <p className="mt-1 text-xs font-semibold text-content-muted">
              Your structural configuration responses are securely logged.
              {submittedAt &&
                ` Record finalized on ${new Date(submittedAt).toLocaleDateString()}.`}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-surface-border pt-6">
          <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-content-light">
            Active Profile Metadata Dossier
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div
                key={f.id || f.field_key}
                className="flex flex-col gap-1 p-3 bg-slate-50/50 border border-surface-border/60 rounded-none min-w-0"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-light">
                  {f.field_label}
                </span>
                <span className="text-xs font-mono font-bold text-secondary truncate">
                  {formData[f.field_key] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-surface-border pt-4">
          <Button
            variant="outline"
            className="rounded-none border-surface-border font-bold text-xs uppercase tracking-wider text-content-main hover:bg-slate-50 cursor-pointer h-9 px-4"
            onClick={() => setIsSubmitted(false)}
          >
            Modify Profile Values
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-surface-border shadow-soft rounded-none bg-white">
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.id || field.field_key} className="space-y-1.5">
            <Label
              htmlFor={field.field_key}
              className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-1"
            >
              {field.field_label}
              {field.is_required && (
                <span className="text-red-500 font-bold">*</span>
              )}
            </Label>

            {field.field_type === "TEXT" && (
              <input
                id={field.field_key}
                type="text"
                value={formData[field.field_key] || ""}
                className="w-full px-3 h-10 bg-white border border-surface-border rounded-none text-sm outline-none focus:border-[#071B3B] transition-all font-medium text-content-main"
                onChange={(e) => handleChange(field.field_key, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "NUMBER" && (
              <input
                id={field.field_key}
                type="number"
                value={formData[field.field_key] || ""}
                className="w-full px-3 h-10 bg-white border border-surface-border rounded-none text-sm outline-none focus:border-[#071B3B] transition-all font-medium text-content-main"
                onChange={(e) => handleChange(field.field_key, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "DATE" && (
              <input
                id={field.field_key}
                type="date"
                value={formData[field.field_key] || ""}
                className="w-full px-3 h-10 bg-white border border-surface-border rounded-none text-sm outline-none focus:border-[#071B3B] transition-all font-mono font-medium text-content-main"
                onChange={(e) => handleChange(field.field_key, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "FILE" && (
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    id={field.field_key}
                    type="file"
                    disabled={fileUploadingStatus[field.field_key]}
                    className="w-full pr-12 h-10 bg-white border border-surface-border rounded-none text-xs outline-none focus:border-[#071B3B] transition-all font-medium text-content-main file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:border-r file:border-surface-border file:text-xs file:font-bold file:bg-slate-50 file:text-content-main file:cursor-pointer hover:file:bg-slate-100"
                    onChange={(e) =>
                      handleFileLifecycleUpload(e, field.field_key)
                    }
                    required={field.is_required && !formData[field.field_key]}
                  />
                  <div className="absolute right-3 pointer-events-none">
                    {fileUploadingStatus[field.field_key] ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#0087ff]" />
                    ) : formData[field.field_key] ? (
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-content-light" />
                    )}
                  </div>
                </div>
                {formData[field.field_key] && (
                  <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50/60 p-2 border border-emerald-100 break-all leading-tight">
                    Verified File Token:{" "}
                    <span className="font-bold">
                      {formData[field.field_key]}
                    </span>
                  </div>
                )}
              </div>
            )}

            {field.field_type === "DROPDOWN" && (
              <Select
                value={formData[field.field_key] || ""}
                onValueChange={(v) => handleChange(field.field_key, v)}
              >
                <SelectTrigger
                  id={field.field_key}
                  className="rounded-none border-surface-border bg-white text-xs h-10 font-medium focus:ring-[#071B3B]"
                >
                  <SelectValue placeholder="Select classification node parameter..." />
                </SelectTrigger>
                <SelectContent className="rounded-none border-surface-border shadow-lg">
                  {(field.field_options || []).map((opt) => (
                    <SelectItem
                      key={opt}
                      value={opt}
                      className="rounded-none text-xs py-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 font-semibold text-content-main"
                    >
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-surface-border flex items-center gap-3">
          <Button
            type="submit"
            disabled={
              isMutating ||
              isPending ||
              Object.values(fileUploadingStatus).some(Boolean)
            }
            style={{ backgroundColor: "#071B3B" }}
            className="text-white hover:opacity-90 rounded-none font-bold text-xs h-10 px-6 border-none cursor-pointer shadow-sm"
          >
            {isMutating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              "Submit Profiles"
            )}
          </Button>

          {initialSubmissionStatus && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-none border border-surface-border text-xs font-bold uppercase tracking-wider text-content-muted hover:bg-slate-50 cursor-pointer h-10 px-4"
              disabled={isMutating || isPending}
              onClick={() => {
                setFormData(initialResponses);
                setIsSubmitted(true);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
