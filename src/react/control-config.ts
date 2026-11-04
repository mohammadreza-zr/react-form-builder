/**
 * The config keys the builder owns: what binds, validates, places and loads a
 * field. A component reads them from its props or not at all, and never puts
 * them on an element.
 */
export const BUILDER_KEYS = [
  "type",
  "name",
  "dependencies",
  "permission",
  "writePermission",
  "defaultValue",
  "minLen",
  "maxLen",
  "min",
  "max",
  "pattern",
  "validate",
  "messages",
  "resetOn",
  "width",
  "grow",
  "colSpan",
  "className",
  "inputProps",
  "format",
  "parse",
  "normalize",
  "options",
  "loadOptions",
  "optionsDeps",
  "optionsKey",
  "loadOn",
  "searchDelay",
  "optionsMaxAge",
  "trailing",
  "fields",
] as const;

/** A config without `BUILDER_KEYS`. */
export type ControlConfig<C> = Omit<C, (typeof BUILDER_KEYS)[number]>;

/**
 * The config without the keys the builder owns, for a component that spreads
 * the rest (`label`, `placeholder`, the keys its own type adds) onto its
 * control. `required`, `disabled` and `readOnly` stay; the props have the
 * resolved ones.
 */
export function configForControl<C extends object>(
  config: C,
): ControlConfig<C> {
  const rest = { ...config } as Record<string, unknown>;
  for (const key of BUILDER_KEYS) delete rest[key];
  return rest as ControlConfig<C>;
}
