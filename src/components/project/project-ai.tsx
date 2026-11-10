"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DescribeBox } from "@/components/import/describe-box";
import { DraftReview, ExampleChips, useAiDraft, type DraftResult } from "@/components/import/ai-draft";
import { isUsable, toInventoryItems } from "@/components/import/review-table";
import { DRAFT_FALLBACK_NAME, type DraftContext } from "@/lib/lca/ai-draft";
import { getProject } from "@/lib/lca/project-store";
import type { Project } from "@/lib/lca/types";

type Update = (change: (p: Project) => Project) => void;

/**
 * Component names already in the ledger (the assembly part of an AI
 * line's label, else the material), so a new description adds to the
 * project instead of drafting it again.
 */
function projectContext(p: Project): DraftContext | undefined {
  if (p.items.length === 0) return undefined;
  const components = [...new Set(p.items.map((i) => (i.label ?? i.material.name).split(": ")[0]))];
  return { projectName: p.name, components: components.slice(0, 20) };
}

/**
 * AI drafting inside an open project. The reply renames the project to
 * what the user described (undoable), and the reviewed lines go straight
 * into this ledger.
 */
export function ProjectAi({ project, update }: { project: Project; update: Update }) {
  const [text, setText] = useState("");
  const { busy, error, draft, lines, setLines, run, reset } = useAiDraft();
  const [renamed, setRenamed] = useState<{ from: string; to: string } | null>(null);
  const empty = project.items.length === 0;

  // The title changes as soon as the draft arrives, but only sticks once its
  // lines are added: discarding, leaving or reloading mid-review puts the
  // old title back, so the name never describes lines that aren't there.
  const pendingRename = useRef(renamed);
  const updateRef = useRef(update);
  useEffect(() => {
    pendingRename.current = renamed;
    updateRef.current = update;
  });
  useEffect(() => {
    const revert = () => {
      const r = pendingRename.current;
      // Unless the user has retitled it since.
      if (r) updateRef.current((p) => (p.name === r.to ? { ...p, name: r.from } : p));
      pendingRename.current = null;
    };
    window.addEventListener("pagehide", revert);
    return () => {
      window.removeEventListener("pagehide", revert);
      revert();
    };
  }, []);

  async function draftIt(description: string) {
    undoRename(); // a fresh draft replaces the one under review
    const from = getProject(project.id)?.name ?? project.name;
    const result = await run(description, projectContext(project));
    const to = result?.inScope ? result.projectName : "";
    if (to && to !== DRAFT_FALLBACK_NAME && to !== from) {
      update((p) => ({ ...p, name: to }));
      setRenamed({ from, to });
    }
  }

  /** Puts the old title back, unless the user has retitled it since. */
  function undoRename() {
    if (renamed) update((p) => (p.name === renamed.to ? { ...p, name: renamed.from } : p));
    pendingRename.current = null;
    setRenamed(null);
  }

  function discard() {
    undoRename();
    reset();
  }

  function addToLedger(d: DraftResult) {
    const items = toInventoryItems(lines, true);
    const note = `Lines drafted by AI (${d.model}) from "${d.description}" and reviewed by the user. ${d.assumptions}`.trim();
    update((p) => ({
      ...p,
      items: [...p.items, ...items],
      scope: {
        ...p.scope,
        goal: p.scope.goal || `Embodied carbon of: ${d.description}`,
        functionalUnit: p.scope.functionalUnit || d.functionalUnit,
        assumptions: p.scope.assumptions ? `${p.scope.assumptions}\n${note}` : note,
      },
    }));
    // The lines are in, so the new title stays.
    pendingRename.current = null;
    setRenamed(null);
    reset();
    setText("");
  }

  if (draft?.inScope) {
    const usable = lines.filter(isUsable).length;
    return (
      <section
        aria-label="AI draft"
        className="space-y-4 rounded-lg border border-dashed border-brand-accent/60 bg-brand-accent/5 p-3 sm:p-4"
      >
        {renamed && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-brand-accent" aria-hidden />
            <span>
              Title set from your description (was &ldquo;{renamed.from}&rdquo;).
            </span>
            <button type="button" onClick={undoRename} className="font-medium text-foreground underline underline-offset-2">
              Keep the old title
            </button>
          </p>
        )}
        <DraftReview
          draft={draft}
          lines={lines}
          onChange={setLines}
          actions={
            <Button variant="ghost" onClick={discard}>
              <X />
              Discard
            </Button>
          }
        >
          <div className="flex justify-end">
            <Button disabled={usable === 0} onClick={() => addToLedger(draft)}>
              Add {usable} line{usable === 1 ? "" : "s"} to this ledger
            </Button>
          </div>
        </DraftReview>
      </section>
    );
  }

  return (
    <section aria-label="Draft with AI" className={empty ? "space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4" : "space-y-2"}>
      {empty && (
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-1.5 font-medium">
            <Sparkles className="size-4 text-brand-accent" aria-hidden />
            Describe what you&apos;re assessing
          </h2>
          <p className="text-sm text-muted-foreground">
            Type or speak it. AI finds the components and sizes them, and you check every line.
          </p>
        </div>
      )}
      <DescribeBox
        label={empty ? "Describe what you're assessing" : "Describe more to add with AI"}
        placeholder={
          empty ? "e.g. 230 mm clay brick wall, 10 m², on a 150 mm RCC slab of 20 m²" : "Add more with AI: e.g. 150 mm RCC roof slab, 20 m²"
        }
        submitLabel={empty ? "Draft the inventory" : "Draft"}
        value={text}
        onChange={setText}
        onSubmit={(t) => void draftIt(t)}
        busy={busy}
      />
      {empty && (
        <ExampleChips
          disabled={busy}
          onPick={(ex) => {
            setText(ex);
            void draftIt(ex);
          }}
        />
      )}
      {draft && !draft.inScope && (
        <p className="text-sm text-warning">{draft.reason || "That isn't a construction item this tool covers."}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
