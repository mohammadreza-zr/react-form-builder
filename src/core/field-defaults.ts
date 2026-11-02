import type { FieldNode } from "./types.js";

/**
 * Config keys every field of a type starts with, so a project states a choice
 * once instead of on each field: `{ "*": { width: 320 }, select: { clearable:
 * true } }`. `"*"` applies to every field with a name; a type's own entry
 * comes after it, and the field's config after both.
 */
export type FieldDefaults = Record<string, Record<string, unknown>>;

/**
 * The fields with the project's defaults under their own keys. Groups and a
 * field's `trailing` fields are handled too; an array's row fields are left to
 * the builder of each row, which applies the same defaults.
 */
export function applyFieldDefaults<F extends FieldNode>(fields: F[], defaults: FieldDefaults | undefined): F[] {
  if (!defaults || Object.keys(defaults).length === 0) return fields;
  return fields.map((field) => withDefaults(field, defaults));
}

function withDefaults<F extends FieldNode>(field: F, defaults: FieldDefaults): F {
  if (field.type === "break") return field;
  if (field.type === "group") {
    return {
      ...defaults.group,
      ...field,
      fields: applyFieldDefaults(field.fields ?? [], defaults),
    } as F;
  }
  const merged = { ...defaults["*"], ...defaults[field.type], ...field } as F;
  if (field.trailing) merged.trailing = applyFieldDefaults(field.trailing, defaults);
  return merged;
}
