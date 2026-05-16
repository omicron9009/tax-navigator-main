// src/app/landing/page.tsx
import GlobalHeader from "./GlobalHeader";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import CallToActionSection from "./CallToActionSection";
import ContactSection from "./ContactSection"; // <-- Import the new section
import GlobalFooter from "./GlobalFooter";

export const metadata = {
  title: "ITR Platform | Secure CA Tax Filing",
  description:
    "Upload your documents securely, collaborate with your dedicated tax executive, and track your ITR status in real-time.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Pinned Glass Navigation Anchor */}
      <GlobalHeader />

      <main className="flex-1">
        {/* Step 1: The Hook */}
        <HeroSection />

        {/* Step 2: The Core Product Capabilities */}
        <FeaturesSection />

        {/* Step 3: The Process Pipeline Timeline */}
        <HowItWorksSection />

        {/* Step 4: The Final Conversions Block */}
        <CallToActionSection />

        {/* TODO: Create the Contacts BACKEND AND DATABASE ENDPOINT MEHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH */}
        {/* Step 5: Symmetrical Contact Anchor Map */}
        {/* <ContactSection /> */}
      </main>

      {/* Corporate Multi-Branch Footer Canvas */}
      <GlobalFooter />
    </div>
  );
}
