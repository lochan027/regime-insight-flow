import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { InsightLayerSection } from "@/components/InsightLayerSection";
import { TimelineSection } from "@/components/TimelineSection";
import { ApiExplorer } from "@/components/ApiExplorer";
import { UseCasesSection } from "@/components/UseCasesSection";
import { RegimeAllocatorSection } from "@/components/YourPortfolioSection";
import { ApiDocsSection } from "@/components/ApiDocsSection";
import { CopilotChat } from "@/components/CopilotChat";
import { Footer } from "@/components/Footer";

const HomePage = () => {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <HeroSection />
      <InsightLayerSection />
      <TimelineSection />
      <ApiExplorer />
      <UseCasesSection />
      <RegimeAllocatorSection />
      <ApiDocsSection />
      <Footer />
      <CopilotChat />
    </main>
  );
};

export default HomePage;
