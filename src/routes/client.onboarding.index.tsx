import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/page-states";
import { toast } from "sonner";

export const Route = createFileRoute("/client/onboarding/")({ component: ClientOnboarding });

function ClientOnboarding() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-form"],
    queryFn: () => api<any>("/onboarding/form"),
  });

  const fields: any[] = data?.fields || [];
  const alreadySubmitted = data?.submitted || false;
  const submittedData: Record<string, any> = data?.submitted_data || {};

  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize form with existing data when loaded
  useEffect(() => {
    if (submittedData && Object.keys(submittedData).length > 0) {
      setFormData(submittedData);
    }
  }, [data]);

  const submit = useMutation({
    mutationFn: (form_data: Record<string, any>) =>
      api("/onboarding/form/submit", { method: "POST", body: { form_data } }),
    onSuccess: () => {
      toast.success("Onboarding form submitted successfully");
      qc.invalidateQueries({ queryKey: ["onboarding-form"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit form"),
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const missing = fields.filter(
      (f) => f.is_required && !formData[f.field_key]?.toString().trim()
    );
    if (missing.length > 0) {
      toast.error(`Please fill required fields: ${missing.map((f) => f.field_label).join(", ")}`);
      return;
    }
    submit.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding Form</h1>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding Form</h1>
        <EmptyState
          title="No form available"
          description="The onboarding form has not been set up yet. Please check back later."
          icon={<ClipboardList className="h-8 w-8" />}
        />
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding Form</h1>
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <div>
              <h2 className="text-lg font-semibold">Form Submitted</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your onboarding form has been submitted successfully.
                {data?.submitted_at && ` Submitted on ${new Date(data.submitted_at).toLocaleDateString()}.`}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Responses</h3>
            <div className="space-y-3">
              {fields.map((f: any) => (
                <div key={f.id || f.field_key} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{f.field_label}</span>
                  <span className="text-sm font-medium">{submittedData[f.field_key] || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => qc.setQueryData(["onboarding-form"], { ...data, submitted: false })}>
              Edit Responses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding Form</h1>
        <p className="text-sm text-muted-foreground">Please fill out the information below to proceed with your ITR filing.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((field: any) => (
            <div key={field.id || field.field_key} className="space-y-1.5">
              <Label htmlFor={field.field_key}>
                {field.field_label}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {field.field_type === "TEXT" && (
                <Input
                  id={field.field_key}
                  value={formData[field.field_key] || ""}
                  onChange={(e) => handleChange(field.field_key, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === "NUMBER" && (
                <Input
                  id={field.field_key}
                  type="number"
                  value={formData[field.field_key] || ""}
                  onChange={(e) => handleChange(field.field_key, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === "DATE" && (
                <Input
                  id={field.field_key}
                  type="date"
                  value={formData[field.field_key] || ""}
                  onChange={(e) => handleChange(field.field_key, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === "FILE" && (
                <Input
                  id={field.field_key}
                  type="file"
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
                  <SelectTrigger id={field.field_key}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.field_options || []).map((opt: string) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          <div className="pt-4">
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? "Submitting..." : "Submit Form"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
