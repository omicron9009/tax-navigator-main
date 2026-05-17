import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  ShieldCheck,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* LEFT: The Hook (Text & CTA) */}
          <div className="flex flex-col justify-center space-y-8 max-w-[600px] mx-auto lg:mx-0 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck size={14} />
                <span>Secure CA-Managed Filing</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">
                Filing your tax return doesn't have to be a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  black box.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Upload your documents securely, collaborate with your dedicated
                tax executive, and track your ITR status in real-time. Expert CA
                filing meets a modern digital experience.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-14 px-8 rounded-lg bg-primary text-primary-foreground font-semibold text-lg transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
              >
                Start Your Filing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* RIGHT: The Visual (Abstracted Dashboard Mockup) */}
          <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none lg:ml-auto select-none pointer-events-none">
            {/* Decorative background blobs */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

            {/* The Mockup Card */}
            <div className="relative bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
              {/* Fake Browser/App Header */}
              <div className="bg-muted/50 border-b border-border/50 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="ml-4 text-xs font-mono text-muted-foreground">
                  app.itrplatform.com/client/fy26-27
                </div>
              </div>

              {/* Mockup Content */}
              <div className="p-6 md:p-8 space-y-8">
                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Financial Year 2026-27
                    </h3>
                    {/* <p className="text-sm text-muted-foreground">
                      Assigned to: CA Joshya
                    </p> */}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                    Processing
                  </div>
                </div>

                {/* The Timeline UI */}
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {/* Step 1: Completed */}
                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 border border-green-200">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Onboarding Complete
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PAN verified, profile created.
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Active */}
                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-primary">
                          Document Processing
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reviewing your Form 16 and Capital Gains.
                        </p>

                        {/* Abstracted Doc Uploads */}
                        <div className="mt-3 flex gap-2">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border text-[10px] font-medium text-muted-foreground">
                            <FileText size={12} /> Form16.pdf
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border text-[10px] font-medium text-muted-foreground">
                            <FileText size={12} /> BankStmt.pdf
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Pending */}
                    <div className="relative flex items-start gap-4 opacity-50">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground border-2 border-dashed border-border">
                        <Circle className="w-4 h-4" />
                      </div>
                      <div className="pt-1.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          Computation Approval
                        </h4>
                      </div>
                    </div>

                    {/* Step 4: Pending */}
                    <div className="relative flex items-start gap-4 opacity-50">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground border-2 border-dashed border-border">
                        <Circle className="w-4 h-4" />
                      </div>
                      <div className="pt-1.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          ITR Filed
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
