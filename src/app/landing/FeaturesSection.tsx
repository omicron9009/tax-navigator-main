import { ShieldCheck, GitCommit, UserCheck } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 bg-muted/30 border-y border-border/40"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Built for security. Designed for transparency.
          </h2>
          <p className="text-lg text-muted-foreground">
            We replaced the messy email threads and lost WhatsApp PDFs with a
            purpose-built tax infrastructure.
          </p>
        </div>

        {/* 3-Column Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Secure Document Vault */}
          <div className="group relative bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Secure Document Vault
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bank-grade encryption for your Form 16s, capital gains, and bank
              statements. Safely upload and manage files up to 1GB without
              worrying about inbox limits.
            </p>
          </div>

          {/* Feature 2: Real-Time Tracking */}
          <div className="group relative bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GitCommit size={24} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Real-Time Tracking
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Never wonder about the status of your taxes again. Track your
              return step-by-step through our transparent 7-state verification
              and filing pipeline.
            </p>
          </div>

          {/* Feature 3: Dedicated Expert */}
          <div className="group relative bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck size={24} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Dedicated Executive
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You aren&apos;t dealing with an automated bot. Every client is
              assigned a dedicated tax expert who prepares your computation for
              your final approval.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
