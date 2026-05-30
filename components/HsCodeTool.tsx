"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";

type Candidate = {
  h2: string;
  h2_desc: string;
  h4: string;
  h4_desc: string;
  h6: string;
  h6_desc: string;
  h8: string;
  h8_desc: string;
  confidence: number;
  rationale: string;
};

type Result = {
  normalized_product: string;
  candidates: Candidate[];
  notes: string;
  country: string;
};

const COUNTRIES = [
  { code: "IN", label: "🇮🇳 India (ITC-HS)" },
  { code: "US", label: "🇺🇸 USA (HTS)" },
  { code: "EU", label: "🇪🇺 EU (CN)" },
  { code: "UK", label: "🇬🇧 UK Tariff" },
  { code: "GENERIC", label: "🌐 Generic" },
];

const EXAMPLES = [
  "Belgian milk chocolate bars with hazelnuts, 100g retail packs",
  "Dried durum wheat spaghetti pasta in 500g cardboard boxes",
  "Roasted whole-bean Arabica coffee, vacuum-sealed tins",
  "Fruit-flavored gummy bear candy in plastic pouches",
];

export default function HsCodeTool() {
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function classify(text: string) {
    const desc = text.trim();
    if (desc.length < 3) {
      setError("Please describe the product in a few words.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/hs-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, country }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* search panel */}
      <div className="glass rounded-3xl p-5 sm:p-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            classify(description);
          }}
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-ocean-400">
            <Sparkles size={16} /> Describe your product in plain English
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Premium Swiss dark chocolate bars, 70% cocoa, 100g retail packs"
            className="mt-3 w-full resize-none rounded-2xl border border-[var(--border)] bg-surface px-4 py-3 outline-none transition focus:border-ocean-400/60"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Tariff:</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-surface px-3 py-2 text-sm outline-none focus:border-ocean-400/60"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-ocean-600/25 transition-transform hover:scale-105 disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
              {loading ? "Classifying…" : "Find HS codes"}
            </button>
          </div>
        </form>

        {/* example chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setDescription(ex);
                classify(ex);
              }}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-muted transition hover:border-ocean-400/50 hover:text-ocean-400"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex items-start gap-3 rounded-2xl border border-coral-500/30 bg-coral-500/10 p-4 text-sm"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-coral-500" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* loading skeleton */}
      {loading && (
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl border border-[var(--border)] bg-surface/60" />
          ))}
        </div>
      )}

      {/* results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <p className="text-sm text-muted">
              Classified as{" "}
              <span className="font-semibold text-[var(--text)]">{result.normalized_product}</span>
            </p>

            <div className="mt-4 space-y-4">
              {result.candidates.map((c, i) => (
                <CandidateCard key={i} c={c} rank={i} />
              ))}
            </div>

            {result.notes && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-surface/60 p-4 text-xs leading-relaxed text-muted">
                <strong className="text-[var(--text)]">Notes: </strong>
                {result.notes}
              </div>
            )}
            <p className="mt-3 text-center text-xs text-muted">
              Indicative AI classification — always verify against the official tariff schedule before filing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CandidateCard({ c, rank }: { c: Candidate; rank: number }) {
  const pct = Math.round((c.confidence ?? 0) * 100);
  const levels = [
    { tag: "H2", code: c.h2, desc: c.h2_desc, label: "Chapter" },
    { tag: "H4", code: c.h4, desc: c.h4_desc, label: "Heading" },
    { tag: "H6", code: c.h6, desc: c.h6_desc, label: "Subheading" },
    { tag: "H8", code: c.h8, desc: c.h8_desc, label: "Tariff line" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08 }}
      className="overflow-hidden rounded-3xl border border-[var(--border)] bg-surface"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div className="flex items-center gap-2">
          {rank === 0 && (
            <span className="rounded-full bg-ocean-400/15 px-2.5 py-0.5 text-xs font-bold text-ocean-400">
              Best match
            </span>
          )}
          <span className="font-display text-lg font-extrabold tracking-tight">{c.h8}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Confidence</span>
          <span className="font-bold text-ocean-400">{pct}%</span>
        </div>
      </div>

      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
        {levels.map((l) => (
          <div key={l.tag} className="flex items-start gap-3 bg-surface p-4">
            <span className="mt-0.5 flex h-7 min-w-[2.2rem] items-center justify-center rounded-md bg-ocean-400/15 px-1.5 text-xs font-bold text-ocean-400">
              {l.tag}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold">{l.code}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted">{l.label}</span>
              </div>
              <div className="text-sm text-muted">{l.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 px-5 py-3 text-sm text-muted">
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-ocean-400" />
        {c.rationale}
      </div>
    </motion.div>
  );
}
