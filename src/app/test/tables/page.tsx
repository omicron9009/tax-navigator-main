import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/tables/client_status_table";
import { TableProperties } from "lucide-react";

// 1. Define our dummy data
const tableData = [
  {
    id: "#ITR-001",
    client: "Acme Corp",
    date: "Oct 24, 2023",
    statuses: ["Initiated"],
  },
  {
    id: "#ITR-002",
    client: "Globex Inc",
    date: "Oct 23, 2023",
    statuses: ["Onboarding"],
  },
  {
    id: "#ITR-003",
    client: "Initech",
    date: "Oct 22, 2023",
    statuses: ["Processing"],
  },
  {
    id: "#ITR-004",
    client: "Soylent Corp",
    date: "Oct 21, 2023",
    statuses: ["Computation", "Filing"],
  },
  {
    id: "#ITR-005",
    client: "Umbrella Corp",
    date: "Oct 20, 2023",
    statuses: ["Payment", "Completed"],
  },
];

// 2. Helper component for the colored status pills
const StatusChip = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    Initiated: "bg-slate-100 text-slate-600",
    Onboarding: "bg-blue-50 text-blue-600",
    Processing: "bg-amber-50 text-amber-700",
    Computation: "bg-purple-50 text-purple-600",
    Filing: "bg-indigo-50 text-indigo-600",
    Payment: "bg-orange-50 text-orange-600",
    Completed: "bg-emerald-50 text-emerald-600",
  };

  const colorClass = variants[status] || "bg-gray-100 text-gray-600";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-2 text-slate-900">
          <TableProperties className="h-5 w-5 text-teal-600" />
          <h1 className="text-xl font-bold tracking-tight">
            Data Tables & Status
          </h1>
        </div>

        {/* Main Card Container */}
        <Card className="shadow-sm border-slate-200/60 rounded-xl overflow-hidden bg-white pt-2 pb-2">
          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="h-[40px] hover:bg-transparent border-slate-100">
                {/* Added pl-6 to push the ID column away from the left edge */}
                <TableHead className="w-[120px] pl-6 text-xs font-semibold text-slate-500">
                  ID
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">
                  CLIENT NAME
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">
                  DATE
                </TableHead>
                {/* Added pr-6 to give the right edge breathing room */}
                <TableHead className="text-xs font-semibold text-slate-500 pr-6">
                  STATUS CHIPS VARIANT
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-[48px] border-slate-100 hover:bg-slate-50/50"
                >
                  {/* Added pl-6 here to match the header alignment */}
                  <TableCell className="pl-6 text-sm text-slate-500 font-medium">
                    {row.id}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-900">
                    {row.client}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-medium">
                    {row.date}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex flex-wrap gap-2">
                      {row.statuses.map((status) => (
                        <StatusChip key={status} status={status} />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
