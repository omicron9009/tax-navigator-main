import Link from "next/link";
import {
  Landmark,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Link2,
} from "lucide-react";

export default function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Overhauled Main Grid: Explicit 4-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* COLUMN 1: Brand Profile & Global Contact */}
          <div className="space-y-4">
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none rounded-md w-fit"
            >
              {/* Using white/10 border to match the dark background canvas */}
              <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground shrink-0 transition-transform group-hover:scale-105">
                <Landmark size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none tracking-wide">
                  ITR Platform
                </span>
                <span className="text-[9px] font-medium text-white/50 tracking-wider uppercase leading-tight mt-0.5">
                  Tax Consultants
                </span>
              </div>
            </Link>

            <div className="space-y-2.5 text-xs text-white/70 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
                <a
                  href="mailto:info@pgjco.com"
                  className="hover:text-primary transition-colors font-medium text-white"
                >
                  info@pgjco.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
                <a
                  href="tel:07122524309"
                  className="hover:text-primary transition-colors font-mono"
                >
                  0712-2524309
                </a>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Structured Regional Offices */}
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Our Offices
            </h5>

            <div className="space-y-4 text-xs leading-relaxed text-white/70">
              {/* Branch 1: Nagpur */}
              <div className="space-y-0.5">
                <span className="font-bold text-primary tracking-wide block">
                  NAGPUR
                </span>
                <p>
                  Dhanwate Chambers, Pt. Malviya Road,
                  <br />
                  Sitabuldi, Nagpur, MH 440012
                </p>
              </div>

              {/* Branch 2: Mumbai */}
              <div className="space-y-0.5">
                <span className="font-bold text-primary tracking-wide block">
                  MUMBAI
                </span>
                <p>
                  C7, Ultra Co-op. Hsg. Society,
                  <br />
                  Lt. Dilip Gupte Marg, Mahim West,
                  <br />
                  Mumbai, MH 400016
                </p>
              </div>

              {/* Branch 3: Pune */}
              <div className="space-y-0.5">
                <span className="font-bold text-primary tracking-wide block">
                  PUNE
                </span>
                <p>
                  Flat No.6, Janhavi Apartments,
                  <br />
                  Bhonde Colony, Erandwane,
                  <br />
                  Pune, MH 411004
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Quick Links (Properly aligned horizontally) */}
          <div className="md:pl-6">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-primary rotate-45 shrink-0" />
              <span>Quick Links</span>
            </h4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="/login"
                className="text-xs text-white/70 hover:text-primary transition-colors w-fit"
              >
                Client Login
              </Link>
              <Link
                href="/register"
                className="text-xs text-white/70 hover:text-primary transition-colors w-fit"
              >
                Register New Account
              </Link>
              <Link
                href="/login"
                className="text-xs text-white/70 hover:text-primary transition-colors w-fit"
              >
                Access Dashboard
              </Link>
            </nav>
          </div>

          {/* COLUMN 4: Legal & Security */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Legal & Security
            </h4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="/privacy"
                className="text-xs text-white/70 hover:text-primary transition-colors w-fit"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-white/70 hover:text-primary transition-colors w-fit"
              >
                Terms of Service
              </Link>
              <Link
                href="/security"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors w-fit"
              >
                Data Security Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* BOTTOM SECTION: Copyright info */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50 text-center md:text-left">
            © {currentYear} ITR Platform Tax Consultants. All rights reserved.
          </p>
          <p className="text-xs text-white/50 text-center md:text-right">
            Designed for secure, CA-managed tax filing.
          </p>
        </div>
      </div>
    </footer>
  );
}
