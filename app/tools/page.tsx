import { tools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Trade Tools — Navvic",
  description: "Free tools for importers and exporters, including an AI HS-code classifier.",
};

export default function ToolsPage() {
  return (
    <main className="overflow-x-hidden">
      <section className="relative pt-36 pb-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-foam-100 to-transparent dark:from-abyss-900" />
        <div className="absolute inset-0 -z-10 grid-texture opacity-50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="font-display text-sm font-bold uppercase tracking-widest text-ocean-400">
            Trade tools
          </span>
          <h1 className="font-display mt-2 text-5xl font-extrabold tracking-tight sm:text-6xl">
            Navvic <span className="gradient-text">Tools</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            A growing toolkit to take the friction out of cross-border trade.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
