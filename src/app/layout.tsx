import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Updated firm-specific metadata for production SEO tracking
export const metadata: Metadata = {
  title: {
    default: "ITR Platform | Secure CA Tax Filing",
    template: "%s | ITR Platform",
  },
  description:
    "Secure, real-time tracking for CA-managed Income Tax Return filing. Upload documents safely, review your tax computations, and manage your financial records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "scroll-smooth",
        "antialiased",
        inter.className,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}

            <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
