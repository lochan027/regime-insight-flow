import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TimelineSection } from "@/components/TimelineSection";
import { ApiExplorer } from "@/components/ApiExplorer";
import { UseCasesSection } from "@/components/UseCasesSection";
import { ApiDocsSection } from "@/components/ApiDocsSection";
import { Footer } from "@/components/Footer";

const HomePage = () => {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <HeroSection />
      <TimelineSection />
      <ApiExplorer />
      <UseCasesSection />
      <ApiDocsSection />
      <Footer />
    </main>
  );
};

export default HomePage;
