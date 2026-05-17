"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface AssignModalProps {
  clientId: string;
  executablesList: any[];
}

export default function AssignExecutiveModal({
  clientId,
  executablesList,
}: AssignModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExec, setSelectedExec] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  const handleAssignmentSubmit = async () => {
    if (!selectedExec) return;

    setIsMutating(true);
    try {
      await api("/executives/assign", {
        method: "POST",
        body: { executive_id: selectedExec, client_id: clientId },
      });

      toast.success("Executive assignment cataloged successfully.");
      setIsOpen(false);
      setSelectedExec("");

      // Re-hydrate server component views instantly without wiping transient layout states
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      toast.error(
        error.message || "Failed to finalize workflow assignment parameter.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="mt-4 pt-4 border-t border-surface-border">
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-none border-[#071B3B] text-[#071B3B] hover:bg-[#071B3B] hover:text-white font-bold text-xs h-9 tracking-wide transition-colors cursor-pointer"
          >
            <UserCog className="h-4 w-4 mr-1.5" /> Assign Executive
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="rounded-none border border-surface-border bg-card shadow-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-secondary font-black text-base uppercase tracking-tight">
            Assign Executive Manager
          </DialogTitle>
          <DialogDescription className="text-xs text-content-muted">
            Map an active operational task manager to route filing validation
            loops and override tracking checklist actions for this client
            profile.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedExec} onValueChange={setSelectedExec}>
            <SelectTrigger className="rounded-none border-surface-border bg-white text-xs text-content-main h-10 font-medium focus:ring-[#071B3B]">
              <SelectValue placeholder="Select executive node allocation..." />
            </SelectTrigger>
            <SelectContent className="rounded-none border-surface-border shadow-lg">
              {executablesList.map((e: any) => (
                <SelectItem
                  key={e.id}
                  value={e.id}
                  className="rounded-none font-sans text-xs py-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 text-content-main"
                >
                  {e.full_name}{" "}
                  <span className="font-mono text-content-light text-[11px]">
                    ({e.email})
                  </span>
                </SelectItem>
              ))}
              {executablesList.length === 0 && (
                <div className="p-3 text-center text-xs text-content-light italic">
                  No active operational executives logged.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-none text-xs font-semibold"
            onClick={() => setIsOpen(false)}
            disabled={isMutating || isPending}
          >
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: "#071B3B" }}
            className="text-white hover:opacity-90 transition-opacity rounded-none font-bold text-xs px-4 border-none disabled:opacity-40"
            disabled={!selectedExec || isMutating || isPending}
            onClick={handleAssignmentSubmit}
          >
            {isMutating || isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />{" "}
                Finalizing...
              </>
            ) : (
              "Commit Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
