// src/app/partner/clients/[clientId]/page.tsx
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingWorkspace } from "@/components/filing-workspace";
import AssignExecutiveModal from "./AssignExecutiveModal";

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

export default async function ClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;

  // 🛡️ THE ARCHITECTURAL UPDATE: Added onboarding form query to run in parallel threads
  const [clientData, executiveData, onboardingData] = await Promise.allSettled([
    api<any>(`/clients/${clientId}`),
    api<any>("/executives"),
    api<any>(`/onboarding/form/${clientId}`),
  ]);

  const client = clientData.status === "fulfilled" ? clientData.value : null;
  const executivesPayload =
    executiveData.status === "fulfilled" ? executiveData.value : null;
  const onboarding =
    onboardingData.status === "fulfilled" ? onboardingData.value : null;

  const execList: any[] =
    executivesPayload?.items ||
    executivesPayload?.executives ||
    executivesPayload ||
    [];
  const activeExecutives = execList.filter((e: any) => e.is_active);

  if (!client) {
    return (
      <div className="p-8 text-center bg-white border border-surface-border">
        <p className="text-sm font-medium text-content-muted italic">
          Failed to load profile context for Client ID:{" "}
          {clientId.substring(0, 8)}
        </p>
        <Link
          href="/partner/clients"
          className="text-xs font-bold uppercase text-brand-blue mt-4 inline-block hover:opacity-80"
        >
          Return to directory
        </Link>
      </div>
    );
  }

  // Resolve dynamic onboarding parameters safely by mapping fields array against answers object
  const onboardingFields = onboarding?.fields || [];
  const submittedData = onboarding?.submitted_data || {};
  const isFormSubmitted = onboarding?.submitted || false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans antialiased">
      {/* Back Navigation Bar */}
      <div>
        <Link
          href="/partner/clients"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-content-muted hover:text-brand-blue transition-colors group focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to clients
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Profile Card Summary Block */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-secondary">
                Client Profile
              </h2>
              {client?.account_status && (
                <AccountStatusBadge status={client.account_status} />
              )}
            </div>

            <div className="flex flex-col">
              <InfoRow
                icon={User}
                label="Full Name"
                value={client?.full_name || client?.name}
              />
              <InfoRow
                icon={Mail}
                label="Email Address"
                value={client?.email}
              />
              <InfoRow
                icon={Phone}
                label="Contact Number"
                value={client?.contact_number || client?.phone_number}
              />
              <InfoRow
                icon={User}
                label="Assigned Executive Manager"
                value={client?.assigned_executive_name}
              />
            </div>

            {/* Interactive Shell Modal Trigger for Assignment Operations */}
            <AssignExecutiveModal
              clientId={clientId}
              executablesList={activeExecutives}
            />
          </Card>

          {/* 📊 DYNAMIC ONBOARDING DISCOVERY FIELD ENGINE */}
          <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-secondary flex items-center gap-2">
                <ClipboardCheck size={16} className="text-brand-blue" />{" "}
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
                // Read response string using unique configuration mapping keys
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
                  No structured custom configuration schemas logged.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Core Documents Checklist Workspace Module */}
        <div className="lg:col-span-2">
          <FilingWorkspace
            role="PARTNER"
            clientId={clientId}
            title="Filings"
            description="Assign document checklists, review uploads, upload computations, and close out payment on behalf of the client."
          />
        </div>
      </div>
    </div>
  );
}
