import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const COUNTRIES: Record<string, string> = {
  IN: "India (ITC-HS 8-digit tariff)",
  US: "United States (HTS 8/10-digit tariff)",
  EU: "European Union (Combined Nomenclature, CN 8-digit)",
  UK: "United Kingdom (UK Global Tariff, 8-digit)",
  GENERIC: "a generic 8-digit national tariff line",
};

const responseSchema = {
  type: "object",
  properties: {
    normalized_product: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          h2: { type: "string", description: "2-digit HS chapter" },
          h2_desc: { type: "string" },
          h4: { type: "string", description: "4-digit HS heading" },
          h4_desc: { type: "string" },
          h6: { type: "string", description: "6-digit HS subheading (WCO)" },
          h6_desc: { type: "string" },
          h8: { type: "string", description: "8-digit national tariff line" },
          h8_desc: { type: "string" },
          confidence: { type: "number", description: "0 to 1" },
          rationale: { type: "string" },
        },
        required: ["h2", "h2_desc", "h4", "h4_desc", "h6", "h6_desc", "h8", "h8_desc", "confidence", "rationale"],
      },
    },
    notes: { type: "string" },
  },
  required: ["normalized_product", "candidates", "notes"],
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Add it to .env.local (local) or the Vercel project env." },
      { status: 500 }
    );
  }

  let body: { description?: string; country?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  const countryKey = (body.country ?? "GENERIC").toUpperCase();
  const country = COUNTRIES[countryKey] ?? COUNTRIES.GENERIC;

  if (description.length < 3) {
    return NextResponse.json({ error: "Please describe the product (at least a few words)." }, { status: 400 });
  }

  const prompt = `You are an expert customs broker and classifier specialising in the World Customs Organization Harmonized System (HS).

Given a plain-English product description, return the most likely HS classifications, ordered most-likely first. Return up to 3 candidate classifications.

For EACH candidate provide the full hierarchy:
- h2: the 2-digit HS Chapter code, with h2_desc = official chapter title
- h4: the 4-digit HS Heading code (formatted "NN.NN"), with h4_desc
- h6: the 6-digit international HS Subheading (formatted "NNNN.NN"), with h6_desc
- h8: an 8-digit national tariff line for ${country} (formatted "NNNN.NN.NN"), with h8_desc
- confidence: a number from 0 to 1
- rationale: ONE concise sentence on why this classification fits

Also return:
- normalized_product: a cleaned, customs-style description of the product
- notes: any classifying assumptions and a brief reminder that codes are indicative and must be verified against the official tariff schedule.

The 8-digit codes are national and may vary; give the most plausible line and state assumptions in notes if unsure.

Product description: """${description}"""`;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Gemini API error (${res.status}).`, detail: detail.slice(0, 400) },
        { status: 502 }
      );
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
