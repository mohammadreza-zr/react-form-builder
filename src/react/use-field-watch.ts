import { useMemo } from "react";
import { type Control, type FieldValues, type Path, useWatch } from "react-hook-form";

import {
  collectWatchFields,
  resolveWatchRule,
  toWatchSnapshot,
} from "../core/field-watch.js";
import type { FieldWatchRule, WatchSnapshot } from "../core/types.js";

/**
 * Read the fields a surface depends on without reading the form.
 *
 * It is the dependency language — the same `Condition`s and operators a
 * field's `dependencies` use — pointed at something that is not a field: a map
 * panel, a live summary, a preview. A sibling of the form has no way to ask
 * the builder, and the alternative is a parent that calls `form.watch()` and
 * re-renders every input on each keystroke.
 *
 * ```tsx
 * // the map follows the coordinates, once both are there
 * const location = useFieldWatch(control, { watch: ["latitude", "longitude"] });
 * return <StationMap center={location} />; // null until the rule holds
 * ```
 *
 * Only the calling component subscribes, to only the names in the rule, so
 * call it in the component that owns the surface. The value is a fresh object
 * whenever a watched field changes, never on any other render. `null` means
 * the rule is not satisfied: the surface keeps its own default instead of
 * chasing a half-entered value.
 */
export function useFieldWatch<T extends FieldValues, R = WatchSnapshot<T>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a variance wildcard
  control: Control<T, any, any>,
  rule: FieldWatchRule<T, R>,
): R | null {
  const { watch, when, select } = rule;

  // Rules are written inline, so the arrays inside one are new on every
  // render. The subscription must not be: derive a string key from the names
  // and let the array follow it.
  const fieldsKey = useMemo(
    () => collectWatchFields({ watch, when }).join("|"),
    [watch, when],
  );

  const names = useMemo(
    () => (fieldsKey ? fieldsKey.split("|") : []) as Path<T>[],
    [fieldsKey],
  );

  const values = useWatch({ control, name: names as never }) as unknown[] | undefined;

  const snapshot = useMemo(() => toWatchSnapshot(names, values), [names, values]);

  return useMemo(
    () => resolveWatchRule(snapshot, { watch, when, select }),
    [snapshot, watch, when, select],
  );
}
