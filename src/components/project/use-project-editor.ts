"use client";

import { useCallback, useMemo } from "react";
import { calculateProject } from "@/lib/lca/calculate";
import { saveProject, useProject } from "@/lib/lca/project-store";
import type { Project } from "@/lib/lca/types";

/** The open project, its live result, and an updater that autosaves. */
export function useProjectEditor(id: string) {
  const project = useProject(id);
  const result = useMemo(() => (project ? calculateProject(project) : null), [project]);

  const update = useCallback(
    (change: (p: Project) => Project) => {
      if (project) saveProject(change(project));
    },
    [project],
  );

  return { project, result, update };
}
