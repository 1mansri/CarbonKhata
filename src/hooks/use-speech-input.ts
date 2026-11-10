"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Voice typing through the browser's Web Speech API: free, no key, nothing
 * to install. Chrome and Edge support it (they send the audio to their own
 * speech service); Firefox doesn't, so callers hide the mic when
 * `supported` is false. Indian English by default, so "two thirty mm" and
 * local accents come out right.
 */

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in the browser's site settings.",
  "service-not-allowed": "Microphone access was blocked. Allow it in the browser's site settings.",
  "audio-capture": "No microphone was found.",
  "no-speech": "Didn't catch anything. Tap the mic and speak again.",
  network: "Voice typing needs an internet connection.",
};

/** Joins what was already typed with what's being said, with one space between. */
export function joinSpoken(typed: string, spoken: string): string {
  const s = spoken.trim();
  if (!s) return typed;
  return typed.trim() ? `${typed.trimEnd()} ${s}` : s;
}

const noSubscribe = () => () => {};

export function useSpeechInput({
  onText,
  lang = "en-IN",
}: {
  /** The full text: what was typed before the mic started, then everything heard so far. */
  onText: (text: string) => void;
  lang?: string;
}) {
  const supported = useSyncExternalStore(noSubscribe, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(
    (typed: string) => {
      const Ctor = getCtor();
      if (!Ctor || rec.current) return;
      const r = new Ctor();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = true;
      // Rebuilt from every result each time (not appended), so a browser
      // that re-sends earlier results can't duplicate words.
      r.onresult = (e) => {
        let spoken = "";
        for (let i = 0; i < e.results.length; i++) spoken += e.results[i][0].transcript;
        onTextRef.current(joinSpoken(typed, spoken));
      };
      r.onerror = (e) => {
        if (e.error !== "aborted") setError(ERRORS[e.error] ?? "Voice typing stopped. Try again.");
      };
      r.onend = () => {
        rec.current = null;
        setListening(false);
      };
      rec.current = r;
      setError(null);
      setListening(true);
      try {
        r.start();
      } catch {
        rec.current = null;
        setListening(false);
        setError("Voice typing couldn't start. Try again.");
      }
    },
    [lang],
  );

  // Leaving the page turns the mic off.
  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, error, start, stop };
}
