"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddToProject, ReviewTable, isUsable, type ReviewLine } from "@/components/import/review-table";
import { expandAssembly, getAssembly } from "@/data/lca/assemblies";
import { MATERIALS } from "@/data/lca/materials";
import { DRAFT_MAX_CHARS, type Draft } from "@/lib/lca/ai-draft";
import { matchBoq } from "@/lib/lca/boq";
import { fmt } from "@/lib/lca/format";
import { unitLabel } from "@/lib/lca/units";

/** Construction items studied often enough to make good starting points. */
const EXAMPLES = [
  "230 mm clay brick wall, 10 m²",
  "200 mm AAC block wall, 10 m²",
  "1 m³ of M25 concrete",
  "150 mm RCC roof slab, 20 m²",
];

type Result = Draft & { model: string };

/**
 * Assemblies expand into materials with their cited coefficients (the AI
 * only gave the geometry); "other" materials are matched by name, like a
 * BoQ row, and weak matches are left for the reviewer.
 */
function toReviewLines(draft: Draft): ReviewLine[] {
  const fromAssemblies = draft.assemblies.flatMap((d) => {
    const a = getAssembly(d.assemblyId);
    if (!a) return [];
    return expandAssembly(a, d.quantity).map((l) => ({
      text: `${a.name}: ${l.label}`,
      quantity: l.quantity,
      unit: { unit: l.unit, factor: 1 },
      rawUnit: unitLabel(l.unit),
      materialId: l.materialId,
      basis: `${fmt(d.quantity)} ${unitLabel(a.unit)} (${d.basis}) × ${l.working}`,
    }));
  });
  const cols = { description: "d", quantity: "q", unit: "u" };
  const others = matchBoq(
    draft.others.map((o) => ({ d: o.component, q: o.quantity ?? "", u: o.unit ?? "" })),
    cols,
    MATERIALS,
  ).map((m, i) => ({
    text: m.text,
    quantity: m.quantity,
    unit: m.unit,
    rawUnit: m.rawUnit,
    materialId: m.match && m.confidence >= 0.35 ? m.match.id : "",
    basis: draft.others[i].basis,
  }));
  return [...fromAssemblies, ...others];
}

export function AiDraft({ initial = "" }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Result | null>(null);
  const [lines, setLines] = useState<ReviewLine[]>([]);
  const ran = useRef(false);

  async function run(description: string) {
    const d = description.trim();
    if (!d) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: d }),
      });
      const body = (await res.json()) as Result & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Drafting failed.");
      setDraft(body);
      setLines(toReviewLines(body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drafting failed.");
    } finally {
      setBusy(false);
    }
  }

  // Arriving from the home page with a description: draft it straight away.
  useEffect(() => {
    if (initial && !ran.current) {
      ran.current = true;
      void run(initial);
    }
  }, [initial]);

  if (draft?.inScope) {
    const unmatched = lines.filter((l) => !l.materialId).length;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="mr-auto max-w-2xl space-y-1">
            <p className="font-medium">{draft.projectName}</p>
            <p className="text-sm text-muted-foreground">
              Per {draft.functionalUnit || "the stated item"}. {draft.assumptions}
            </p>
            <p className="text-xs text-warning">
              Sizes and any extra materials are AI estimates ({draft.model}): check each line. Materials per unit of
              masonry and concrete come from CPWD analyses; carbon factors only from the cited library.
              {unmatched > 0 && ` ${unmatched} component${unmatched === 1 ? " has" : "s have"} no library match yet.`}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setDraft(null)}>
            <RotateCcw />
            Start over
          </Button>
        </div>

        <ReviewTable lines={lines} onChange={setLines} itemHeading="Component" editable />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="mr-auto"
            onClick={() =>
              setLines((cur) => [...cur, { text: "", quantity: null, unit: null, rawUnit: "", materialId: "", manual: true }])
            }
          >
            <Plus />
            Add a missing component
          </Button>
          <span className="text-sm text-muted-foreground">
            {lines.filter(isUsable).length} of {lines.length} ready
          </span>
        </div>

        <AddToProject
          lines={lines}
          newName={draft.projectName}
          ai
          scope={{
            goal: `Embodied carbon of: ${text.trim()}`,
            functionalUnit: draft.functionalUnit,
            assumptions: `Inventory drafted by AI (${draft.model}) from the description "${text.trim()}" and reviewed by the user. ${draft.assumptions}`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void run(text);
        }}
      >
        <Input
          aria-label="What do you want to assess?"
          placeholder="e.g. 230 mm clay brick wall, 10 m²"
          value={text}
          maxLength={DRAFT_MAX_CHARS}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          className="h-10"
        />
        <Button type="submit" disabled={busy || !text.trim()} className="h-10 shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? "Drafting…" : "Draft the inventory"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={busy}
            onClick={() => {
              setText(ex);
              void run(ex);
            }}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
      {draft && !draft.inScope && (
        <p className="text-sm text-warning">{draft.reason || "That isn't a construction item this tool covers."}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Construction items only. The description is sent to Groq to draft components and quantities; every carbon
        factor still comes from the cited library, and you review each line before it enters the ledger.
      </p>
    </div>
  );
}
