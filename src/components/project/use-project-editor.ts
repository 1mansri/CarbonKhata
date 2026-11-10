"use client";

import { useCallback, useMemo } from "react";
import { calculateProject } from "@/lib/lca/calculate";
import { getProject, saveProject, useProject } from "@/lib/lca/project-store";
import type { Project } from "@/lib/lca/types";

/** The open project, its live result, and an updater that autosaves. */
export function useProjectEditor(id: string) {
  const project = useProject(id);
  const result = useMemo(() => (project ? calculateProject(project) : null), [project]);

  // Applied to the latest saved state, not this render's snapshot, so a
  // change made after an await (an AI reply) can't undo edits in between.
  const update = useCallback(
    (change: (p: Project) => Project) => {
      const latest = getProject(id);
      if (latest) saveProject(change(latest));
    },
    [id],
  );

  return { project, result, update };
}
