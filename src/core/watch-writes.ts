import type { FieldValues, Path, UseFormSetValue } from "react-hook-form";

import type { WatchWriteOptions } from "./types.js";

/** One write a resolved `watch` dependency asked for. */
export type ResolvedWatchWrite = {
  /** The field path being written. */
  name: string;
  value: unknown;
  options?: WatchWriteOptions;
};

/**
 * Structural equality over the plain data a form holds.
 *
 * This is what stops a config-driven write from looping: `setValue` notifies
 * the watchers, the resolver runs again, and unless the new value compares
 * equal to the one just written the rule would fire forever. Values that are
 * neither primitives nor plain objects/arrays (a `Date`, a class instance)
 * compare by identity, which is why `WatchPatch.set` is documented to return
 * plain data.
 */
export function isStructurallyEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    return a.every((item, index) => isStructurallyEqual(item, b[index]));
  }

  const isPlain = (value: object) => {
    const proto = Object.getPrototypeOf(value) as unknown;
    return proto === Object.prototype || proto === null;
  };

  if (!isPlain(a) || !isPlain(b)) return false;

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);

  if (keys.length !== Object.keys(right).length) return false;

  return keys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      isStructurallyEqual(left[key], right[key]),
  );
}

/**
 * Apply the writes a pass produced, in declaration order.
 *
 * Validation and dirtiness follow the write by default: a value the form
 * derived is still a value the user has to save, and the field it landed in
 * should re-check its own rules. Pass `then.options` to disagree per rule.
 */
export function applyWatchWrites<T extends FieldValues>(
  writes: ResolvedWatchWrite[],
  setValue: UseFormSetValue<T>,
) {
  for (const write of writes) {
    setValue(write.name as Path<T>, write.value as never, {
      shouldValidate: true,
      shouldDirty: true,
      ...write.options,
    });
  }
}
