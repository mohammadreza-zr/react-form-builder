import type { CSSProperties } from "react";

import type { FieldWidth } from "./config.js";

/**
 * The space a field occupies in its form's wrapping row.
 *
 * A set `width` is fixed — the field keeps it until the row runs out of room,
 * then wraps onto the next line — and is capped at the row itself so a narrow
 * panel never spills. `grow` lets the field also absorb the row's leftover
 * space. A `{ min, max }` range wraps at its `min` and fills up to its `max`.
 * Without either there is no style and the wrapper sizes to its content.
 */
export function fieldLayoutStyle(
  width: FieldWidth | undefined,
  grow: boolean | undefined,
): CSSProperties | undefined {
  if (width === undefined && !grow) return undefined;

  if (typeof width === "object") {
    return {
      flexBasis: `min(${width.min}px, 100%)`,
      flexGrow: 1,
      flexShrink: 1,
      maxWidth: `min(${width.max}px, 100%)`,
      minWidth: "min-content",
    };
  }

  return {
    ...(width === undefined
      ? {}
      : {
          width: typeof width === "number" ? `min(${width}px, 100%)` : width,
        }),
    maxWidth: "100%",
    minWidth: "min-content",
    flexGrow: grow ? 1 : 0,
    flexShrink: grow ? 1 : 0,
    flexBasis: "auto",
  };
}
