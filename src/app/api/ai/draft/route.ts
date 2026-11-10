import { NextResponse } from "next/server";
import { ASSEMBLIES } from "@/data/lca/assemblies";
import { MATERIALS } from "@/data/lca/materials";
import { DRAFT_MAX_CHARS, buildDraftRequest, parseContext, parseDraft, type DraftContext } from "@/lib/lca/ai-draft";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Groq's featured production model with strict JSON-schema output.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * Drafts an inventory from a description, optionally for an open project
 * (its name and component names, so only new components are drafted). The
 * Groq key stays on the server; the browser only gets the validated draft.
 */
export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI drafting is off: GROQ_API_KEY is not set. Get a free key at console.groq.com and add it to .env." },
      { status: 503 },
    );
  }

  let description = "";
  let context: DraftContext | undefined;
  try {
    const body = (await request.json()) as { description?: unknown; project?: unknown };
    description = typeof body.description === "string" ? body.description.trim() : "";
    context = parseContext(body.project);
  } catch {
    // fall through to the empty-description error
  }
  if (!description) {
    return NextResponse.json({ error: "Describe what you want to assess." }, { status: 400 });
  }
  if (description.length > DRAFT_MAX_CHARS) {
    return NextResponse.json({ error: `Keep the description under ${DRAFT_MAX_CHARS} characters.` }, { status: 400 });
  }

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildDraftRequest(description, ASSEMBLIES, MATERIALS, model, context)),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Groq. Check the connection and try again." }, { status: 502 });
  }

  if (res.status === 429) {
    return NextResponse.json(
      { error: "Groq's free-tier limit was reached. Wait a minute and try again." },
      { status: 429 },
    );
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`Groq ${res.status}: ${detail.slice(0, 500)}`);
    return NextResponse.json({ error: `Groq returned an error (${res.status}).` }, { status: 502 });
  }

  try {
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";
    const draft = parseDraft(content, ASSEMBLIES);
    return NextResponse.json({ ...draft, model });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unreadable AI reply." }, { status: 502 });
  }
}
