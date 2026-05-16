"use client";

import { useState } from "react";
import Link from "next/link";
import { Landmark, Menu, X } from "lucide-react";

export default function GlobalHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // Overhauled header frame with heavy transparency and saturation multipliers
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/40 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/30">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* LEFT: Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-md"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground shrink-0 transition-transform group-hover:scale-105">
            <Landmark size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-bold text-foreground leading-none tracking-wide">
              ITR Platform
            </span>
            <span className="text-[9px] font-medium text-muted-foreground tracking-wider uppercase leading-tight mt-0.5">
              Tax Consultants
            </span>
          </div>
        </Link>

        {/* CENTER: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How it Works
          </Link>
          {/* TODO: Contact Us after we deploy ts */}
          {/* <Link
            href="#contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact Us
          </Link> */}
        </nav>

        {/* RIGHT: Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Client Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md shadow-sm"
          >
            Register Now
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        // Mobile panel inherits the heavy frosted glass backdrop logic
        <div className="md:hidden border-t border-white/10 bg-background/80 backdrop-blur-lg px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4">
            <Link
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              How it Works
            </Link>
            <Link
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Contact Us
            </Link>
          </nav>

          <div className="flex flex-col gap-3 pt-6 mt-4 border-t border-white/10">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors px-4 py-2 rounded-md"
            >
              Client Login
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md shadow-sm"
            >
              Register Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
