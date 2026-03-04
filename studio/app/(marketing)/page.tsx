import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { PipelineWalkthrough } from "@/components/marketing/PipelineWalkthrough";
import { TrustSection } from "@/components/marketing/TrustSection";
import { AudienceCards } from "@/components/marketing/AudienceCards";
import { StatsSection } from "@/components/marketing/StatsSection";
import { GetStarted } from "@/components/marketing/GetStarted";
import { Footer } from "@/components/marketing/Footer";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <Hero />
        <ScrollReveal>
          <PipelineWalkthrough />
        </ScrollReveal>
        <ScrollReveal>
          <TrustSection />
        </ScrollReveal>
        <ScrollReveal>
          <AudienceCards />
        </ScrollReveal>
        <StatsSection />
        <ScrollReveal>
          <GetStarted />
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}
