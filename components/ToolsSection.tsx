import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tools } from "@/lib/tools";
import ToolCard from "./ToolCard";
import Reveal from "./Reveal";

export default function ToolsSection() {
  return (
    <section id="tools" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-ocean-400/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-display text-sm font-bold uppercase tracking-widest text-ocean-400">
                Trade tools
              </span>
              <h2 className="font-display mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
                Free tools for smarter shipping.
              </h2>
              <p className="mt-4 max-w-xl text-muted">
                Practical utilities for importers and exporters — starting with an AI HS-code
                classifier that turns plain English into tariff codes.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-surface px-5 py-2.5 font-semibold transition-colors hover:border-ocean-400/50"
            >
              View all tools <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t, i) => (
            <Reveal key={t.slug} delay={i * 0.06}>
              <ToolCard tool={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
