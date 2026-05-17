// src/app/client/onboarding/page.tsx
import { api } from "@/lib/api";
import OnboardingFormShell from "./OnboardingFormShell";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/page-states";

export const metadata = {
  title: "Client Onboarding Profile",
};

export default async function ClientOnboardingPage() {
  let initialData = {
    fields: [],
    submitted: false,
    submitted_data: {},
    submitted_at: null,
  };

  try {
    // Server-side fetch cleanly extracts the template configuration schema
    initialData = await api("/onboarding/form");
  } catch (error) {
    console.error(
      "Failed to parse onboarding structure from API context:",
      error,
    );
  }

  const fields = initialData?.fields || [];

  if (fields.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-secondary">
          Onboarding Form
        </h1>
        <EmptyState
          title="No onboarding framework available"
          description="The master profile collection fields have not been configured by the Partner yet."
          icon={<ClipboardList className="h-8 w-8" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-secondary">
          Onboarding Form
        </h1>
        <p className="text-sm text-muted-foreground">
          Please fill out the details required below to complete your secure
          practice filing profile.
        </p>
      </div>

      {/* Hand off structure schema down to the interactive handler layer */}
      <OnboardingFormShell
        fields={fields}
        initialSubmissionStatus={initialData.submitted}
        initialResponses={initialData.submitted_data || {}}
        submittedAt={initialData.submitted_at}
      />
    </div>
  );
}
