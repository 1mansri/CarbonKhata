"use client";

import * as React from "react";
import { IsoFigure } from "@/components/iso/react/draw";
import { asksForStillness, spring, useReadout, type Spring } from "@/components/iso/react/live";
import { liftAt, needleAt, panAt } from "./frame";
import { readoutOf, spokenOf, type ScaleSample } from "./model";
import { HEIGHT, LIFT, WIDTH } from "./view";

/** Needle and pan: a light spring that overshoots once, like a real dial scale. */
const STIFF = 70;
const DRAG = 9;
const TOUR_FIRST = 1400;
const TOUR_EVERY = 4600;
const TOUR_BACK = 3600;
/** A sample leaves (lifts and fades), then the next is lowered once the pan is clear. */
const LEAVE = 0.1;
const ARRIVE = 0.2;

interface Carry {
  lift: number;
  shown: number;
  /** Seconds before an arriving sample starts down. */
  wait: number;
}


interface Props {
  label: string;
  samples: ScaleSample[];
  base: React.ReactNode;
  body: React.ReactNode;
  dial: React.ReactNode;
  hub: React.ReactNode;
  post: React.ReactNode;
  pan: React.ReactNode;
  sampleArt: React.ReactNode[];
}

export function ScaleLive({ label, samples, base, body, dial, hub, post, pan, sampleArt }: Props) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const root = React.useRef<HTMLDivElement | null>(null);
  const needle = React.useRef<SVGPathElement | null>(null);
  const panNode = React.useRef<SVGGElement | null>(null);
  const sampleNodes = React.useRef<(SVGGElement | null)[]>([]);
  const [on, setOn] = React.useState(0);
  const target = React.useRef(0);
  const carries = React.useRef<Carry[]>(samples.map((_, index) => ({ lift: index ? LIFT : 0, shown: index ? 0 : 1, wait: 0 })));
  const gauge = React.useRef<Spring>({ at: samples[0]?.kg ?? 0, rate: 0 });
  const frame = React.useRef(0);
  const last = React.useRef(0);
  const visible = React.useRef(false);
  const [engaged, setEngaged] = React.useState(false);
  const [idle, setIdle] = React.useState(true);
  const [poke, setPoke] = React.useState(0);

  const draw = React.useCallback(() => {
    carries.current.forEach((carry, index) => {
      const node = sampleNodes.current[index];
      if (!node) return;
      node.setAttribute("transform", liftAt(carry.lift));
      const opacity = `${Math.round(carry.shown * 1000) / 1000}`;
      if (node.style.opacity !== opacity) node.style.opacity = opacity;
    });
    needle.current?.setAttribute("d", needleAt(gauge.current.at));
    panNode.current?.setAttribute("transform", panAt(gauge.current.at));
    // Name and number from the same instant: whatever is actually down on the pan.
    let seated = -1;
    let most = 0.5;
    carries.current.forEach((carry, index) => {
      const down = carry.shown * (1 - carry.lift / LIFT);
      if (down > most) {
        most = down;
        seated = index;
      }
    });
    const sample = samples[seated];
    say(sample ? readoutOf(sample, gauge.current.at) : `changing sample · ${Math.round(gauge.current.at)} kg CO₂e`);
  }, [samples, say]);

  const run = React.useCallback(() => {
    if (frame.current || !visible.current) return;
    last.current = 0;
    const tick = (now: number) => {
      const dt = last.current ? Math.min((now - last.current) / 1000, 1 / 30) : 1 / 60;
      last.current = now;
      const calm = asksForStillness();
      let moving = false;
      let load = 0;
      carries.current.forEach((carry, index) => {
        const wanted = index === target.current;
        if (wanted && carry.wait > 0) {
          // Never two samples in the air at once: wait until the pan is clear.
          const clear = carries.current.every((other, at) => at === index || other.shown === 0);
          carry.wait = calm || clear ? 0 : carry.wait;
          moving = true;
        }
        const goalLift = wanted && carry.wait === 0 ? 0 : wanted ? carry.lift : LIFT;
        const goalShown = wanted ? 1 : 0;
        const tau = wanted ? ARRIVE : LEAVE;
        const k = calm ? 1 : 1 - Math.exp(-dt / tau);
        carry.lift += (goalLift - carry.lift) * k;
        carry.shown += (goalShown - carry.shown) * k;
        if (Math.abs(goalLift - carry.lift) < 0.01) carry.lift = goalLift;
        if (Math.abs(goalShown - carry.shown) < 0.002) carry.shown = goalShown;
        if (carry.lift !== goalLift || carry.shown !== goalShown) moving = true;
        // Only what is down on the pan weighs on it.
        load += (samples[index]?.kg ?? 0) * Math.max(0, 1 - carry.lift / LIFT) * (carry.shown > 0.01 ? 1 : 0);
      });
      const settled = spring(gauge.current, load, dt, STIFF, DRAG, calm);
      draw();
      frame.current = moving || !settled ? requestAnimationFrame(tick) : 0;
    };
    frame.current = requestAnimationFrame(tick);
  }, [draw, samples]);

  const choose = React.useCallback(
    (next: number) => {
      const count = samples.length;
      const index = ((next % count) + count) % count;
      if (index === target.current) return;
      const leaving = carries.current[target.current];
      target.current = index;
      const arriving = carries.current[index];
      // Wait for the pan to clear if another sample is still showing.
      if (arriving) arriving.wait = leaving && leaving.shown > 0 ? 1 : 0;
      setOn(index);
      run();
    },
    [run, samples.length],
  );

  // Visible: run only while on screen.
  React.useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        visible.current = Boolean(entries.at(-1)?.isIntersecting);
        if (visible.current) run();
        else {
          cancelAnimationFrame(frame.current);
          frame.current = 0;
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [run]);

  // Idle again 3.6 s after the last interaction.
  React.useEffect(() => {
    if (engaged) return;
    const timer = window.setTimeout(() => setIdle(true), TOUR_BACK);
    return () => window.clearTimeout(timer);
  }, [engaged, poke]);

  // Idle tour: the next sample every 4.6 s, never under reduced motion.
  React.useEffect(() => {
    if (!idle || engaged || asksForStillness()) return;
    let timer = window.setTimeout(function next() {
      if (visible.current) choose(target.current + 1);
      timer = window.setTimeout(next, TOUR_EVERY);
    }, TOUR_FIRST);
    return () => window.clearTimeout(timer);
  }, [idle, engaged, choose]);

  const wake = () => {
    setIdle(false);
    setPoke((count) => count + 1);
  };

  const current = samples[on];

  return (
    <div
      ref={(node) => {
        root.current = node;
        anchor.current = node;
      }}
      className="ck-scale"
      role="slider"
      tabIndex={0}
      aria-label="Carbon scale: tap, or use the arrow keys, to put the next wall sample on the pan"
      aria-valuemin={0}
      aria-valuemax={samples.length - 1}
      aria-valuenow={on}
      aria-valuetext={current ? spokenOf(current) : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setEngaged(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setEngaged(false);
          wake();
        }
      }}
      onClick={() => {
        wake();
        choose(target.current + 1);
      }}
      onFocus={() => setEngaged(true)}
      onBlur={() => {
        setEngaged(false);
        wake();
      }}
      onKeyDown={(event) => {
        let next: number | null = null;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") next = target.current + 1;
        else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = target.current - 1;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = samples.length - 1;
        else if (event.key === " " || event.key === "Enter") next = target.current + 1;
        if (next === null) return;
        event.preventDefault();
        wake();
        choose(next);
      }}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={label}>
        {base}
        {body}
        {dial}
        <path ref={needle} className="iso-line ck-needle" data-tone="lit" data-free="start" d={needleAt(samples[0]?.kg ?? 0)} />
        {hub}
        {post}
        <g ref={panNode} transform={panAt(samples[0]?.kg ?? 0)}>
          {pan}
          {sampleArt.map((art, index) => (
            <g
              key={index}
              ref={(node) => {
                sampleNodes.current[index] = node;
              }}
              transform={liftAt(index ? LIFT : 0)}
              style={{ opacity: index ? 0 : 1 }}
            >
              {art}
            </g>
          ))}
        </g>
      </IsoFigure>
    </div>
  );
}
