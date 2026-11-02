import type { FieldNode } from "./types.js";

/**
 * Every field name a config carries: its own and those nested inside it. An
 * array's row fields are named relative to each row, so the array's own name
 * stands for them.
 */
function fieldNames(field: FieldNode) {
  const names: string[] = [];
  if ("name" in field && field.name) names.push(field.name);
  const nested = [
    ...(field.type === "array" ? [] : (field.fields ?? [])),
    ...(field.trailing ?? []),
  ];
  for (const child of nested) names.push(...fieldNames(child));
  return names;
}

/**
 * The names a pass took out of the form: a hidden field's own and those
 * nested in it, which leave with it. A name another visible field still
 * renders — two layouts of one value, one shown at a time — is not hidden.
 */
export function collectHiddenNames(
  entries: { field: FieldNode; visible: boolean }[],
) {
  const shown = new Set(
    entries
      .filter((entry) => entry.visible)
      .flatMap(({ field }) => fieldNames(field)),
  );
  const hidden = new Set(
    entries
      .filter((entry) => !entry.visible)
      .flatMap(({ field }) => fieldNames(field)),
  );
  return [...hidden].filter((name) => !shown.has(name));
}

/**
 * The names a role's permissions took out of the form (`applyFieldAccess`):
 * those `before` carries and `after` no longer does. They go back to their
 * defaults like any hidden field, so a value the user may not see is never
 * sent — one restored from an earlier search included.
 */
export function collectDeniedNames(before: FieldNode[], after: FieldNode[]) {
  const kept = new Set(after.flatMap(fieldNames));
  return [...new Set(before.flatMap(fieldNames))].filter(
    (name) => !kept.has(name),
  );
}
