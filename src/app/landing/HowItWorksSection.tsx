import { IdCard, UploadCloud, Calculator, CheckCircle2 } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      id: "01",
      title: "Register & Verify",
      description:
        "Create your account and securely upload your PAN card. Our team will manually verify your KYC details to activate your secure vault.",
      icon: IdCard,
    },
    {
      id: "02",
      title: "Initiate & Upload",
      description:
        "Select your financial year. We'll generate a custom checklist of document placeholders (like Form 16) for you to securely drop files into.",
      icon: UploadCloud,
    },
    {
      id: "03",
      title: "Review Computation",
      description:
        "Your dedicated tax executive processes your documents and uploads your tax computation. Review the numbers and click to approve.",
      icon: Calculator,
    },
    {
      id: "04",
      title: "Filed & Complete",
      description:
        "We officially file your ITR. Your official acknowledgement and invoice are instantly deposited into your secure document vault.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            How the platform works
          </h2>
          <p className="text-lg text-muted-foreground">
            A streamlined, transparent pipeline from registration to official
            filing. No hidden steps, no black boxes.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-[2px] bg-border/50 -z-10" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="relative flex flex-col items-center md:items-start text-center md:text-left"
                >
                  {/* Icon & Step Number Wrapper */}
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-sm mb-6 bg-background">
                    <Icon className="w-6 h-6 text-primary" />

                    {/* Step Number Badge */}
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shadow-md">
                      {step.id}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
