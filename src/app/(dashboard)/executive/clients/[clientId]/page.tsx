// src/app/executive/clients/[clientId]/page.tsx
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  MapPin,
  IdCard,
  ClipboardCheck,
  Calendar,
  Briefcase,
  Fingerprint,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingWorkspace } from "@/components/filing-workspace";

interface PageProps {
  params: Promise<{
    clientId: string;
  }>;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-border/40 last:border-none">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-content-light" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-content-light">
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-content-main mt-0.5">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export default async function ExecutiveClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;

  // 1. Parallel server-side fetch optimization bypasses network cascade traps
  const [clientData, onboardingData] = await Promise.allSettled([
    api<any>(`/clients/${clientId}`),
    api<any>(`/onboarding/form/${clientId}`),
  ]);

  const client = clientData.status === "fulfilled" ? clientData.value : null;
  const onboarding =
    onboardingData.status === "fulfilled" ? onboardingData.value : null;

  if (!client) {
    return (
      <div className="p-8 text-center bg-white border border-surface-border shadow-soft rounded-none">
        <p className="text-sm font-medium text-content-muted italic">
          Profile context missing or unhydrated for target Token:{" "}
          {clientId.substring(0, 8)}
        </p>
        <Link
          href="/executive/clients"
          className="text-xs font-bold uppercase text-brand-blue mt-4 inline-block hover:opacity-80 tracking-wide font-mono"
        >
          [ Return to Roster Directory ]
        </Link>
      </div>
    );
  }

  // 🧠 THE SANITIZER ENGINE: Strips bare placeholder text injected by database seeds
  const sanitizeValue = (val: any) => {
    if (!val) return "";
    const clean = String(val).trim();
    return clean.toLowerCase() === "string" || clean.toLowerCase() === "null"
      ? ""
      : clean;
  };

  const validContact =
    sanitizeValue(client?.contact_number) ||
    sanitizeValue(client?.phone_number);

  const rawDOB = sanitizeValue(client?.date_of_birth);
  const formattedDOB = rawDOB
    ? new Date(rawDOB).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  // Unpacking onboarding field matrices safely
  const onboardingFields = onboarding?.fields || [];
  const submittedData = onboarding?.submitted_data || {};
  const isFormSubmitted = onboarding?.submitted || false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans antialiased">
      {/* Back Navigation Bar */}
      <div>
        <Link
          href="/executive/clients"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-content-muted hover:text-[#0087ff] transition-colors group focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Assigned Directory
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Hand Stack: Unified Metadata & Questionnaires Layout */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card 1: Static Core Matrix Dossier */}
          <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-secondary">
                Client Matrix Dossier
              </h2>
              {client?.account_status && (
                <AccountStatusBadge status={client.account_status} />
              )}
            </div>

            <div className="flex flex-col">
              <InfoRow
                icon={User}
                label="Filer Full Name"
                value={sanitizeValue(client?.full_name || client?.name)}
              />
              <InfoRow
                icon={Mail}
                label="Secure Email Node"
                value={sanitizeValue(client?.email)}
              />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={formattedDOB}
              />
              <InfoRow
                icon={IdCard}
                label="PAN Registry Number"
                value={sanitizeValue(client?.pan_number)}
              />
              <InfoRow
                icon={Fingerprint}
                label="Aadhaar National ID"
                value="[Aadhaar Redacted]"
              />
              <InfoRow
                icon={Briefcase}
                label="Declared Income Type"
                value={sanitizeValue(client?.income_type)}
              />
              <InfoRow
                icon={Phone}
                label="Contact Direct Line"
                value={validContact}
              />
              <InfoRow
                icon={MapPin}
                label="Registered Fiscal Address"
                value={sanitizeValue(client?.address)}
              />
            </div>
          </Card>

          {/* Card 2: Dynamic Onboarding Structural Data Feed */}
          <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-secondary flex items-center gap-2">
                <ClipboardCheck size={16} className="text-[#0087ff]" />{" "}
                Onboarding Parameters
              </h2>
              <span
                className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 border ${
                  isFormSubmitted
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                {isFormSubmitted ? "SUBMITTED" : "PENDING"}
              </span>
            </div>

            <div className="flex flex-col">
              {onboardingFields.map((field: any) => {
                const rawResponse = submittedData[field.field_key];
                let resolvedDisplayValue = "—";

                if (rawResponse !== undefined && rawResponse !== null) {
                  resolvedDisplayValue =
                    typeof rawResponse === "object"
                      ? JSON.stringify(rawResponse)
                      : String(rawResponse);
                }

                return (
                  <div
                    key={field.id}
                    className="flex flex-col py-2.5 border-b border-surface-border/40 last:border-none min-w-0"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-content-light">
                      {field.field_label}
                    </span>
                    <span className="text-xs font-semibold text-content-main mt-1 break-words leading-relaxed">
                      {resolvedDisplayValue}
                    </span>
                  </div>
                );
              })}

              {onboardingFields.length === 0 && (
                <p className="text-xs font-mono text-content-light italic py-4 text-center">
                  No structured custom configuration responses logged.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Hand: High-Leverage Operational Pipeline Track */}
        <div className="lg:col-span-2">
          <FilingWorkspace
            role="EXECUTIVE"
            clientId={clientId}
            title="Assigned Filing Execution Pipeline"
            description="Send the document checklist parameters, audit user storage uploads, append custom computation models, and advance the platform milestone states."
          />
        </div>
      </div>
    </div>
  );
}
