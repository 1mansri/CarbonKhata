"use client";

import { useSyncExternalStore } from "react";
import type { Project } from "@/lib/lca/types";

/**
 * Projects live in the browser (no login, nothing leaves the machine) and
 * move between machines as exported files. The store is a tiny external
 * store over localStorage so every component reads one consistent snapshot.
 */
const KEY = "cradle:projects:v1";
/** Key used before the rename to Cradle; read once so saved projects carry over. */
const LEGACY_KEY = "carbonkhata:projects:v1";

type ProjectMap = Record<string, Project>;

let cache: ProjectMap | null = null;
const listeners = new Set<() => void>();

function read(): ProjectMap {
  if (cache) return cache;
  try {
    let raw = localStorage.getItem(KEY);
    const legacy = raw === null ? localStorage.getItem(LEGACY_KEY) : null;
    if (legacy !== null) {
      localStorage.setItem(KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
      raw = legacy;
    }
    cache = JSON.parse(raw ?? "{}") as ProjectMap;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: ProjectMap) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the session keeps working from memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null; // another tab changed it
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** All projects, or `null` while rendering on the server. */
export function useProjects(): ProjectMap | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** `undefined` while loading, `null` if no project has this id. */
export function useProject(id: string): Project | null | undefined {
  const all = useProjects();
  if (all === null) return undefined;
  return all[id] ?? null;
}

export function saveProject(project: Project) {
  write({ ...read(), [project.id]: { ...project, updatedAt: new Date().toISOString() } });
}

export function deleteProject(id: string) {
  const next = { ...read() };
  delete next[id];
  write(next);
}

export function getProject(id: string): Project | undefined {
  return read()[id];
}
