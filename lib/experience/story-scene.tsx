"use client";
import { useEffect, useRef } from "react";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import type { ShelfStatus } from "@/lib/traductor/shelves";
import type { MissionResult } from "./mission";
import { activeQuestion, questionCells, revealedQuestions, tripStops } from "./scene-state";
import { STORY } from "./story";

// Compact 360-wide canvas so labels stay legible at phone width.
const SHELF_X = [8, 126, 244] as const;
const SHELF_W = 108;
const HOME: Point = [180, 212];
const STOP: readonly Point[] = [[62, 168], [180, 168], [298, 168]];
const BOOK_COLORS = ["#b5651d", "#3f7f8c", "#8c6d3f"] as const;
const FILL: Record<ShelfStatus, string> = { served: "fill-success", rerouted: "fill-info", lost: "fill-danger" };
const MARK: Record<ShelfStatus, string> = { served: "✓", rerouted: "?", lost: "×" };
const TRIP_MS = 760;

type Point = readonly [number, number];
const at = ([x, y]: Point) => `translate(${x}px, ${y}px)`;

export function TraductorStoryScene({ frame, result, tables, locale }: { frame: PlaybackFrame<TraceEvent>; result: MissionResult; tables: number; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const shelfNames = STORY[locale].tryIt.shelves;
  const reduced = useReducedMotion();
  const cells = questionCells(result.items, revealedQuestions(frame, result.items.length, reduced));
  const c = tapeCounts(cells);
  const active = activeQuestion(frame, reduced);
  const q = active === null ? undefined : result.items[active];
  const stops = q ? tripStops(q.tables, tables) : [];
  const needed = new Set(stops.map(s => s.shelf));
  const firstUnknown = stops.find(s => !s.known);
  // Keep the "not on my shelves" bubble inside the canvas when the trip ends at an edge shelf.
  const bubbleDx = firstUnknown ? Math.min(Math.max(STOP[firstUnknown.shelf][0], 92), 268) - STOP[firstUnknown.shelf][0] : 0;
  const done = reduced || frame.complete;

  const lib = useRef<SVGGElement>(null);
  const bubble = useRef<SVGGElement>(null);
  const book = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!q || !lib.current || !bubble.current || !book.current || typeof lib.current.animate !== "function") return;
    const trip = tripStops(q.tables, tables);
    // Walk legs weigh 1, each pause at a shelf 0.6 (a little longer where the librarian has to refuse).
    const total = trip.length + 1 + trip.reduce((sum, s) => sum + (s.known ? 0.6 : 0.9), 0);
    const walk: Keyframe[] = [{ transform: at(HOME), offset: 0 }];
    let t = 0;
    let unknownAt: number | null = null;
    for (const s of trip) {
      t += 1;
      walk.push({ transform: at(STOP[s.shelf]), offset: t / total });
      if (!s.known && unknownAt === null) unknownAt = t / total;
      t += s.known ? 0.6 : 0.9;
      walk.push({ transform: at(STOP[s.shelf]), offset: t / total });
    }
    walk.push({ transform: at(HOME), offset: 1 });
    const leaveLast = t / total;
    const timing: KeyframeAnimationOptions = { duration: TRIP_MS, easing: "ease-in-out", fill: "forwards" };
    const anims = [
      lib.current.animate(walk, { ...timing, fill: "none" }),
      book.current.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: leaveLast }, { opacity: 1, offset: Math.min(1, leaveLast + 0.02) }, { opacity: 1, offset: 1 }], timing),
      bubble.current.animate(unknownAt === null ? [{ opacity: 0 }, { opacity: 0 }] : [{ opacity: 0, offset: 0 }, { opacity: 0, offset: unknownAt }, { opacity: 1, offset: Math.min(1, unknownAt + 0.02) }, { opacity: 1, offset: 1 }], timing),
    ];
    return () => anims.forEach(a => a.cancel());
  }, [q, tables]);

  const ticket = q && active !== null ? `${active + 1}/${result.items.length} · ${copy.questions[q.id] ?? q.id} · ${copy.tape[q.status]}` : null;
  const summary = `${copy.summary(c.served, c.rerouted)} ${copy.wrongOf(c.lost)}`;

  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <p aria-live="polite" data-scene-ticket className="mb-3 min-h-12 rounded-lg border border-border px-3 py-2 text-sm leading-5">{ticket ?? summary}</p>
    <svg viewBox="0 0 360 260" role="img" aria-label={`${copy.libraryLabel(tables)} ${done ? summary : ""}`.trim()} className="block h-auto w-full max-w-[560px] mx-auto" data-librarian-scene>
      {SHELF_X.map((x, s) => {
        const known = s < tables;
        const hit = needed.has(s);
        return <g key={s} data-shelf={s} data-known={known} opacity={known ? 1 : 0.5}>
          <text x={x + SHELF_W / 2} y={17} textAnchor="middle" fontSize={16} fontWeight={600} className="fill-foreground">{shelfNames[s]}</text>
          <rect x={x} y={26} width={SHELF_W} height={86} rx={5} fill="#2a2119" strokeDasharray={known ? undefined : "6 5"} strokeWidth={hit ? 3 : 1.5} className={hit ? "stroke-accent" : known ? "stroke-[#7a5a3c]" : "stroke-muted-foreground"} />
          {[64, 104].map(plank => <g key={plank}>
            <rect x={x + 6} y={plank} width={SHELF_W - 12} height={4} fill="#5a3e28" />
            {Array.from({ length: 6 }, (_, b) => <rect key={b} x={x + 9 + b * 16} y={plank - 30 + (b % 3) * 4} width={12} height={30 - (b % 3) * 4} rx={1} fill={known ? BOOK_COLORS[b % 3] : "#555"} />)}
          </g>)}
          {known ? null : <text x={x + SHELF_W / 2} y={130} textAnchor="middle" fontSize={13} className="fill-muted-foreground">{copy.uncatalogued}</text>}
        </g>;
      })}
      <g ref={lib} style={{ transform: at(HOME) }} data-librarian>
        <circle cx={0} cy={-20} r={13} fill="#e0b48a" />
        <rect x={-9} y={-24} width={18} height={4} rx={2} fill="#333" />
        <path d="M-16 0 Q0 -10 16 0 L14 30 L-14 30 Z" fill="#7a5cc4" />
        <g ref={book} opacity={0} data-carried={q?.status}>
          {q ? <>
            <rect x={14} y={0} width={18} height={22} rx={2} className={FILL[q.status]} />
            <text x={23} y={16} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">{MARK[q.status]}</text>
          </> : null}
        </g>
        <g ref={bubble} opacity={0} data-bubble>
          <rect x={bubbleDx - 88} y={-82} width={176} height={30} rx={7} fill="#fff" stroke="#999" />
          <path d="M-6 -52 L0 -44 L6 -52 Z" fill="#fff" />
          <text x={bubbleDx} y={-62} textAnchor="middle" fontSize={14} fill="#111">{copy.notHere}</text>
        </g>
      </g>
      <rect x={110} y={234} width={140} height={20} rx={4} fill="#5a3e28" />
      <text x={180} y={248} textAnchor="middle" fontSize={12} fill="#f3e6d6">{copy.desk}</text>
    </svg>
    <div className="mt-6">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={10} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.servedOf(c.served)}</p>
      {done && ticket ? <p data-scene-summary className="mt-1 text-sm text-muted-foreground">{summary}</p> : null}
    </div>
  </StoryStage>;
}
