// src/app/executive/page.tsx
import { api } from "@/lib/api";
import Link from "next/navigation";
import { Users, FolderOpen, FileCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  FilingStatusBadge,
  type FilingStatus,
} from "@/components/ui/status-badge";

const FILING_STATES: FilingStatus[] = [
  "INITIATED",
  "ON_BOARDING",
  "PROCESSING",
  "COMPUTATION",
  "FILING",
  "PAYMENT",
  "COMPLETED",
  "HALTED",
];

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-white select-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-light">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-brand-navy leading-none">
            {value}
          </p>
        </div>
        {/* Swapped translucent round badge for our flat-block primary token */}
        <div className="flex h-9 w-9 items-center justify-center rounded-none bg-slate-50 text-[#071B3B] border border-surface-border/60 shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

export default async function ExecutiveDashboardPage() {
  let dashboardData: any = null;
  const counters: Record<string, number> = {};

  try {
    dashboardData = await api<any>("/dashboard/summary");
    (dashboardData?.counters || []).forEach((c: any) => {
      counters[c.status] = c.count;
    });
  } catch (error) {
    console.error("Failed to load executive workspace summaries:", error);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Heading Tracker */}
      <div>
        <h1 className="text-page-heading font-black tracking-tight text-secondary uppercase">
          My Workspace
        </h1>
        <p className="mt-1 text-sm text-content-muted font-medium">
          Real-time compliance track matrix for assigned client filers.
        </p>
      </div>

      {/* Main Aggregation Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Assigned Clients"
          value={dashboardData?.total_clients ?? 0}
          icon={Users}
        />
        <StatCard
          label="Active Filing Pipelines"
          value={dashboardData?.total_active_filings ?? 0}
          icon={FolderOpen}
        />
        <StatCard
          label="Pending Operational Action"
          value={(counters.ON_BOARDING ?? 0) + (counters.PROCESSING ?? 0)}
          icon={Clock}
        />
        <StatCard
          label="Completed Closeouts"
          value={counters.COMPLETED ?? 0}
          icon={FileCheck}
        />
      </div>

      {/* Workflow State Filtering Lane */}
      <section className="pt-2">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-content-light">
          Filings by Pipeline Status
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {FILING_STATES.map((state) => (
            <a
              key={state}
              href={`/executive/clients?status=${state}`}
              className="flex flex-col justify-between border border-surface-border bg-white p-4 transition-all duration-150 rounded-none cursor-pointer group select-none hover:border-[#071B3B] hover:shadow-sm"
            >
              <div className="text-xl font-black text-brand-navy group-hover:text-[#0087ff] transition-colors font-mono">
                {counters[state] ?? 0}
              </div>
              <FilingStatusBadge status={state} className="mt-3 w-full" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
