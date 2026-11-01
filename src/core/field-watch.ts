import type { FieldValues, Path } from "react-hook-form";

import { asConditionList, evaluateConditions, isFilled } from "./dependency.js";
import type { FieldWatchRule, WatchSnapshot } from "./types.js";

/**
 * The fields a watch rule reads: the ones it names, plus the ones its
 * conditions test.
 *
 * A rule is allowed to gate on a field it does not intend to publish — «show
 * the preview only while `mode` is `advanced` and both coordinates are
 * filled» — and that `mode` still has to be subscribed to, or the rule would
 * be evaluated against a stale snapshot. This is the same job
 * `collectDependencyFields` does for a field's `dependencies`, so both sides of
 * the language get the narrow subscription for free.
 */
export function collectWatchFields<T extends FieldValues, R = WatchSnapshot<T>>(
  rule: Pick<FieldWatchRule<T, R>, "watch" | "when">,
): Path<T>[] {
  const names = new Set<Path<T>>(rule.watch ?? []);

  for (const condition of asConditionList(rule.when)) {
    names.add(condition.field);
  }

  return [...names];
}

/**
 * Pair `useWatch`'s positional array with the names it was asked for.
 *
 * RHF hands back values in the order of the `name` array, which is fast but
 * opaque; the snapshot puts the names back so a rule can read `values.latitude`
 * and a condition can address a field by path.
 */
export function toWatchSnapshot<T extends FieldValues>(
  names: Path<T>[],
  values: unknown[] | undefined,
): WatchSnapshot<T> {
  const record: Record<string, unknown> = {};

  names.forEach((name, index) => {
    record[name as string] = values?.[index];
  });

  return record as WatchSnapshot<T>;
}

/**
 * Evaluate one rule against one snapshot.
 *
 * Returns `null` when the rule does not hold, which is the whole point of the
 * gate: a surface renders *nothing* rather than rendering half a value. Typing
 * a latitude is not yet a location, and a component that receives `null` keeps
 * its default view instead of flying to `(37.4, undefined)`.
 *
 * Without `when` the default is «every watched field is `filled`» — the rule
 * every preview panel wants. With `when`, that gate is replaced, not added to:
 * a rule that says «publish while `kind === "point"`» has decided for itself.
 */
export function resolveWatchRule<T extends FieldValues, R = WatchSnapshot<T>>(
  snapshot: WatchSnapshot<T>,
  rule: FieldWatchRule<T, R>,
): R | null {
  const values = snapshot as Record<string, unknown>;

  if (rule.when) {
    if (!evaluateConditions(values as unknown as T, rule.when)) return null;
  } else {
    const names = rule.watch ?? (Object.keys(values) as Path<T>[]);

    for (const name of names) {
      if (!isFilled(values[name as string])) return null;
    }
  }

  return rule.select ? rule.select(snapshot) : (snapshot as R);
}
