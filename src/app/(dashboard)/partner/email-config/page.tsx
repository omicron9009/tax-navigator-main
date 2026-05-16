"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, CheckCircle2, AlertCircle, Key } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// The inner component that actually uses the search params
function EmailConfigurationManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authCode = searchParams.get("code");

  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<{
    is_configured: boolean;
    sender_email?: string;
  } | null>(null);

  const [credentials, setCredentials] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // STATE 3: The Callback Interceptor
    // If Google redirected us back here with a code, process it immediately.
    if (authCode) {
      handleAuthorization(authCode);
    } else {
      // STATE 1 & 4: Normal Page Load (Check if configured)
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCode]);

  const fetchConfig = async () => {
    try {
      const res = await api<any>("/email/config");
      setConfig(res);
    } catch (err) {
      console.error("Failed to fetch email config:", err);
      // Fallback state if the API fails
      setConfig({ is_configured: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorization = async (code: string) => {
    setIsLoading(true);
    try {
      // Swap the temporary code for permanent tokens
      await api("/email/authorize", {
        method: "POST",
        body: { auth_code: code },
      });
      toast.success("Google OAuth successful! Email is configured.");

      // Clean up the URL so the code doesn't sit in the address bar
      router.replace("/partner/email-config");

      // Refresh the config state
      fetchConfig();
    } catch (err: any) {
      toast.error(err.message || "Authorization failed.");
      router.replace("/partner/email-config");
      setIsLoading(false);
    }
  };

  const handleSetupAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // 1. Upload the JSON to the server
      await api("/email/setup", {
        method: "POST",
        body: { sender_email: senderEmail, credentials_json: credentials },
      });

      // 2. STATE 2: Fetch the Auth URL and redirect the browser
      const res = await api<{ auth_url: string }>("/email/auth-url", {
        method: "POST",
      });

      toast.loading("Redirecting to Google...");
      window.location.href = res.auth_url; // Hard redirect to Google
    } catch (err: any) {
      toast.error(err.message || "Failed to setup credentials");
      setIsProcessing(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api("/email/test", {
        method: "POST",
        body: { test_recipient: testEmail },
      });
      toast.success("Test email sent! Check your inbox.");
      setTestEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- UI RENDER STATES ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-content-muted">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>
          {authCode
            ? "Securing Google OAuth tokens..."
            : "Checking configuration status..."}
        </p>
      </div>
    );
  }

  // STATE 4: Configured & Testing
  if (config?.is_configured) {
    return (
      <Card className="max-w-2xl p-6 space-y-6 shadow-soft rounded-none border-surface-border">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-full">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary">
              Email Configured
            </h3>
            <p className="text-sm text-content-muted mt-1">
              Your platform is actively authorized to send emails via{" "}
              <strong>{config.sender_email || "Google Workspace"}</strong>.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border">
          <h4 className="text-sm font-semibold mb-3">Send a Test Email</h4>
          <form onSubmit={handleTestEmail} className="flex gap-3">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
              className="max-w-xs"
            />
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Test
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  // STATE 1 & 2: Not Configured (Setup Form)
  return (
    <Card className="max-w-2xl p-6 shadow-soft rounded-none border-surface-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" /> Setup Gmail Integration
        </h3>
        <p className="text-sm text-content-muted mt-1">
          To send automated emails to your clients, you need to provide your
          Google Cloud OAuth 2.0 Client credentials.
        </p>
      </div>

      <form onSubmit={handleSetupAndRedirect} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sender_email">Sender Email Address</Label>
          <Input
            id="sender_email"
            type="email"
            placeholder="noreply@yourdomain.com"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="credentials">OAuth 2.0 Credentials (JSON)</Label>
          <Textarea
            id="credentials"
            placeholder="Paste the entire contents of your credentials.json file here..."
            className="font-mono text-xs h-48 bg-slate-50"
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            required
          />
          <p className="text-[11px] text-content-muted flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Ensure the JSON contains the web
            or installed key.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            "Save Credentials & Authorize with Google"
          )}
        </Button>
      </form>
    </Card>
  );
}

// Next.js requires components utilizing useSearchParams to be wrapped in a Suspense boundary
export default function EmailConfigurationPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-secondary">
          Email Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your outgoing email infrastructure.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        }
      >
        <EmailConfigurationManager />
      </Suspense>
    </div>
  );
}
