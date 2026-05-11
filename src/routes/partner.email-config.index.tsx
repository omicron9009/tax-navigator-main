import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, ExternalLink, Check, Send, Upload, Key } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/email-config/")({ component: EmailConfig });

function EmailConfig() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["email-config"],
    queryFn: () => api<any>("/email/config"),
  });

  const [setupOpen, setSetupOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [tokenJson, setTokenJson] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const setup = useMutation({
    mutationFn: () => api("/email/setup", {
      method: "POST",
      body: { sender_email: senderEmail, credentials_json: credentialsJson },
    }),
    onSuccess: () => {
      toast.success("Email credentials saved");
      setSetupOpen(false);
      qc.invalidateQueries({ queryKey: ["email-config"] });
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Failed to save credentials"),
  });

  const getAuthUrl = async () => {
    try {
      const res = await api<{ auth_url: string; message: string }>("/email/auth-url", { method: "POST" });
      if (res.auth_url) {
        window.open(res.auth_url, "_blank");
        toast.success(res.message || "Authorization URL opened. Complete the flow and paste the code below.");
      }
    } catch (e: any) {
      toast.error(e instanceof ApiError ? e.message : "Failed to get auth URL");
    }
  };

  const authorize = useMutation({
    mutationFn: () => api("/email/authorize", { method: "POST", query: { auth_code: authCode } }),
    onSuccess: () => {
      toast.success("Email authorized successfully");
      setAuthCode("");
      qc.invalidateQueries({ queryKey: ["email-config"] });
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Authorization failed"),
  });

  const uploadToken = useMutation({
    mutationFn: () => api("/email/token", { method: "POST", body: { token_json: tokenJson } }),
    onSuccess: () => {
      toast.success("Token uploaded successfully");
      setTokenJson("");
      qc.invalidateQueries({ queryKey: ["email-config"] });
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Failed to upload token"),
  });

  const testConfig = useMutation({
    mutationFn: () => api("/email/test", { method: "POST", body: { test_recipient: testEmail } }),
    onSuccess: () => toast.success("Test email sent successfully"),
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Test email failed"),
  });

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
                Status: {data?.is_configured
                  ? <span className="text-success font-medium">Connected</span>
                  : <span className="text-warning-foreground font-medium">Not connected</span>}
              </p>
              {data?.updated_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last updated: {new Date(data.updated_at).toLocaleString()}
                </p>
              )}
            </div>
            <Button onClick={() => setSetupOpen(true)}>
              <Key className="h-4 w-4 mr-1" /> Setup Credentials
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            OAuth Authorization
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            After setting up credentials, authorize via Google OAuth to enable email sending.
          </p>
          <div className="space-y-3">
            <Button variant="outline" onClick={getAuthUrl} className="w-full">
              <ExternalLink className="h-4 w-4 mr-1" /> Get Authorization URL
            </Button>
            <div className="space-y-1.5">
              <Label>Authorization Code</Label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste the code from Google here"
              />
            </div>
            <Button
              onClick={() => authorize.mutate()}
              disabled={!authCode.trim() || authorize.isPending}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-1" /> Complete Authorization
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Direct Token Upload
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Alternatively, if you already have a token JSON, upload it directly.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Token JSON</Label>
              <Textarea
                value={tokenJson}
                onChange={(e) => setTokenJson(e.target.value)}
                placeholder='{"token": "...", "refresh_token": "...", ...}'
                rows={4}
              />
            </div>
            <Button
              onClick={() => uploadToken.mutate()}
              disabled={!tokenJson.trim() || uploadToken.isPending}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-1" /> Upload Token
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Test Configuration
        </h3>
        <div className="flex gap-3">
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="max-w-sm"
          />
          <Button
            onClick={() => testConfig.mutate()}
            disabled={!testEmail.trim() || testConfig.isPending}
          >
            <Send className="h-4 w-4 mr-1" /> Send Test Email
          </Button>
        </div>
      </Card>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Setup Email Credentials</DialogTitle>
            <DialogDescription>
              Provide the Gmail address and OAuth2 client credentials JSON from Google Cloud Console.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Sender Email</Label>
              <Input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="notifications@yourdomain.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Credentials JSON</Label>
              <Textarea
                value={credentialsJson}
                onChange={(e) => setCredentialsJson(e.target.value)}
                placeholder='Paste OAuth2 client credentials JSON from Google Cloud Console'
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button
              onClick={() => setup.mutate()}
              disabled={!senderEmail.trim() || !credentialsJson.trim() || setup.isPending}
            >
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
