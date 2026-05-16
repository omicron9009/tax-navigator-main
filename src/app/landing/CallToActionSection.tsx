import Link from "next/link";
import { ArrowRight, ShieldAlert, History } from "lucide-react";

export default function CallToActionSection() {
  return (
    <section className="py-24 bg-background relative px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        {/* The Pattern Interrupt Card */}
        <div className="relative overflow-hidden bg-primary text-primary-foreground rounded-3xl p-8 md:p-16 lg:p-20 text-center shadow-2xl">
          {/* Decorative Background Rings */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            {/* Upsell Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <History size={14} />
              <span>Supports Multi-Year Filings</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to simplify your tax season?
            </h2>

            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
              Whether you are filing for the current financial year or catching
              up on previous ones, our unified dashboard keeps your entire tax
              history organized.
            </p>

            <div className="pt-4 flex flex-col items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-14 px-8 rounded-lg bg-background text-foreground font-semibold text-lg transition-all hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-background focus:ring-offset-2 focus:ring-offset-primary focus:outline-none"
              >
                Create Client Account
                <ArrowRight className="ml-2 h-5 w-5 text-primary" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
