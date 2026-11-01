import { useEffect, useMemo, useRef } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
  get,
  useFormState,
  useWatch,
} from "react-hook-form";

import { applyResolvedValidation, resolveFieldState } from "../core/dependency.js";
import { collectDependencyFields } from "../core/dependency-fields.js";
import { applyFieldAccess } from "../core/field-access.js";
import { collectDeniedNames, collectHiddenNames } from "../core/hidden-fields.js";
import { resolveLocalizedField } from "../core/localized-field.js";
import type { FieldNode } from "../core/types.js";
import { applyWatchWrites } from "../core/watch-writes.js";

export interface UseFormFieldsOptions<F extends FieldNode, T extends FieldValues> {
  /**
   * Needed by `kind: "watch"` (writes a value) and `kind: "visible"` (puts a
   * field it hides back to its default): react-hook-form keeps `setValue` on
   * the form, not on the `control`. Without it those rules are ignored, and
   * `warn` says so once.
   */
  setValue?: UseFormSetValue<T>;
  /** Whether the user holds a permission. Without it every field is allowed. */
  can?: (permission: string) => boolean;
  /** The language the texts are resolved to. Without it they are left as written. */
  locale?: string;
  /** The language used when `locale` has no text. Defaults to `locale`. */
  fallbackLocale?: string;
  /** Runs on the fields before access and language — add icons, expand shorthands. */
  prepare?: (fields: F[]) => F[];
  /** Where the missing-`setValue` message goes. Defaults to `console.warn`. */
  warn?: (message: string) => void;
}

/** One item of the form after a pass: what to draw, and whether to. */
export interface FormFieldItem<F extends FieldNode> {
  /** The key to render it under: the field's name, else its position. */
  key: string | number;
  /** The field before its dependencies were applied. */
  field: F;
  visible: boolean;
  /** The field with its dependencies applied (validation, options, disabled). */
  resolved: F;
}

const MISSING_SET_VALUE =
  "[react-form-builder] a `watch` or `visible` dependency needs the form's `setValue` to write. " +
  "Pass `setValue={form.setValue}` — the rule is otherwise ignored.";

/**
 * Everything a form does to its field list, without drawing it: apply the
 * user's access and language, follow the dependencies, write what `watch`
 * rules ask for, and put hidden and denied fields back to their defaults.
 *
 * The subscription is narrow on purpose. `useWatch({ control })` with no name
 * subscribes to every field, so one keystroke re-renders every input; this
 * watches only the names some `dependencies` entry reads, and nothing at all
 * when nothing depends on anything. Fields without `dependencies` keep the
 * identity of their config, so a memoised field does not re-render when
 * another one changes.
 */
export function useFormFields<F extends FieldNode, T extends FieldValues = FieldValues>(
  // A variance wildcard: the form's context and submit transform do not matter here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<T, any, any>,
  inputFields: F[],
  options: UseFormFieldsOptions<F, T> = {},
): FormFieldItem<F>[] {
  const { setValue, can, locale, fallbackLocale, prepare, warn } = options;

  const { fields, deniedNames } = useMemo(() => {
    const all = prepare ? prepare(inputFields) : inputFields;
    const allowed = can ? applyFieldAccess(all, can) : all;
    return {
      fields: locale
        ? allowed.map((f) => resolveLocalizedField(f, locale, fallbackLocale ?? locale))
        : allowed,
      deniedNames: collectDeniedNames(all, allowed),
    };
  }, [inputFields, prepare, can, locale, fallbackLocale]);

  const watched = useMemo(() => collectDependencyFields(fields), [fields]);

  // Called unconditionally: with nothing to watch the name list is empty, so
  // react-hook-form subscribes to no field and this never re-renders on input.
  const watchedValues = useWatch({
    control,
    name: (watched ?? []) as never,
  }) as unknown[];

  const dependencyValues = useMemo(() => {
    const snapshot: Record<string, unknown> = {};
    watched?.forEach((name, index) => {
      snapshot[name] = watchedValues?.[index];
    });
    return snapshot as T;
  }, [watched, watchedValues]);

  const items = useMemo(
    () =>
      fields.map((field, index): FormFieldItem<F> & { writes?: ReturnType<typeof resolveFieldState>["writes"] } => {
        const key = field.name ?? index;

        if (field.type === "break" || field.type === "group" || !field.dependencies?.length) {
          return { key, field, visible: true, resolved: field };
        }

        const state = resolveFieldState<T>(field, dependencyValues, control);

        return {
          key,
          field,
          visible: state.visible,
          resolved: state.visible
            ? applyResolvedValidation(field, state.validation, state.options, state.disabled)
            : field,
          // A hidden field's rule still resolves, but writing into a field the
          // user cannot see is how values get invented behind their back.
          writes: state.visible ? state.writes : undefined,
        };
      }),
    [fields, dependencyValues, control],
  );

  // Writes happen after the render that decided them, never during it:
  // `setValue` notifies the watchers, the resolver runs again, and the second
  // pass produces nothing because the target now holds the value.
  const writes = useMemo(() => items.flatMap((item) => item.writes ?? []), [items]);

  // Joined into a string so the effect follows the set of names, not the pass
  // that built it.
  const hiddenNames = useMemo(() => collectHiddenNames(items).join("\n"), [items]);
  const deniedKey = deniedNames.join("\n");
  const { defaultValues } = useFormState({ control });

  const warned = useRef(false);

  useEffect(() => {
    if (writes.length === 0 && !hiddenNames) return;

    if (!setValue) {
      if (!warned.current) {
        warned.current = true;
        (warn ?? console.warn)(MISSING_SET_VALUE);
      }
      return;
    }

    applyWatchWrites<T>(writes, setValue);
  }, [writes, hiddenNames, setValue, warn]);

  useEffect(() => {
    if (!hiddenNames || !setValue) return;
    for (const name of hiddenNames.split("\n")) {
      setValue(name as Path<T>, get(defaultValues, name) as never);
    }
    // The defaults are read when a field is hidden, not followed: a form
    // reset is not a field leaving the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenNames, setValue]);

  useEffect(() => {
    if (!deniedKey || !setValue) return;
    for (const name of deniedKey.split("\n")) {
      setValue(name as Path<T>, get(defaultValues, name) as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deniedKey, setValue]);

  return items;
}
