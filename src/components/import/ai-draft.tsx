"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DescribeBox } from "@/components/import/describe-box";
import { AddToProject, MANUAL_LINE, ReviewTable, isUsable, type ReviewLine } from "@/components/import/review-table";
import { expandAssembly, getAssembly } from "@/data/lca/assemblies";
import { MATERIALS } from "@/data/lca/materials";
import type { Draft, DraftContext } from "@/lib/lca/ai-draft";
import { matchBoq } from "@/lib/lca/boq";
import { fmt } from "@/lib/lca/format";
import { unitLabel } from "@/lib/lca/units";

/** Construction items studied often enough to make good starting points. */
export const EXAMPLES = [
  "230 mm clay brick wall, 10 m²",
  "200 mm AAC block wall, 10 m²",
  "1 m³ of M25 concrete",
  "150 mm RCC roof slab, 20 m²",
];

export type DraftResult = Draft & { model: string; description: string };

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

/** Sends a description (and, on a project page, what the project holds) to the drafting route. */
export function useAiDraft() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [lines, setLines] = useState<ReviewLine[]>([]);

  const run = useCallback(async (description: string, project?: DraftContext): Promise<DraftResult | null> => {
    const d = description.trim();
    if (!d) return null;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: d, project }),
      });
      const body = (await res.json()) as Draft & { model: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Drafting failed.");
      const result = { ...body, description: d };
      setDraft(result);
      setLines(toReviewLines(result));
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drafting failed.");
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDraft(null);
    setLines([]);
    setError(null);
  }, []);

  return { busy, error, draft, lines, setLines, run, reset };
}

/** What the AI understood, the editable lines, and room to add what it missed. */
export function DraftReview({
  draft,
  lines,
  onChange,
  actions,
  children,
}: {
  draft: DraftResult;
  lines: ReviewLine[];
  onChange: (lines: ReviewLine[]) => void;
  /** Top-right, e.g. "Start over". */
  actions?: React.ReactNode;
  /** Under the table: where the lines go. */
  children: React.ReactNode;
}) {
  const unmatched = lines.filter((l) => !l.materialId).length;
  return (
    <div className="enter-rise space-y-5">
      <div className="flex items-start gap-3">
        <div className="mr-auto max-w-2xl space-y-1.5">
          <p className="text-base font-semibold">{draft.projectName}</p>
          <p className="text-sm text-muted-foreground">
            {draft.functionalUnit && <>Per {draft.functionalUnit}. </>}
            {draft.assumptions}
          </p>
          <p className="text-xs text-warning">
            AI sized these lines ({draft.model}). Check each one.
            {unmatched > 0 && ` ${unmatched} ${unmatched === 1 ? "has" : "have"} no library match.`}
          </p>
          <p className="text-xs text-muted-foreground">
            Material per unit comes from CPWD analyses. Carbon factors come only from the cited library.
          </p>
        </div>
        {actions}
      </div>

      <ReviewTable lines={lines} onChange={onChange} itemHeading="Component" editable />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" className="mr-auto" onClick={() => onChange([...lines, { ...MANUAL_LINE }])}>
          <Plus />
          Add a missing component
        </Button>
        <span className="tabular text-sm text-muted-foreground">
          {lines.filter(isUsable).length} of {lines.length} ready
        </span>
      </div>

      {children}
    </div>
  );
}

/** Example chips that draft straight away. */
export function ExampleChips({ disabled, onPick }: { disabled: boolean; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((ex) => (
        <button
          key={ex}
          type="button"
          disabled={disabled}
          onClick={() => onPick(ex)}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
        >
          {ex}
        </button>
      ))}
    </div>
  );
}

/** The new-project flow on /import: describe, review, then add to a new or existing project. */
export function AiDraft({ initial = "" }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const { busy, error, draft, lines, setLines, run, reset } = useAiDraft();
  const ran = useRef(false);

  // Arriving from the home page with a description: draft it straight away.
  useEffect(() => {
    if (initial && !ran.current) {
      ran.current = true;
      void run(initial);
    }
  }, [initial, run]);

  if (draft?.inScope) {
    return (
      <DraftReview
        draft={draft}
        lines={lines}
        onChange={setLines}
        actions={
          <Button variant="ghost" onClick={reset}>
            <RotateCcw />
            Start over
          </Button>
        }
      >
        <AddToProject
          lines={lines}
          newName={draft.projectName}
          ai
          scope={{
            goal: `Embodied carbon of: ${draft.description}`,
            functionalUnit: draft.functionalUnit,
            assumptions: `Inventory drafted by AI (${draft.model}) from the description "${draft.description}" and reviewed by the user. ${draft.assumptions}`,
          }}
        />
      </DraftReview>
    );
  }

  return (
    <div className="space-y-3">
      <DescribeBox
        label="What do you want to assess?"
        placeholder="e.g. 230 mm clay brick wall, 10 m²"
        value={text}
        onChange={setText}
        onSubmit={(t) => void run(t)}
        busy={busy}
      />
      <ExampleChips
        disabled={busy}
        onPick={(ex) => {
          setText(ex);
          void run(ex);
        }}
      />
      {draft && !draft.inScope && (
        <p className="text-sm text-warning">{draft.reason || "This tool covers construction items only."}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Your text goes to Groq to draft the lines. Carbon factors come only from the cited library.
      </p>
    </div>
  );
}
