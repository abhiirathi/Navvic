import Hero from "@/components/Hero";
import BrandMarquee from "@/components/BrandMarquee";
import ProductShowcase from "@/components/ProductShowcase";
import Services from "@/components/Services";
import ToolsSection from "@/components/ToolsSection";
import Network from "@/components/Network";
import QuoteCTA from "@/components/QuoteCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <BrandMarquee />
      <ProductShowcase />
      <Services />
      <ToolsSection />
      <Network />
      <QuoteCTA />
      <Footer />
    </main>
  );
}
