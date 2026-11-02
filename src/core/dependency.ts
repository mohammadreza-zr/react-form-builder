import type { Control, FieldValues, Path } from "react-hook-form";

import type {
  Condition,
  Conditions,
  Dependency,
  FieldNode,
  FieldOption,
  OptionsPatch,
  ValidationPatch,
  WatchSnapshot,
} from "./types.js";
import type { ResolvedWatchWrite } from "./watch-writes.js";
import { isStructurallyEqual } from "./watch-writes.js";

/* ----------------------------------
 * small safe getter for nested paths
 * supports: "user.name", "items.0.title"
 * ---------------------------------- */
export function getValueByPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;

  // A flat key first. Dependency and watch snapshots are built from the field
  // *paths* RHF was asked about, so `"items.0.title"` is a single key there;
  // without this the walk would look for an `items` property, find nothing,
  // and every dependency on an array field would read as `undefined`.
  // Own keys only: `"constructor"` or `"toString"` is a field name, not the
  // prototype's function.
  if (!Array.isArray(obj) && Object.hasOwn(obj, path)) {
    return (obj as Record<string, unknown>)[path];
  }

  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;

    if (Array.isArray(acc)) {
      const index = Number(key);
      return Number.isNaN(index) ? undefined : acc[index];
    }

    if (typeof acc === "object" && Object.hasOwn(acc, key)) {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, obj);
}

/**
 * The two sides of `gt`/`gte`/`lt`/`lte` as numbers, or `null` when either is
 * not one. An empty field is not `0`: `Number("")` and `Number(null)` are, so
 * without this a cleared field would be «less than 5».
 */
function numericPair(actual: unknown, expected: unknown): [number, number] | null {
  if (!isFilled(actual) || typeof actual === "boolean") return null;
  const left = Number(actual);
  const right = Number(expected);
  return Number.isFinite(left) && Number.isFinite(right) ? [left, right] : null;
}

/* ----------------------------------
 * truthy/falsy helper
 * ---------------------------------- */
export function isTruthy(value: unknown): boolean {
  return !!value;
}

/* ----------------------------------
 * "is there a value here" helper
 * ---------------------------------- */

/**
 * `filled` — the field holds something the user put there.
 *
 * Not `!!value`: `0` and `false` are answers, and a whitespace-only string is
 * not. `NaN` counts as empty because a coordinate field that has not parsed is
 * exactly the case this operator exists to keep a surface from reacting to.
 */
export function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/* ----------------------------------
 * compare one condition
 * ---------------------------------- */
export function evaluateCondition<T extends FieldValues>(
  values: T,
  condition: Condition<T>,
): boolean {
  const actual = getValueByPath(values, condition.field);

  switch (condition.op) {
    case "eq":
      return actual === condition.value;

    case "neq":
      return actual !== condition.value;

    case "in":
      return Array.isArray(condition.value)
        ? condition.value.includes(actual)
        : false;

    case "nin":
      return Array.isArray(condition.value)
        ? !condition.value.includes(actual)
        : true;

    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const pair = numericPair(actual, condition.value);
      if (!pair) return false;
      const [left, right] = pair;
      if (condition.op === "gt") return left > right;
      if (condition.op === "gte") return left >= right;
      if (condition.op === "lt") return left < right;
      return left <= right;
    }

    case "filled":
      return isFilled(actual);

    case "empty":
      return !isFilled(actual);

    case "truthy":
      return isTruthy(actual);

    case "falsy":
      return !isTruthy(actual);

    default:
      return false;
  }
}

/* ----------------------------------
 * a condition or a list of them, all of which must hold
 * ---------------------------------- */

/** Walk either spelling of `when` — one condition, or an AND of several. */
export function asConditionList<T extends FieldValues>(
  when: Conditions<T> | undefined,
): readonly Condition<T>[] {
  if (!when) return [];
  return Array.isArray(when) ? when : [when];
}

/**
 * True when every condition in `when` holds. No conditions at all is true: an
 * ungated rule publishes, it does not stall.
 */
export function evaluateConditions<T extends FieldValues>(
  values: T,
  when: Conditions<T> | undefined,
): boolean {
  return asConditionList(when).every((condition) =>
    evaluateCondition(values, condition),
  );
}

/* ----------------------------------
 * merge validation patches
 * last matching dependency wins
 * ---------------------------------- */
export function mergeValidationPatch(
  base: ValidationPatch,
  patch?: ValidationPatch,
): ValidationPatch {
  if (!patch) return base;

  return {
    ...base,
    ...patch,
  };
}

export type ResolvedFieldState = {
  visible: boolean;
  /** `true` when a `kind: "disabled"` dependency holds. */
  disabled?: boolean;
  validation: ValidationPatch;
  /**
   * Writes asked for by `kind: "watch"` dependencies whose condition held.
   *
   * `undefined` when there is nothing to write, which is the common case and
   * keeps the builder's effect from running on every keystroke. A write is
   * only emitted when the target does not already hold that value — the rule
   * settles instead of looping on its own notification.
   */
  writes?: ResolvedWatchWrite[];
  /**
   * Present only when an `options` dependency matched. `undefined` means
   * "unchanged", which lets the caller keep the original array by reference
   * and avoid a needless re-render.
   */
  options?: FieldOption[];
};

/* ----------------------------------
 * apply one options patch
 * ---------------------------------- */
export function applyOptionsPatch(
  options: FieldOption[],
  patch: OptionsPatch,
): FieldOption[] {
  if ("set" in patch) return patch.set;
  // By text, so `1` and `"1"` name the same option.
  const has = (values: readonly unknown[], option: FieldOption) =>
    values.some((value) => String(value) === String(option.value));
  if ("keep" in patch) return options.filter((option) => has(patch.keep, option));
  return options.filter((option) => !has(patch.remove, option));
}

export function applyResolvedValidation<F extends FieldNode>(
  field: F,
  validation: ValidationPatch,
  options?: FieldOption[],
  disabled?: boolean,
): F {
  if (field.type === "break" || field.type === "group") return field;

  return {
    ...field,
    ...validation,
    ...(options ? { options } : {}),
    ...(disabled ? { disabled: true } : {}),
  } as F;
}

/* ----------------------------------
 * resolve one field dependencies
 * ---------------------------------- */
export function resolveFieldState<T extends FieldValues>(
  field: FieldNode,
  values: T,
  /**
   * Needed only by `kind: "watch"` with `skipIfDirty`, which asks
   * react-hook-form whether the user has edited the target. Optional so the
   * resolver stays usable from a tool that has a `control`-less form of the
   * config (the visual builder's schema generator).
   */
  control?: Pick<Control<T>, "getFieldState">,
): ResolvedFieldState {
  if (field.type === "break" || field.type === "group") {
    return {
      visible: true,
      validation: {},
    };
  }

  let validation: ValidationPatch = {
    required: field.required,
    minLen: field.minLen,
    maxLen: field.maxLen,
    min: field.min,
    max: field.max,
  };

  let isVisible = true;
  let hasMetVisibleDependency = false;

  // A field type may allow only some kinds of dependency. Resolve against the
  // complete union here; each filter then narrows to the variant that owns the
  // corresponding `then` payload.
  const dependencies = field.dependencies as unknown as Dependency<T>[] | undefined;
  const visibleDependencies =
    dependencies?.filter((dep) => dep.kind === "visible") || [];
  const validationDependencies =
    dependencies?.filter((dep) => dep.kind === "validate") || [];
  const optionsDependencies =
    dependencies?.filter((dep) => dep.kind === "options") || [];
  const watchDependencies =
    dependencies?.filter((dep) => dep.kind === "watch") || [];
  const disabled = (dependencies ?? []).some(
    (dep) => dep.kind === "disabled" && evaluateConditions(values, dep.when),
  );

  if (visibleDependencies.length > 0) {
    for (const dep of visibleDependencies) {
      const matched = evaluateConditions(values, dep.when);
      if (matched) {
        hasMetVisibleDependency = true;
      }
    }
    isVisible = hasMetVisibleDependency;
  }

  for (const dep of validationDependencies) {
    const matched = evaluateConditions(values, dep.when);
    if (matched) {
      validation = mergeValidationPatch(validation, dep.then);
    }
  }

  // Only fields that actually carry options can be narrowed. Patches compose
  // in declaration order, so `keep` then `remove` behaves as written.
  let options: FieldOption[] | undefined;
  if (optionsDependencies.length > 0 && "options" in field) {
    let next = field.options ?? [];
    let matched = false;

    for (const dep of optionsDependencies) {
      if (evaluateConditions(values, dep.when)) {
        next = applyOptionsPatch(next, dep.then);
        matched = true;
      }
    }

    // Leave `options` undefined when nothing matched so the caller can reuse
    // the original array reference.
    if (matched) options = next;
  }

  // A `watch` dependency writes. It is resolved against the same snapshot the
  // other kinds read — the fields `when` tests and `reads` names — which is
  // what keeps a derived value from being computed out of stale state.
  let writes: ResolvedWatchWrite[] | undefined;
  for (const dep of watchDependencies) {
    if (!evaluateConditions(values, dep.when)) continue;

    const target = (dep.then.to ?? field.name) as string;
    const next =
      "from" in dep.then && typeof dep.then.from === "function"
        ? dep.then.from(values as unknown as WatchSnapshot<T>)
        : (dep.then as { set?: unknown }).set;
    const current = getValueByPath(values, target);

    if (dep.then.onlyIfEmpty && isFilled(current)) continue;

    // «The user has taken this field over» is bookkeeping the values do not
    // carry, so it is asked of the form. Reading it here is safe because the
    // target is part of the subscription: the edit that makes this true is the
    // edit that re-runs this pass.
    if (
      dep.then.skipIfDirty &&
      control?.getFieldState(target as Path<T>)?.isDirty
    ) {
      continue;
    }

    if (isStructurallyEqual(current, next)) continue;

    writes = writes ?? [];
    writes.push({
      name: target,
      value: next,
      // A `skipIfDirty` rule must not mistake its own write for an edit, so it
      // writes without touching `dirty`.
      options:
        dep.then.options ??
        (dep.then.skipIfDirty ? { shouldDirty: false } : undefined),
    });
  }

  return {
    visible: isVisible,
    disabled,
    validation,
    options,
    writes,
  };
}
