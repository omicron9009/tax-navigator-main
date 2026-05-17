// src/app/executive/clients/[clientId]/page.tsx
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  User,
  IdCard,
  Phone,
  MapPin,
  Fingerprint,
  Calendar,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/ui/status-badge";
import { FilingWorkspace } from "@/components/filing-workspace";

interface PageProps {
  params: Promise<{
    clientId: string;
  }>;
}

function ProfileRow({
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

  let client: any = null;

  try {
    client = await api<any>(`/clients/${clientId}`);
  } catch (error) {
    console.error(
      `❌ Failed to resolve executive client context for Node: ${clientId}`,
      error,
    );
  }

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

  // 🧠 THE SANITIZER ENGINE: Filters out dummy default backend strings
  const sanitizeValue = (val: any) => {
    if (!val) return "";
    const clean = String(val).trim();
    return clean.toLowerCase() === "string" || clean.toLowerCase() === "null"
      ? ""
      : clean;
  };

  // Resolve phone numbers cleanly by filtering placeholders out of both potential keys
  const validContact =
    sanitizeValue(client?.contact_number) ||
    sanitizeValue(client?.phone_number);

  // Format the ISO birth string into a readable system date template safely
  const rawDOB = sanitizeValue(client?.date_of_birth);
  const formattedDOB = rawDOB
    ? new Date(rawDOB).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans antialiased">
      {/* Return Navigation Anchor Link */}
      <div>
        <Link
          href="/executive/clients"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-content-muted hover:text-[#0087ff] transition-colors group focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Assigned Directory
        </Link>
      </div>

      {/* Main Structural Twin-Column Framework Layout */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Hand: Expanded Static Profile Metadata Block Card */}
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
            <ProfileRow
              icon={User}
              label="Filer Full Name"
              value={sanitizeValue(client?.full_name || client?.name)}
            />
            <ProfileRow
              icon={Mail}
              label="Secure Email Node"
              value={sanitizeValue(client?.email)}
            />
            <ProfileRow
              icon={Calendar}
              label="Date of Birth"
              value={formattedDOB}
            />
            <ProfileRow
              icon={IdCard}
              label="PAN Registry Number"
              value={sanitizeValue(client?.pan_number)}
            />
            <ProfileRow
              icon={Fingerprint}
              label="Aadhaar National ID"
              value={sanitizeValue(client?.aadhaar_number)}
            />
            <ProfileRow
              icon={Briefcase}
              label="Declared Income Type"
              value={sanitizeValue(client?.income_type)}
            />
            <ProfileRow
              icon={Phone}
              label="Contact Direct Line"
              value={validContact}
            />
            <ProfileRow
              icon={MapPin}
              label="Registered Fiscal Address"
              value={sanitizeValue(client?.address)}
            />
          </div>
        </Card>

        {/* Right Hand: Dynamic Document Submission & Workflow Component Module */}
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
