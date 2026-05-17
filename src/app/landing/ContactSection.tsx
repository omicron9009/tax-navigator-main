"use client";
import { Mail, Phone, Clock, MessageSquare } from "lucide-react";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="py-24 bg-muted/20 border-t border-border/40 scroll-mt-16"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* LEFT: Core Communication Details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Get In Touch
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Connect with our tax experts
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Have questions regarding your documentation loop, multi-year
                filing configurations, or account verification? Reach out to our
                corporate desks directly.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/40 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="mailto:info@pgjco.com"
                  className="hover:text-primary transition-colors font-medium text-foreground"
                >
                  info@pgjco.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="tel:07122524309"
                  className="hover:text-primary transition-colors font-mono"
                >
                  0712-2524309
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    Operational Hours
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monday – Saturday: 10:00 AM – 6:30 PM IST
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Rapid Query Card */}
          <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Submit a quick inquiry
            </h3>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-md outline-none focus:border-primary transition-all"
                    placeholder="Aditya Joshi"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-md outline-none focus:border-primary transition-all"
                    placeholder="aditya@domain.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Message or Query
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-md outline-none focus:border-primary transition-all resize-none"
                  placeholder="Inquiring about filing parameters for FY 2026-27..."
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
