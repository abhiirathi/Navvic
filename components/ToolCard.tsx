"use client";

import Link from "next/link";
import { ScanSearch, Calculator, Container, FileText, ArrowUpRight } from "lucide-react";
import type { Tool } from "@/lib/tools";

const icons = { ScanSearch, Calculator, Container, FileText };

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = icons[tool.icon];
  const live = tool.status === "live";

  const inner = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-surface p-6 transition-all ${
        live ? "hover:-translate-y-1.5 hover:border-ocean-400/40 hover:shadow-2xl hover:shadow-ocean-600/10" : "opacity-80"
      }`}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ocean-400/10 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-400/20 to-ocean-600/10 text-ocean-400">
          <Icon size={22} />
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-ocean-400/15 px-2.5 py-1 text-xs font-bold text-ocean-400">
            <span className="h-1.5 w-1.5 rounded-full bg-ocean-400" /> Live
          </span>
        ) : (
          <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-muted">
            Coming soon
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="text-xs font-bold uppercase tracking-wider text-ocean-400">{tool.tagline}</div>
        <h3 className="font-display mt-1 text-xl font-bold">{tool.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{tool.description}</p>
      </div>

      {live && (
        <div className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-ocean-400">
          Open tool
          <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      )}
    </div>
  );

  return live ? (
    <Link href={tool.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full cursor-default">{inner}</div>
  );
}
