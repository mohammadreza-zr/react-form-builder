import type { FieldNode } from "./types.js";

/**
 * The fields the user may see, each read-only where they may not change it:
 * a field without its `permission` leaves the form, one without its
 * `writePermission` stays disabled. A group keeps the fields left to it and
 * goes when none are; fields drawn inside another (`trailing`) follow the
 * same rules.
 */
export function applyFieldAccess<F extends FieldNode>(
  fields: F[],
  can: (name: string) => boolean,
): F[] {
  return fields.flatMap((field): F[] => {
    if (field.type === "break") return [field];
    if (field.type === "group") {
      if (field.permission && !can(field.permission)) return [];
      const inner = applyFieldAccess(field.fields ?? [], can);
      return inner.length === 0 ? [] : [{ ...field, fields: inner }];
    }
    // An array's row fields are checked by the builder of each row, which
    // knows their full names and puts denied ones back to their defaults.
    const { permission, writePermission, ...rest } = field;
    if (permission && !can(permission)) return [];
    const trailing =
      "trailing" in rest && rest.trailing
        ? applyFieldAccess(rest.trailing, can)
        : undefined;
    if (!permission && !writePermission && !trailing) return [field];
    // The keys go: renderers spread what they do not read onto the element.
    const locked = Boolean(writePermission) && !can(writePermission ?? "");
    return [
      {
        ...rest,
        ...(trailing && { trailing }),
        ...(writePermission && { disabled: rest.disabled || locked }),
      } as unknown as F,
    ];
  });
}
