import type { ReactNode } from "react";
import type { FieldValues, Path } from "react-hook-form";

/* ---------------------------------- */
/* Shared primitives                  */
/* ---------------------------------- */

/** The value an option stands for. A field holds it as it is written here. */
export type OptionValue = string | number;

export type FieldOption = {
  value: OptionValue;
  label: string;
  /** A second line under the label. */
  description?: string;
  /** Shown but not selectable. */
  disabled?: boolean;
  icon?: ReactNode;
};

/**
 * Operators used to evaluate dependency conditions.
 */
export type DependencyOperator =
  /**
   * Equal — true if the field value strictly equals the provided value.
   * Example: fieldValue === value
   */
  | "eq"

  /**
   * Not equal — true if the field value is different from the provided value.
   * Example: fieldValue !== value
   */
  | "neq"

  /**
   * In — true if the field value exists in the provided array.
   * Example: valueArray.includes(fieldValue)
   */
  | "in"

  /**
   * Not in — true if the field value does NOT exist in the provided array.
   * Example: !valueArray.includes(fieldValue)
   */
  | "nin"

  /**
   * Greater than — true if the field value is greater than the provided value.
   * Works with numbers or comparable values.
   * Example: fieldValue > value
   */
  | "gt"

  /**
   * Greater than or equal — true if the field value is greater than or equal to the provided value.
   * Example: fieldValue >= value
   */
  | "gte"

  /**
   * Less than — true if the field value is less than the provided value.
   * Example: fieldValue < value
   */
  | "lt"

  /**
   * Less than or equal — true if the field value is less than or equal to the provided value.
   * Example: fieldValue <= value
   */
  | "lte"

  /**
   * Filled — true if the field holds a value at all.
   *
   * Not the same question as `truthy`: `0` and `false` *are* values here (a
   * longitude of 0 is the Gulf of Guinea, a checkbox set to false is an
   * answer), while `undefined`, `null`, `""`, `"  "`, `NaN` and `[]` are not.
   * Use it for «has the user entered this yet»; use `truthy` for «is this on».
   */
  | "filled"

  /**
   * Empty — the negation of `filled`.
   */
  | "empty"

  /**
   * Truthy — true if the field value is truthy.
   * Examples of truthy: true, non-empty string, non-zero number, object.
   */
  | "truthy"

  /**
   * Falsy — true if the field value is falsy.
   * Examples of falsy: false, null, undefined, 0, "", NaN.
   */
  | "falsy";

/* ---------------------------------- */
/* Dependencies                       */
/* ---------------------------------- */

export type Condition<T extends FieldValues = FieldValues> = {
  field: Path<T>;
  op: DependencyOperator;
  value?: unknown | unknown[];
};

/**
 * One condition, or a list of them that all have to hold.
 *
 * Anything that gates on the form takes this — a field's `dependencies` entry
 * and a watch rule alike — so a single `{ field, op }` and an array of them are
 * both valid. The array is an AND, which is what «only once the province *and*
 * the city are chosen» needs; an empty list is no condition at all, so it
 * holds.
 */
export type Conditions<T extends FieldValues = FieldValues> =
  Condition<T> | Condition<T>[];

export type ValidationPatch = {
  required?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
};

/**
 * How a matching `options` dependency narrows a field's choices.
 *
 * - `set`    — replace the list outright.
 * - `keep`   — keep only these values.
 * - `remove` — drop these values.
 */
export type OptionsPatch =
  | { set: FieldOption[] }
  | { keep: OptionValue[] }
  | { remove: OptionValue[] };

export type Dependency<T extends FieldValues = FieldValues> =
  | {
      kind: "visible";
      when: Conditions<T>;
    }
  /**
   * Keep the field on screen but not usable while the condition holds — a
   * switch that means nothing until the record it qualifies is picked. The
   * value is left as it is; pair it with a `watch` rule to put it back.
   */
  | {
      kind: "disabled";
      when: Conditions<T>;
    }
  | {
      kind: "validate";
      when: Conditions<T>;
      then: ValidationPatch;
    }
  /**
   * Narrow the `options` of a field that has them, based on another field —
   * e.g. only show the cities that belong to the chosen province. Patches
   * apply in order, so several can compose. A field without options ignores it.
   */
  | {
      kind: "options";
      when: Conditions<T>;
      then: OptionsPatch;
    }
  /**
   * Keep an input's *value* managed by the form instead of by the page around
   * it: a slug that follows the title, a code filled from a lookup. (A city
   * that clears when the province changes is a field's `resetOn`.) The field
   * that declares the
   * dependency is the one written unless `then.to` names another.
   *
   * Writing needs more than a `control` (react-hook-form's `setValue` lives on
   * the form, not on the control), so `FormBuilder` has to be handed
   * `setValue` for this kind to do anything at all.
   */
  | {
      kind: "watch";
      when: Conditions<T>;
      then: WatchPatch<T>;
      /**
       * The fields the write reads, so they can be subscribed to. Defaults to
       * the fields `when` tests — which is the whole contract: a rule can only
       * derive from what it declares, so a derived value is never stale.
       */
      reads?: Path<T>[];
    };

/* ---------------------------------- */
/* Watch rules and watch writes       */
/* ---------------------------------- */

/** The react-hook-form options a watch write is applied with. */
export type WatchWriteOptions = {
  shouldValidate?: boolean;
  shouldDirty?: boolean;
  shouldTouch?: boolean;
};

/**
 * What a `watch` dependency writes when its condition holds.
 *
 * ```tsx
 * // the slug keeps up with the title until the user edits it themselves
 * {
 *   name: "slug",
 *   type: "text",
 *   dependencies: [
 *     {
 *       kind: "watch",
 *       when: [
 *         { field: "title", op: "filled" },
 *         { field: "slug", op: "empty" },
 *       ],
 *       then: { from: ({ title }) => slugify(String(title)) },
 *     },
 *   ],
 * }
 * ```
 *
 * `when` doubles as the input list: everything the rule tests is watched, and
 * anything else `set` wants to read has to be named in `reads`.
 */
export type WatchPatch<T extends FieldValues = FieldValues> = {
  /** Another field to write. Defaults to the one that declares the dependency. */
  to?: Path<T>;
  /**
   * Seed a blank: skip the write once the target holds a value of its own.
   *
   * Read the name literally — it is about emptiness, not about authorship. That
   * makes it the right flag for filling a field *in* (a generated code, a
   * default from the record being copied) and the wrong one for «follow the
   * driver until the user touches this»: after the first write the field is no
   * longer empty, so a derived value would freeze at whatever the first
   * keystroke produced. Use `skipIfDirty` for that.
   */
  onlyIfEmpty?: boolean;
  /**
   * Defer to the user: skip the write once they have changed the target
   * themselves (react-hook-form's `isDirty` for that field).
   *
   * This is the flag that makes «the slug keeps up with the title until I edit
   * the slug» true. The rule's own writes are applied without marking the field
   * dirty, which is what lets the flag mean *the user* edited it rather than
   * «the field is different from the default».
   */
  skipIfDirty?: boolean;
  /** react-hook-form's write options. Defaults to `validate` + `dirty`. */
  options?: WatchWriteOptions;
} & (
  | {
      /** The value to write. */
      set: unknown;
      from?: never;
    }
  | {
      /**
       * Derive the value from the form instead of naming it.
       *
       * The function sees the same snapshot the conditions read — the fields
       * `when` tests and `reads` names, nothing else — which is what keeps a
       * derived value from going stale.
       *
       * Return plain form data. A write is skipped only when the target already
       * holds a structurally equal value, so a rule that returns a fresh `Date`
       * or class instance every pass never settles: return the timestamp or the
       * ISO string.
       */
      from: (values: WatchSnapshot<T>) => unknown;
      set?: never;
    }
);

/**
 * What a watch rule publishes by default: the watched fields, by name.
 *
 * The keys are the field paths exactly as they were asked for, so a nested path
 * is one flat key rather than a tree — see `getValueByPath`.
 */
export type WatchSnapshot<T extends FieldValues = FieldValues> = Partial<
  Record<Path<T>, unknown>
>;

/**
 * A dependency whose result is published to a **surface** instead of patched
 * onto a field.
 *
 * `visible`, `validate` and `options` all end their life inside one
 * `FormFieldConfig`. A map panel, a live summary or a preview is not a field:
 * it sits next to the builder, it wants a *derived* value rather than a patch,
 * and it needs to say when it wants to hear about the form at all. That last
 * part is the reason the rule has a gate: the station map does not want the
 * latitude the user is halfway through typing, it wants a location, which
 * exists only once both coordinates are filled.
 *
 * ```tsx
 * const location = useFieldWatch(form.control, {
 *   watch: ["latitude", "longitude"],
 * });
 * // → null until both hold a value, the pair of them afterwards
 * ```
 *
 * Both optional keys default, and they default towards that case: `watch`
 * falls back to the fields `when` reads, and `when` falls back to «every
 * watched field is `filled`». `select` is for a surface that wants the pair as
 * numbers rather than as whatever the text inputs hold.
 */
export type FieldWatchRule<
  T extends FieldValues = FieldValues,
  R = WatchSnapshot<T>,
> = {
  /** The fields to subscribe to. Defaults to the fields `when` reads. */
  watch?: Path<T>[];
  /** Must all hold for the rule to publish. Defaults to every watched field being `filled`. */
  when?: Conditions<T>;
  /** Derive what the surface receives. Defaults to the snapshot itself. */
  select?: (values: WatchSnapshot<T>) => R;
};

/* ---------------------------------- */
/* What the logic reads of a field    */
/* ---------------------------------- */

/**
 * The part of a field's config that the form logic reads. The config of one
 * field type has more (an adapter decides what), so every function here takes
 * `F extends FieldNode` and gives `F` back.
 */
export interface FieldNode {
  type: string;
  name?: string;
  permission?: string;
  writePermission?: string;
  disabled?: boolean;
  required?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
  options?: FieldOption[];
  /** The fields an options loader reads. */
  optionsDeps?: string[];
  /** Fields whose change puts this one back to its starting value. */
  resetOn?: string[];
  dependencies?: Dependency<FieldValues>[];
  /** The fields of a `group`, or of each row of an `array`. */
  fields?: FieldNode[];
  /** Fields drawn inside another field. */
  trailing?: FieldNode[];
}
