"use client";

import { useRef } from "react";
import { Loader2, Mic, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { DRAFT_MAX_CHARS } from "@/lib/lca/ai-draft";
import { cn } from "@/lib/utils";

/**
 * The AI description field: type it, or tap the mic and say it. Enter
 * drafts, Shift+Enter starts a new line. While the mic is on, the text
 * fills in live and the field is read-only so speech and typing can't
 * overwrite each other.
 */
export function DescribeBox({
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  label,
  submitLabel = "Draft",
  autoFocus,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  busy: boolean;
  placeholder: string;
  label: string;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const voice = useSpeechInput({ onText: (t) => onChange(t.slice(0, DRAFT_MAX_CHARS)) });
  const nearLimit = value.length > DRAFT_MAX_CHARS * 0.8;

  function submit() {
    voice.stop();
    if (value.trim() && !busy) onSubmit(value);
  }

  return (
    <div className="space-y-1.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "rounded-lg border border-input bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          voice.listening && "border-brand-accent ring-3 ring-brand-accent/30 focus-within:border-brand-accent focus-within:ring-brand-accent/30",
        )}
      >
        <textarea
          ref={ref}
          aria-label={label}
          placeholder={voice.listening ? "Listening…" : placeholder}
          value={value}
          maxLength={DRAFT_MAX_CHARS}
          rows={1}
          autoFocus={autoFocus}
          readOnly={voice.listening}
          disabled={busy}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="block max-h-48 min-h-11 w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-base outline-none field-sizing-content placeholder:text-muted-foreground disabled:opacity-60 md:text-sm"
        />
        <div className="flex items-center gap-2 px-1.5 pb-1.5">
          {voice.supported && (
            <Button
              type="button"
              variant={voice.listening ? "secondary" : "ghost"}
              size="sm"
              disabled={busy}
              aria-pressed={voice.listening}
              title="Uses your browser's speech service. Chrome and Edge send the audio to Google or Microsoft."
              onClick={() => {
                if (voice.listening) {
                  voice.stop();
                  ref.current?.focus();
                } else {
                  voice.start(value);
                }
              }}
            >
              {voice.listening ? (
                <>
                  <span className="relative flex size-3.5 items-center justify-center" aria-hidden>
                    <span className="absolute size-3 animate-ping rounded-full bg-brand-accent/60 motion-reduce:hidden" />
                    <Square className="relative size-2.5 fill-current" />
                  </span>
                  Stop
                </>
              ) : (
                <>
                  <Mic />
                  Speak
                </>
              )}
            </Button>
          )}
          <span
            className={cn("tabular ml-auto text-xs text-muted-foreground", !nearLimit && "invisible")}
            aria-live="polite"
          >
            {value.length}/{DRAFT_MAX_CHARS}
          </span>
          <Button type="submit" size="sm" disabled={busy || !value.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Drafting…" : submitLabel}
          </Button>
        </div>
      </form>
      {voice.error && <p className="text-xs text-destructive">{voice.error}</p>}
    </div>
  );
}
