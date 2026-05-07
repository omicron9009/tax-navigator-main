import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/email-config/")({ component: EmailConfig });

function EmailConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ["email-config"],
    queryFn: () => api<any>("/email/config"),
  });

  const connect = async () => {
    try {
      const res = await api<{ auth_url: string }>("/email/config/auth-url");
      window.open(res.auth_url, "_blank");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Configuration</h1>
        <p className="text-sm text-muted-foreground">Connect a Gmail account for outbound notifications</p>
      </div>
      <Card className="p-6">
        {isLoading ? <Skeleton className="h-20" /> : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{data?.sender_email || "Not configured"}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Status: {data?.is_configured ? <span className="text-success font-medium">Connected</span> : <span className="text-warning-foreground font-medium">Not connected</span>}
              </p>
            </div>
            <Button onClick={connect}><ExternalLink className="h-4 w-4 mr-1" /> Configure Gmail</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
