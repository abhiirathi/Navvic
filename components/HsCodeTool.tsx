"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  AlertTriangle,
  Sparkles,
  ImagePlus,
  X,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
} from "lucide-react";

type Question = { id: string; question: string; why?: string; options: string[] };
type CodeLevel = { code: string; title: string };
type SubHeading = CodeLevel & { recommended: boolean };
type Classification = {
  recommended_hs6: string;
  chapter: CodeLevel;
  heading: CodeLevel;
  subheadings: SubHeading[];
  tariff_lines?: CodeLevel[];
  confidence: number;
  rationale: string;
  notes?: string;
};
type ApiResult = {
  status: "needs_clarification" | "classified";
  product: string;
  questions?: Question[];
  classification?: Classification;
  country: string;
};
type ImageState = { preview: string; mimeType: string; data: string } | null;

const COUNTRIES = [
  { code: "IN", label: "🇮🇳 India (ITC-HS)" },
  { code: "US", label: "🇺🇸 USA (HTS)" },
  { code: "EU", label: "🇪🇺 EU (CN)" },
  { code: "UK", label: "🇬🇧 UK Tariff" },
  { code: "GENERIC", label: "🌐 Generic" },
];

const EXAMPLES = [
  "Blue denim jeans",
  "Frozen Atlantic salmon fillets",
  "Roasted Arabica coffee beans",
  "Men's leather running shoes",
];

export default function HsCodeTool() {
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("IN");
  const [image, setImage] = useState<ImageState>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      const meta = dataUrl.slice(0, comma);
      const b64 = dataUrl.slice(comma + 1);
      const mime = meta.match(/data:(.*);base64/)?.[1] || file.type;
      setImage({ preview: dataUrl, mimeType: mime, data: b64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function classify(allAnswers: Record<string, string>) {
    if (description.trim().length < 3 && !image) {
      setError("Describe the product or upload a product image.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hs-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          country,
          answers: allAnswers,
          image: image ? { mimeType: image.mimeType, data: image.data } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setAnswers(allAnswers);
      setPending({});
      setResult(data as ApiResult);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function start() {
    setResult(null);
    setAnswers({});
    setPending({});
    classify({});
  }

  function submitAnswers() {
    const merged = { ...answers, ...pending };
    classify(merged);
  }

  const questions = result?.status === "needs_clarification" ? result.questions ?? [] : [];
  const allAnswered = questions.length > 0 && questions.every((q) => pending[q.question]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* search panel */}
      <div className="glass rounded-3xl p-5 sm:p-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-ocean-400">
            <Sparkles size={16} /> Describe your product — or upload a photo
          </label>

          <div className="mt-3 flex gap-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Blue stonewashed denim jeans for men"
              className="min-w-0 flex-1 resize-none rounded-2xl border border-[var(--border)] bg-surface px-4 py-3 outline-none transition focus:border-ocean-400/60"
            />

            {/* image dropzone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
              className="relative flex w-28 shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-surface text-center transition hover:border-ocean-400/60"
            >
              {image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.preview} alt="upload" className="h-full w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <div className="px-2 py-4 text-muted">
                  <ImagePlus size={22} className="mx-auto" />
                  <span className="mt-1 block text-[11px] leading-tight">Upload / drop image</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
              />
            </div>
          </div>

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
              {loading ? "Analysing…" : "Classify"}
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setDescription(ex);
                setImage(null);
                setResult(null);
                setAnswers({});
                setPending({});
                setTimeout(() => classify({}), 0);
              }}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-muted transition hover:border-ocean-400/50 hover:text-ocean-400"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

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

      {loading && (
        <div className="mt-6 h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-surface/60" />
      )}

      {/* clarifying questions */}
      <AnimatePresence>
        {result?.status === "needs_clarification" && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-3xl border border-ocean-400/30 bg-surface p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 text-ocean-400">
              <HelpCircle size={18} />
              <h3 className="font-display text-lg font-bold">A few details for an accurate code</h3>
            </div>
            <p className="mt-1 text-sm text-muted">
              These answers change the correct HS code for{" "}
              <span className="font-semibold text-[var(--text)]">{result.product}</span>.
            </p>

            <div className="mt-5 space-y-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <div className="font-medium">{q.question}</div>
                  {q.why && <div className="text-xs text-muted">{q.why}</div>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const active = pending[q.question] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setPending((p) => ({ ...p, [q.question]: opt }))}
                          className={`rounded-xl border px-3.5 py-2 text-sm transition ${
                            active
                              ? "border-ocean-400 bg-ocean-400/15 font-semibold text-ocean-400"
                              : "border-[var(--border)] hover:border-ocean-400/50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitAnswers}
              disabled={!allAnswered}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 px-5 py-2.5 font-semibold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
            >
              Get HS code <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* classification tree */}
      <AnimatePresence>
        {result?.status === "classified" && result.classification && !loading && (
          <ClassificationTree
            key={result.classification.recommended_hs6}
            product={result.product}
            country={result.country}
            data={result.classification}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ClassificationTree({
  product,
  country,
  data,
}: {
  product: string;
  country: string;
  data: Classification;
}) {
  const [chapterOpen, setChapterOpen] = useState(true);
  const [headingOpen, setHeadingOpen] = useState(true);
  const [openSub, setOpenSub] = useState<string | null>(data.recommended_hs6);
  const [copied, setCopied] = useState(false);
  const pct = Math.round((data.confidence ?? 0) * 100);

  function copy() {
    navigator.clipboard?.writeText(data.recommended_hs6);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-surface"
    >
      {/* header */}
      <div className="border-b border-[var(--border)] bg-surface/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-muted">{product}</span>{" "}
            <span className="text-muted">›</span>{" "}
            <span className="gradient-text">HS Code {data.recommended_hs6}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ocean-400/15 px-3 py-1 text-xs font-bold text-ocean-400">
              {pct}% confidence
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm transition hover:border-ocean-400/50"
            >
              {copied ? <Check size={15} className="text-ocean-400" /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted">
          Confirm your HS6 code or select the most appropriate entry from the World Customs
          Organization schedule below.
        </p>
      </div>

      {/* tree */}
      <div className="p-4 font-mono text-sm sm:p-6">
        {/* chapter */}
        <TreeRow
          depth={0}
          open={chapterOpen}
          onToggle={() => setChapterOpen((o) => !o)}
          hasChildren
        >
          <span className="font-bold">{data.chapter.code}</span> — CHAPTER {data.chapter.code} —{" "}
          <span className="uppercase">{data.chapter.title}</span>
        </TreeRow>

        {chapterOpen && (
          <div className="ml-3 border-l border-[var(--border)] pl-2">
            {/* heading */}
            <TreeRow
              depth={1}
              open={headingOpen}
              onToggle={() => setHeadingOpen((o) => !o)}
              hasChildren
            >
              <span className="font-bold">{data.heading.code}</span> — {data.heading.title}
            </TreeRow>

            {headingOpen && (
              <div className="ml-3 border-l border-[var(--border)] pl-2">
                {data.subheadings.map((s) => {
                  const isRec = s.recommended;
                  const lines = isRec ? data.tariff_lines ?? [] : [];
                  const expanded = openSub === s.code;
                  return (
                    <div key={s.code}>
                      <TreeRow
                        depth={2}
                        open={expanded}
                        onToggle={() => setOpenSub(expanded ? null : s.code)}
                        hasChildren={lines.length > 0}
                        highlight={isRec}
                      >
                        <span className="font-bold">{s.code}</span> — {s.title}
                        {isRec && (
                          <span className="ml-2 rounded bg-ocean-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase not-italic text-ocean-400">
                            recommended
                          </span>
                        )}
                      </TreeRow>

                      {expanded && lines.length > 0 && (
                        <div className="ml-3 border-l border-[var(--border)] pl-2">
                          {lines.map((t) => (
                            <TreeRow key={t.code} depth={3} leaf>
                              <span className="font-bold">{t.code}</span> — {t.title}
                            </TreeRow>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* rationale + notes */}
      <div className="space-y-3 border-t border-[var(--border)] p-5 text-sm sm:p-6">
        <p className="text-muted">
          <span className="font-semibold text-[var(--text)]">Why: </span>
          {data.rationale}
        </p>
        {data.notes && (
          <p className="text-xs leading-relaxed text-muted">
            <span className="font-semibold text-[var(--text)]">Notes: </span>
            {data.notes}
          </p>
        )}
        <p className="text-xs text-muted">
          Tariff schedule shown for <span className="font-semibold">{country}</span>. Indicative AI
          classification — verify against the official tariff before filing.
        </p>
      </div>
    </motion.div>
  );
}

function TreeRow({
  depth,
  children,
  open,
  onToggle,
  hasChildren,
  leaf,
  highlight,
}: {
  depth: number;
  children: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
  hasChildren?: boolean;
  leaf?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 ${
        highlight ? "bg-ocean-400/10" : ""
      } ${hasChildren ? "cursor-pointer hover:bg-ocean-400/5" : ""}`}
      onClick={hasChildren ? onToggle : undefined}
      style={{ marginLeft: depth === 0 ? 0 : 0 }}
    >
      <span className="mt-0.5 w-4 shrink-0 text-muted">
        {hasChildren ? (
          open ? (
            <ChevronDown size={15} />
          ) : (
            <ChevronRight size={15} />
          )
        ) : leaf ? (
          <span className="inline-block w-3 border-t border-[var(--border)]" />
        ) : null}
      </span>
      <span className={`leading-relaxed ${highlight ? "font-semibold text-ocean-400" : ""}`}>{children}</span>
    </div>
  );
}
