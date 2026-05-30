import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const COUNTRIES: Record<string, string> = {
  IN: "India (ITC-HS 8-digit tariff)",
  US: "United States (HTS 8/10-digit tariff)",
  EU: "European Union (Combined Nomenclature, CN 8-digit)",
  UK: "United Kingdom (UK Global Tariff, 8-digit)",
  GENERIC: "a generic 8-digit national tariff line",
};

const codeLevel = {
  type: "object",
  properties: { code: { type: "string" }, title: { type: "string" } },
  required: ["code", "title"],
};

const responseSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["needs_clarification", "classified"] },
    product: { type: "string", description: "Short label for the product, e.g. 'Jeans (men's, woven cotton)'" },
    questions: {
      type: "array",
      description: "Only when status=needs_clarification. Up to 3 questions whose answers change the HS6 code.",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          why: { type: "string", description: "One short phrase on why this matters for classification" },
          options: { type: "array", items: { type: "string" } },
        },
        required: ["id", "question", "options"],
      },
    },
    classification: {
      type: "object",
      description: "Only when status=classified.",
      properties: {
        recommended_hs6: { type: "string", description: "6-digit code formatted NNNN.NN" },
        chapter: codeLevel,
        heading: codeLevel,
        subheadings: {
          type: "array",
          description: "ALL real WCO 6-digit subheadings under the chosen heading, in order.",
          items: {
            type: "object",
            properties: {
              code: { type: "string" },
              title: { type: "string" },
              recommended: { type: "boolean" },
            },
            required: ["code", "title", "recommended"],
          },
        },
        tariff_lines: {
          type: "array",
          description: "National 8-digit tariff lines under the recommended subheading for the requested country.",
          items: codeLevel,
        },
        confidence: { type: "number", description: "0 to 1" },
        rationale: { type: "string" },
        notes: { type: "string" },
      },
      required: ["recommended_hs6", "chapter", "heading", "subheadings", "confidence", "rationale"],
    },
  },
  required: ["status", "product"],
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Add it to .env.local (local) or the Vercel project env." },
      { status: 500 }
    );
  }

  let body: {
    description?: string;
    country?: string;
    answers?: Record<string, string>;
    image?: { mimeType: string; data: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  const countryKey = (body.country ?? "GENERIC").toUpperCase();
  const country = COUNTRIES[countryKey] ?? COUNTRIES.GENERIC;
  const answers = body.answers ?? {};
  const image = body.image;

  if (description.length < 3 && !image) {
    return NextResponse.json(
      { error: "Describe the product (a few words) or upload a product image." },
      { status: 400 }
    );
  }

  const answersText = Object.keys(answers).length
    ? `\n\nThe user has already answered these clarifying questions:\n${Object.entries(answers)
        .map(([q, a]) => `- ${q}: ${a}`)
        .join("\n")}`
    : "";

  const prompt = `You are a senior customs broker and an expert in the WCO Harmonized System. Classify products with maximum accuracy, applying the General Rules of Interpretation (GRI), Section and Chapter Notes, and legal texts.

ACCURACY FIRST. Many products are ambiguous and the correct HS6 depends on details the user has not stated. Common decisive factors:
- Knitted/crocheted (Chapter 61) vs woven (Chapter 62) — e.g. denim jeans are usually WOVEN cotton trousers => heading 62.03/62.04, NOT 61.03.
- Gender/age (men's/boys' vs women's/girls'), which splits headings.
- Constituent material (cotton vs synthetic vs wool), processing (fresh/frozen/dried), form, function, and intended use.

DECISION:
- If the description is missing any detail that would change the 6-digit code, set status="needs_clarification" and return up to 3 short, mutually-exclusive multiple-choice questions (each with an "id", the "question", a one-phrase "why", and 2-5 "options"). Put the most likely option first. Do NOT ask about things that don't affect the HS6.
- If you have enough information (including the user's answers below), set status="classified".

When status="classified", return:
- recommended_hs6: the single best 6-digit subheading.
- chapter: {code (2-digit), title} and heading: {code (4-digit, formatted NN.NN), title} — use the official WCO chapter/heading titles.
- subheadings: EVERY real 6-digit subheading that exists under the chosen 4-digit heading (official WCO codes formatted NNNN.NN and their official titles), in numeric order, with recommended=true on exactly one.
- tariff_lines: the plausible 8-digit national tariff lines under the recommended subheading for ${country} (formatted NNNN.NN.NN). If unsure, give the most likely lines.
- confidence (0-1), rationale (one or two sentences), notes (assumptions + reminder to verify against the official tariff).

Always set "product" to a concise label (e.g. "Jeans (men's, woven cotton)").

${image ? "An image of the product is attached. Identify the commodity from the image, combining it with any text the user provided. If the image is unclear or a decisive detail (material, knitted vs woven, gender, etc.) is not visible, ask a clarifying question rather than guessing." : ""}
Product description: """${description || "(none provided — rely on the attached image)"}"""${answersText}`;

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (image?.data && image?.mimeType) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseSchema },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      const msg =
        res.status === 429
          ? "Gemini free-tier rate limit hit. Please wait a moment and try again."
          : `Gemini API error (${res.status}).`;
      return NextResponse.json({ error: msg, detail: detail.slice(0, 300) }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: "Gemini returned no content." }, { status: 502 });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json({ country: countryKey, ...parsed });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to classify.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
