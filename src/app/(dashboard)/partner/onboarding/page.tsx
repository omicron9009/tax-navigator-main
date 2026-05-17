// src/app/partner/onboarding/page.tsx
import { api } from "@/lib/api";
import BuilderShell from "./BuilderShell";

export const metadata = {
  title: "Onboarding Questionnaire Builder",
};

export default async function OnboardingBuilderPage() {
  let fields: any[] = [];

  try {
    // Direct server-side call fetches the canonical dynamic field models
    const data = await api<any>("/onboarding/fields");
    fields = data?.items || data?.fields || data || [];
  } catch (error) {
    console.error(
      "Critical architectural failure pulling dynamic schema specs:",
      error,
    );
  }

  // Sort elements securely on the server by display_order before delivering payload down tree
  const sortedFields = [...fields].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-secondary">
          Onboarding Questionnaire Builder
        </h1>
        <p className="text-sm text-muted-foreground">
          Construct and order the mandatory informational fields clients must
          process on baseline profile creation.
        </p>
      </div>

      {/* Initialize the interactive drag/drop framework canvas component */}
      <BuilderShell initialFields={sortedFields} />
    </div>
  );
}
