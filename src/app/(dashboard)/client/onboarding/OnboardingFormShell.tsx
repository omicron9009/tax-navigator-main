"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
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

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Baseline validation loop over active schema fields
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

      // Trigger Next.js data revalidation down the layout hierarchy
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit profile metrics.");
    } finally {
      setIsMutating(false);
    }
  };

  // VIEW MODE: Render Read-Only responses if form is already confirmed
  if (isSubmitted) {
    return (
      <Card className="p-6 border border-surface-border shadow-soft rounded-none bg-card animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-full">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary">
              Profile Registration Confirmed
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              Your structural configuration responses are securely logged.
              {submittedAt &&
                ` Record finalized on ${new Date(submittedAt).toLocaleDateString()}.`}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-surface-border pt-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Active Profile Metadata
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div
                key={f.id || f.field_key}
                className="flex flex-col gap-1 p-3 bg-muted/30 border border-surface-border/40"
              >
                <span className="text-[11px] font-medium uppercase tracking-wider text-content-muted">
                  {f.field_label}
                </span>
                <span className="text-sm font-semibold text-secondary truncate">
                  {formData[f.field_key] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-surface-border pt-4">
          <Button
            variant="outline"
            className="rounded-none border-surface-border"
            onClick={() => setIsSubmitted(false)}
          >
            Modify Profile Values
          </Button>
        </div>
      </Card>
    );
  }

  // EDIT MODE: Dynamic Fields Mutation Form
  return (
    <Card className="p-6 border border-surface-border shadow-soft rounded-none bg-card">
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.id || field.field_key} className="space-y-1.5">
            <Label
              htmlFor={field.field_key}
              className="text-xs font-semibold text-secondary uppercase tracking-wide"
            >
              {field.field_label}
              {field.is_required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>

            {field.field_type === "TEXT" && (
              <Input
                id={field.field_key}
                value={formData[field.field_key] || ""}
                className="rounded-none border-surface-border"
                onChange={(e) => handleChange(field.field_key, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "NUMBER" && (
              <Input
                id={field.field_key}
                type="number"
                value={formData[field.field_key] || ""}
                className="rounded-none border-surface-border"
                onChange={(e) => handleChange(field.field_key, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "DATE" && (
              <Input
                id={field.field_key}
                type="date"
                value={formData[field.field_key] || ""}
                className="rounded-none border-surface-border"
                onChange={(e) => handleChange(field.field_key, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "FILE" && (
              <Input
                id={field.field_key}
                type="file"
                className="rounded-none border-surface-border file:font-sans file:text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleChange(field.field_key, file.name);
                }}
                required={field.is_required && !formData[field.field_key]}
              />
            )}

            {field.field_type === "DROPDOWN" && (
              <Select
                value={formData[field.field_key] || ""}
                onValueChange={(v) => handleChange(field.field_key, v)}
              >
                <SelectTrigger
                  id={field.field_key}
                  className="rounded-none border-surface-border"
                >
                  <SelectValue placeholder="Select custom classification" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {(field.field_options || []).map((opt) => (
                    <SelectItem key={opt} value={opt} className="rounded-none">
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
            disabled={isMutating || isPending}
            className="rounded-none px-6 font-medium"
          >
            {isMutating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
              className="rounded-none"
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
