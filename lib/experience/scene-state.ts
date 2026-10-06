import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { SHELF_ORDER } from "@/lib/traductor/shelves";
import type { AskedQuestion } from "./mission";

export function questionCells(items: readonly AskedQuestion[], revealed: number): TapeStatus[] {
  return items.map((c, i) => (i >= revealed ? "pending" : c.status));
}

export function revealedQuestions(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return n;
  return Math.ceil((n * frame.visible) / frame.total);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };

export type TripStop = { shelf: number; known: boolean };

/** Shelves the librarian walks to for one question; the first `known` shelves are the catalogued ones. */
export function tripStops(tables: readonly string[], known: number): TripStop[] {
  return tables.map(t => (SHELF_ORDER as readonly string[]).indexOf(t)).filter(i => i >= 0).map(shelf => ({ shelf, known: shelf < known }));
}

/** Index of the question the librarian is walking for, or null when the scene should rest in its final pose. */
export function activeQuestion(frame: { visible: number; total: number; complete: boolean }, reducedMotion: boolean): number | null {
  if (reducedMotion || frame.total === 0 || frame.visible === 0) return null;
  return frame.visible - 1;
}
